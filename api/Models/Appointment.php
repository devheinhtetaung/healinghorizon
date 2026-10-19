<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class Appointment
{
    private PDO $db;

    // Appointments are stored as naive wall-clock in the platform's booking
    // timezone. This offset is the single source of truth for interpreting
    // stored times into a reliable instant — the same value VideoController
    // uses for its join-window boundary.
    public const BOOKING_TIMEZONE = '+06:30';

    // Computed column emitted on every read: the scheduled start as an
    // unambiguous ISO 8601 UTC timestamp ("YYYY-MM-DDTHH:MM:SSZ") so the
    // frontend never has to guess a timezone from the naive date/time fields.
    private const STARTS_AT_COLUMN =
        "DATE_FORMAT(CONVERT_TZ(TIMESTAMP(a.appointmentDate, a.appointmentTime), '"
        . self::BOOKING_TIMEZONE
        . "', '+00:00'), '%Y-%m-%dT%H:%i:%sZ') AS startsAt";

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findById(int $appointmentId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT a.*, u.name AS patientName, c2.name AS consultantName,
                    vc.roomName, vc.status AS videoStatus,
                    ' . self::STARTS_AT_COLUMN . '
             FROM `Appointment` a
             JOIN `Patient` p ON p.patientId = a.patientId
             JOIN `Users` u ON u.userId = p.userId
             JOIN `Consultant` c ON c.consultantId = a.consultantId
             JOIN `Users` c2 ON c2.userId = c.userId
             LEFT JOIN `VideoConference` vc ON vc.conferenceId = a.conferenceId
             WHERE a.appointmentId = :id LIMIT 1'
        );
        $stmt->execute(['id' => $appointmentId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByPatient(int $patientId): array
    {
        $stmt = $this->db->prepare(
            'SELECT a.*, c2.name AS consultantName,
                    vc.roomName, vc.status AS videoStatus,
                    ' . self::STARTS_AT_COLUMN . '
             FROM `Appointment` a
             JOIN `Consultant` c ON c.consultantId = a.consultantId
             JOIN `Users` c2 ON c2.userId = c.userId
             LEFT JOIN `VideoConference` vc ON vc.conferenceId = a.conferenceId
             WHERE a.patientId = :pid
             ORDER BY a.appointmentDate DESC, a.appointmentTime DESC'
        );
        $stmt->execute(['pid' => $patientId]);
        return $stmt->fetchAll();
    }

    public function findByConsultant(int $consultantId): array
    {
        $stmt = $this->db->prepare(
            'SELECT a.*, u.name AS patientName,
                    vc.roomName, vc.status AS videoStatus,
                    ' . self::STARTS_AT_COLUMN . '
             FROM `Appointment` a
             JOIN `Patient` p ON p.patientId = a.patientId
             JOIN `Users` u ON u.userId = p.userId
             LEFT JOIN `VideoConference` vc ON vc.conferenceId = a.conferenceId
             WHERE a.consultantId = :cid
             ORDER BY a.appointmentDate DESC, a.appointmentTime DESC'
        );
        $stmt->execute(['cid' => $consultantId]);
        return $stmt->fetchAll();
    }

    /**
     * Find the appointment linked to a given video room.
     */
    public function findByVideoRoom(string $roomName): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT a.*, ' . self::STARTS_AT_COLUMN . ' FROM `Appointment` a
             JOIN `VideoConference` vc ON vc.conferenceId = a.conferenceId
             WHERE vc.roomName = :name LIMIT 1'
        );
        $stmt->execute(['name' => $roomName]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Determine whether an appointment is currently joinable.
     *
     * Time is compared in UTC so the result is independent of the database
     * server's configured timezone (previously this relied on the DB session
     * timezone matching the timezone appointments were booked in, which is
     * implicit and breaks on any server whose system tz differs).
     *
     * Appointment `appointmentDate`/`appointmentTime` are stored as naive
     * wall-clock in the platform's booking timezone, passed here explicitly.
     * A future migration to UTC storage (local-time display) should set
     * $bookingTimezone to '+00:00' and convert on the client.
     *
     * @param string $bookingTimezone MySQL-compatible offset for the timezone
     *                                appointments are booked/stored in.
     *
     * @return array{state: 'early'|'open'|'late', startTime: string, startDate: string}|null
     */
    public function getJoinWindowState(
        int $appointmentId,
        int $earlyMinutes,
        int $durationMinutes,
        string $bookingTimezone = '+06:30'
    ): ?array {
        $stmt = $this->db->prepare(
            "SELECT
                 CASE
                     WHEN UTC_TIMESTAMP() < CONVERT_TZ(TIMESTAMP(a.appointmentDate, a.appointmentTime), :bookingTz1, '+00:00') - INTERVAL :early MINUTE THEN 'early'
                     WHEN UTC_TIMESTAMP() > CONVERT_TZ(TIMESTAMP(a.appointmentDate, a.appointmentTime), :bookingTz2, '+00:00') + INTERVAL :dur MINUTE THEN 'late'
                     ELSE 'open'
                 END AS state,
                 DATE_FORMAT(TIMESTAMP(a.appointmentDate, a.appointmentTime), '%H:%i') AS startTime,
                 DATE_FORMAT(TIMESTAMP(a.appointmentDate, a.appointmentTime), '%Y-%m-%d') AS startDate
             FROM `Appointment` a
             WHERE a.appointmentId = :id
             LIMIT 1"
        );
        $stmt->bindValue(':id', $appointmentId, PDO::PARAM_INT);
        $stmt->bindValue(':early', $earlyMinutes, PDO::PARAM_INT);
        $stmt->bindValue(':dur', $durationMinutes, PDO::PARAM_INT);
        // PDO native prepares reject a named placeholder used twice with a
        // single bind (SQLSTATE[HY093]); bind the same timezone value to two
        // distinct placeholders instead.
        $stmt->bindValue(':bookingTz1', $bookingTimezone, PDO::PARAM_STR);
        $stmt->bindValue(':bookingTz2', $bookingTimezone, PDO::PARAM_STR);
        $stmt->execute();
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `Appointment`
                (`patientId`, `consultantId`, `appointmentDate`, `appointmentTime`, `status`, `createdAt`, `updatedAt`)
             VALUES (:patientId, :consultantId, :appointmentDate, :appointmentTime, :status, NOW(), NOW())'
        );
        $stmt->execute([
            'patientId'       => $data['patientId'],
            'consultantId'    => $data['consultantId'],
            'appointmentDate' => $data['appointmentDate'],
            'appointmentTime' => $data['appointmentTime'],
            'status'          => $data['status'] ?? 'pending',
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function countCompletedForConsultant(int $consultantId): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM `Appointment` WHERE `consultantId` = :cid AND `status` = \'completed\''
        );
        $stmt->execute(['cid' => $consultantId]);
        return (int) $stmt->fetchColumn();
    }

    public function updateStatus(int $appointmentId, string $status, ?string $declineReason = null): bool
    {
        // Preserve an existing reason unless a new one is explicitly provided,
        // so an unrelated status change (e.g. confirm → completed) doesn't
        // wipe the decline reason a consultant already recorded.
        $stmt = $this->db->prepare(
            'UPDATE `Appointment`
             SET `status` = :status,
                 `declineReason` = COALESCE(:reason, `declineReason`),
                 `updatedAt` = NOW()
             WHERE `appointmentId` = :id'
        );
        return $stmt->execute([
            'status' => $status,
            'reason' => $declineReason !== null && $declineReason !== '' ? $declineReason : null,
            'id'     => $appointmentId,
        ]);
    }

    public function linkVideo(int $appointmentId, int $conferenceId): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `Appointment` SET `conferenceId` = :cid, `updatedAt` = NOW()
             WHERE `appointmentId` = :id'
        );
        return $stmt->execute(['cid' => $conferenceId, 'id' => $appointmentId]);
    }
}
