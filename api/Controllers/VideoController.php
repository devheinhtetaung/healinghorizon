<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Core\JaaSTokenManager;
use Api\Models\Appointment;
use Api\Models\VideoConferenceModel;
use Api\Models\Patient;
use Api\Models\Consultant;

class VideoController
{
    // Join window: allow entry this many minutes before the scheduled start,
    // through the scheduled end. There is no duration column on `Appointment`
    // yet, so a fixed 60-minute session length is assumed — a `durationMinutes`
    // column should be added to make this data-driven rather than a constant.
    private const EARLY_JOIN_MINUTES = 10;
    private const SESSION_DURATION_MINUTES = 60;
    // Stuck-session fallback: once the scheduled session has ended AND this
    // grace period has elapsed, a session with at least one recorded leave
    // (the other side likely crashed/closed without a clean signal) is
    // completed anyway rather than hanging forever.
    private const COMPLETION_GRACE_MINUTES = 15;

    // Appointments are stored as naive wall-clock in this timezone (the
    // platform's operational zone). The join-window comparison is done in UTC
    // (see Appointment::getJoinWindowState), so this offset is the single
    // source of truth for interpreting stored times. A UTC-storage migration
    // would set this to '+00:00' and convert on the client.
    private const BOOKING_TIMEZONE = '+06:30';

    private Appointment $apptModel;
    private VideoConferenceModel $videoModel;
    private Patient $patientModel;
    private Consultant $consultantModel;
    private JaaSTokenManager $jaasToken;

    public function __construct(
        ?Appointment $apptModel = null,
        ?VideoConferenceModel $videoModel = null,
        ?Patient $patientModel = null,
        ?Consultant $consultantModel = null,
        ?JaaSTokenManager $jaasTokenManager = null
    ) {
        $this->apptModel       = $apptModel ?? new Appointment();
        $this->videoModel      = $videoModel ?? new VideoConferenceModel();
        $this->patientModel    = $patientModel ?? new Patient();
        $this->consultantModel = $consultantModel ?? new Consultant();
        $this->jaasToken       = $jaasTokenManager ?? new JaaSTokenManager();
    }

    public function createVideo(Request $request): void
    {
        $id = (int) $request->param('id');
        $appointment = $this->apptModel->findById($id);

        if (!$appointment) {
            Response::error('Appointment not found.', 404);
        }

        $participant = $this->checkOwnership($request, $appointment);
        $this->checkJoinWindow($id);

        $isNew = empty($appointment['conferenceId']);
        $conferenceId = $isNew ? 0 : (int) $appointment['conferenceId'];

        if ($isNew) {
            $roomSlug = 'hh-' . $id . '-' . bin2hex(random_bytes(8));
            $conferenceId = $this->videoModel->create($roomSlug);
            $this->apptModel->linkVideo($id, $conferenceId);
        }

        $video = $this->videoModel->findById($conferenceId);
        if (!$video) {
            Response::error('Video session not found.', 404);
        }

        // Mark this participant as joined — the completion logic uses this as
        // the "genuine call" marker (both roles must have joined).
        $this->videoModel->recordJoin($conferenceId, $participant['role']);

        $this->respondWithRoom($video, $appointment, $participant, $isNew ? 201 : 200);
    }

    public function recordLeave(Request $request): void
    {
        $id = (int) $request->param('id');
        $appointment = $this->apptModel->findById($id);

        if (!$appointment) {
            Response::error('Appointment not found.', 404);
        }

        $participant = $this->checkOwnership($request, $appointment);

        $conferenceId = (int) ($appointment['conferenceId'] ?? 0);
        if (!$conferenceId) {
            // No call was ever created for this appointment — nothing to end.
            Response::json(['status' => 'no-call', 'appointmentId' => $id], 200);
        }

        $this->videoModel->recordLeave($conferenceId, $participant['role']);

        $conference = $this->videoModel->findById($conferenceId);
        $completed  = $this->maybeComplete($appointment, $conference ?: []);

        Response::json([
            'status'        => $completed ? 'completed' : 'left',
            'appointmentId' => $id,
        ], 200);
    }

    public function getVideo(Request $request): void
    {
        $roomName = $request->param('roomName');
        $video = $this->videoModel->findByRoomName($roomName);

        if (!$video) {
            Response::error('Video session not found.', 404);
        }

        // A joinable room must be linked to an appointment so that ownership
        // and the join-window can be enforced.
        $appt = $this->apptModel->findByVideoRoom($roomName);
        if (!$appt) {
            Response::error('Video session not found.', 404);
        }

        $participant = $this->checkOwnership($request, $appt);
        $this->checkJoinWindow((int) $appt['appointmentId']);

        [$nbf, $exp] = $this->joinWindowEpochs($appt);
        $token = $this->jaasToken->issueForParticipant(
            (string) $video['roomName'],
            $participant['name'],
            $participant['email'],
            $participant['id'],
            $participant['moderator'],
            $nbf,
            $exp
        );

        Response::json([
            'video'       => $video,
            'appointment' => $appt,
            'roomName'    => $this->jaasToken->jaasRoomName((string) $video['roomName']),
            'token'       => $token,
        ]);
    }

    /**
     * Validate ownership AND return the authenticated participant's identity
     * for token minting. Only owners ever reach a token.
     *
     * @return array{role:string, id:string, name:string, email:string, moderator:bool}
     */
    private function checkOwnership(Request $request, array $appointment): array
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $role   = $request->user['role'] ?? '';

        if ($role === 'patient') {
            $patient = $this->patientModel->findByUserId($userId);
            if (!$patient || (int) $patient['patientId'] !== (int) $appointment['patientId']) {
                Response::error('Forbidden.', 403);
            }
            return [
                'role'      => 'patient',
                'id'        => (string) $userId,
                'name'      => $patient['name'] ?? 'Patient',
                'email'     => $patient['email'] ?? '',
                'moderator' => false,
            ];
        }

        if ($role === 'consultant') {
            $consultant = $this->consultantModel->findByUserId($userId);
            if (!$consultant || (int) $consultant['consultantId'] !== (int) $appointment['consultantId']) {
                Response::error('Forbidden.', 403);
            }
            return [
                'role'      => 'consultant',
                'id'        => (string) $userId,
                'name'      => $consultant['name'] ?? 'Consultant',
                'email'     => $consultant['email'] ?? '',
                'moderator' => true,
            ];
        }

        Response::error('Unauthorised.', 403);
    }

    private function respondWithRoom(array $video, array $appointment, array $participant, int $status): void
    {
        $slug = (string) ($video['roomName'] ?? '');
        [$nbf, $exp] = $this->joinWindowEpochs($appointment);

        $response = $video;
        $response['roomName'] = $this->jaasToken->jaasRoomName($slug);
        $response['token']    = $this->jaasToken->issueForParticipant(
            $slug,
            $participant['name'],
            $participant['email'],
            $participant['id'],
            $participant['moderator'],
            $nbf,
            $exp
        );

        Response::json($response, $status);
    }

    /**
     * @return array{0:int,1:int} [nbf, exp] — the token lifetime is bounded to
     * the appointment's join window, not a long-lived generic expiry.
     */
    private function joinWindowEpochs(array $appointment): array
    {
        $start = $this->startEpoch($appointment);

        return [
            $start - (self::EARLY_JOIN_MINUTES * 60),
            $start + (self::SESSION_DURATION_MINUTES * 60),
        ];
    }

    /**
     * Transition the appointment to "completed" once both roles have left a
     * genuine call, or the stuck-session fallback fires.
     *
     * Guards:
     *   - only a 'confirmed' appointment can complete (never 'cancelled' or
     *     an already-completed one);
     *   - both roles must have actually joined (a one-sided no-show never
     *     completes);
     *   - otherwise require both leave events, OR at least one leave event
     *     once the scheduled end + grace period has passed.
     */
    private function maybeComplete(array $appointment, array $conference): bool
    {
        if ($appointment['status'] !== 'confirmed') {
            return false;
        }

        if (!$this->videoModel->bothJoined($conference)) {
            return false;
        }

        $bothLeft  = $this->videoModel->bothLeft($conference);
        $pastGrace = $this->pastFallbackThreshold($appointment)
            && $this->videoModel->anyLeft($conference);

        if (!$bothLeft && !$pastGrace) {
            return false;
        }

        $this->apptModel->updateStatus((int) $appointment['appointmentId'], 'completed');
        $this->videoModel->markEnded((int) $conference['conferenceId']);

        return true;
    }

    private function pastFallbackThreshold(array $appointment): bool
    {
        $deadline = $this->startEpoch($appointment)
            + ((self::SESSION_DURATION_MINUTES + self::COMPLETION_GRACE_MINUTES) * 60);

        return time() >= $deadline;
    }

    /** Scheduled start as a UTC epoch (from startsAt, else naive wall-clock in BOOKING_TIMEZONE). */
    private function startEpoch(array $appointment): int
    {
        $start = isset($appointment['startsAt']) && $appointment['startsAt']
            ? strtotime((string) $appointment['startsAt'])
            : false;

        if ($start === false) {
            $dt = new \DateTime(
                ($appointment['appointmentDate'] ?? date('Y-m-d'))
                . ' '
                . ($appointment['appointmentTime'] ?? '12:00:00'),
                new \DateTimeZone(self::BOOKING_TIMEZONE)
            );
            $dt->setTimezone(new \DateTimeZone('UTC'));
            $start = $dt->getTimestamp();
        }

        return (int) $start;
    }

    /**
     * Enforce the appointment join window (server-side security boundary).
     *
     * Allows joining from EARLY_JOIN_MINUTES before the scheduled start time
     * through SESSION_DURATION_MINUTES after it. The comparison is performed
     * in UTC (via Appointment::getJoinWindowState) so it is independent of the
     * database server's configured timezone; appointment times are interpreted
     * as BOOKING_TIMEZONE.
     *
     * Returns a structured 403 with the scheduled start time when the session
     * is not open yet, and a distinct 403 when it has already ended.
     */
    private function checkJoinWindow(int $appointmentId): void
    {
        $state = $this->apptModel->getJoinWindowState(
            $appointmentId,
            self::EARLY_JOIN_MINUTES,
            self::SESSION_DURATION_MINUTES,
            self::BOOKING_TIMEZONE
        );

        if (!$state) {
            Response::error('Appointment not found.', 404);
        }

        if ($state['state'] === 'early') {
            Response::error(
                'This session is not open yet. It starts at '
                . $state['startTime']
                . ' on '
                . $state['startDate']
                . '.',
                403
            );
        }

        if ($state['state'] === 'late') {
            Response::error('This session has ended.', 403);
        }
    }
}
