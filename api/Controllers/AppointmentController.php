<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\Appointment;
use Api\Models\AvailabilityModel;
use Api\Models\Patient;
use Api\Models\Consultant;
use Api\Models\User;
use Api\Models\NotificationModel;

class AppointmentController
{
    private Appointment $apptModel;
    private Patient $patientModel;
    private Consultant $consultantModel;
    private User $userModel;
    private AvailabilityModel $availabilityModel;
    private NotificationModel $notifModel;

    public function __construct(
        ?Appointment $apptModel = null,
        ?Patient $patientModel = null,
        ?Consultant $consultantModel = null,
        ?User $userModel = null,
        ?AvailabilityModel $availabilityModel = null,
        ?NotificationModel $notifModel = null
    ) {
        $this->apptModel         = $apptModel ?? new Appointment();
        $this->patientModel      = $patientModel ?? new Patient();
        $this->consultantModel   = $consultantModel ?? new Consultant();
        $this->userModel         = $userModel ?? new User();
        $this->availabilityModel = $availabilityModel ?? new AvailabilityModel();
        $this->notifModel        = $notifModel ?? new NotificationModel();
    }

    public function index(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $role   = $request->user['role'] ?? '';

        if ($role === 'patient') {
            $patient = $this->patientModel->findByUserId($userId);
            if (!$patient) Response::error('Patient profile not found.', 404);
            $appointments = $this->apptModel->findByPatient((int) $patient['patientId']);
        } elseif ($role === 'consultant') {
            $consultant = $this->consultantModel->findByUserId($userId);
            if (!$consultant) Response::error('Consultant profile not found.', 404);
            $appointments = $this->apptModel->findByConsultant((int) $consultant['consultantId']);
        } else {
            Response::error('Unauthorised role for appointments.', 403);
        }

        Response::json($appointments);
    }

    public function show(Request $request): void
    {
        $id = (int) $request->param('id');
        $appointment = $this->apptModel->findById($id);

        if (!$appointment) {
            Response::error('Appointment not found.', 404);
        }

        $this->checkOwnership($request, $appointment);

        Response::json($appointment);
    }

    public function create(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $patient = $this->patientModel->findByUserId($userId);
        if (!$patient) Response::error('Patient profile not found.', 404);

        $data = $request->all();

        // Validate
        if (empty($data['consultantId']))    Response::error('consultantId is required.', 422);
        if (empty($data['appointmentDate'])) Response::error('appointmentDate is required.', 422);
        if (empty($data['appointmentTime'])) Response::error('appointmentTime is required.', 422);

        $consultant = $this->consultantModel->findById((int) $data['consultantId']);
        if (!$consultant || !$consultant['isVerified']) {
            Response::error('Consultant not found or not verified.', 422);
        }

        // Normalize time format: "10:30 AM" → "10:30:00"
        $time = $this->normalizeTime($data['appointmentTime']);

        // Reject bookings outside the consultant's real availability (recurring
        // hours minus overrides) or on an already-booked slot, so the booking
        // flow can't double-book even if the client's slot list is stale.
        if (!$this->availabilityModel->isTimeAvailable(
            (int) $data['consultantId'],
            (string) $data['appointmentDate'],
            $time
        )) {
            Response::error('This time slot is no longer available. Please choose a different time.', 409);
        }

        $apptId = $this->apptModel->create([
            'patientId'       => (int) $patient['patientId'],
            'consultantId'    => (int) $data['consultantId'],
            'appointmentDate' => $data['appointmentDate'],
            'appointmentTime' => $time,
        ]);

        // Notify the consultant that a patient booked them.
        $this->notifModel->create([
            'userId'  => (int) $consultant['userId'],
            'message' => sprintf(
                '%s booked an appointment with you for %s.',
                $patient['name'] ?? 'A patient',
                $this->formatWhen($data['appointmentDate'], $time)
            ),
        ]);

        $appointment = $this->apptModel->findById($apptId);
        Response::json($appointment, 201);
    }

    public function updateStatus(Request $request): void
    {
        $id = (int) $request->param('id');
        $appointment = $this->apptModel->findById($id);

        if (!$appointment) {
            Response::error('Appointment not found.', 404);
        }

        $this->checkOwnership($request, $appointment);

        $status = $request->input('status');
        $allowed = ['confirmed', 'completed', 'cancelled'];

        if (!in_array($status, $allowed, true)) {
            Response::error('Invalid status. Allowed: ' . implode(', ', $allowed), 422);
        }

        $declineReason = $request->input('declineReason');

        // A consultant declining a booking must give the patient a reason
        // (Round E6 recommendation, adopted by default — see implementation note).
        if ($status === 'cancelled'
            && ($request->user['role'] ?? '') === 'consultant'
            && trim((string) ($declineReason ?? '')) === '') {
            Response::error('A decline reason is required when cancelling a booking.', 422);
        }

        $reason = trim((string) ($declineReason ?? '')) !== ''
            ? trim((string) $declineReason)
            : null;

        $this->apptModel->updateStatus($id, $status, $reason);

        $role = $request->user['role'] ?? '';
        $when = $this->formatWhen($appointment['appointmentDate'] ?? '', $appointment['appointmentTime'] ?? '');

        // Confirm → notify the patient.
        if ($status === 'confirmed') {
            $patient = $this->patientModel->findById((int) $appointment['patientId']);
            if ($patient) {
                $this->notifModel->create([
                    'userId'  => (int) $patient['userId'],
                    'message' => sprintf(
                        '%s confirmed your appointment for %s.',
                        $appointment['consultantName'] ?? 'Your consultant',
                        $when
                    ),
                ]);
            }
        }

        // Cancel → notify the opposite party.
        if ($status === 'cancelled') {
            if ($role === 'consultant') {
                // Consultant declined → notify the patient (with the reason).
                $patient = $this->patientModel->findById((int) $appointment['patientId']);
                if ($patient) {
                    $base = sprintf(
                        '%s cancelled your appointment for %s.',
                        $appointment['consultantName'] ?? 'Your consultant',
                        $when
                    );
                    $this->notifModel->create([
                        'userId'  => (int) $patient['userId'],
                        'message' => $reason ? $base . ' Reason: ' . $reason : $base,
                    ]);
                }
            } else {
                // Patient cancelled → notify the consultant.
                $consultant = $this->consultantModel->findById((int) $appointment['consultantId']);
                if ($consultant) {
                    $this->notifModel->create([
                        'userId'  => (int) $consultant['userId'],
                        'message' => sprintf(
                            '%s cancelled their appointment with you for %s.',
                            $appointment['patientName'] ?? 'A patient',
                            $when
                        ),
                    ]);
                }
            }
        }

        $updated = $this->apptModel->findById($id);
        Response::json($updated);
    }

    /**
     * Human-readable date/time for notifications: "Sep 14 at 9:00 AM".
     */
    private function formatWhen(string $dateStr, string $timeStr): string
    {
        $ts = strtotime($dateStr . ' ' . $timeStr);
        if ($ts === false) {
            return $dateStr . ' at ' . $timeStr;
        }
        return date('M j', $ts) . ' at ' . date('g:i A', $ts);
    }

    private function checkOwnership(Request $request, array $appointment): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $role   = $request->user['role'] ?? '';

        if ($role === 'patient') {
            $patient = $this->patientModel->findByUserId($userId);
            if (!$patient || (int) $patient['patientId'] !== (int) $appointment['patientId']) {
                Response::error('Forbidden — you do not own this appointment.', 403);
            }
        } elseif ($role === 'consultant') {
            $consultant = $this->consultantModel->findByUserId($userId);
            if (!$consultant || (int) $consultant['consultantId'] !== (int) $appointment['consultantId']) {
                Response::error('Forbidden — you do not own this appointment.', 403);
            }
        } else {
            Response::error('Unauthorised.', 403);
        }
    }

    /**
     * Convert "10:30 AM" or "2:00 PM" → "10:30:00" / "14:00:00"
     */
    private function normalizeTime(string $time): string
    {
        // Already in HH:MM:SS format
        if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $time)) {
            return $time;
        }

        // Parse "HH:MM AM/PM" format
        if (preg_match('/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i', trim($time), $m)) {
            $hour   = (int) $m[1];
            $minute = (int) $m[2];
            $meridiem = strtoupper($m[3]);

            if ($meridiem === 'PM' && $hour < 12) {
                $hour += 12;
            } elseif ($meridiem === 'AM' && $hour === 12) {
                $hour = 0;
            }

            return sprintf('%02d:%02d:00', $hour, $minute);
        }

        // Fallback: return as-is (let MySQL reject it with a clear error)
        return $time;
    }
}
