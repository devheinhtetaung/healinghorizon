<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class VideoConferenceModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findById(int $conferenceId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM `VideoConference` WHERE `conferenceId` = :id LIMIT 1');
        $stmt->execute(['id' => $conferenceId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByRoomName(string $roomName): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM `VideoConference` WHERE `roomName` = :name LIMIT 1');
        $stmt->execute(['name' => $roomName]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(string $roomName): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `VideoConference` (`roomName`, `status`, `createdAt`)
             VALUES (:roomName, \'scheduled\', NOW())'
        );
        $stmt->execute(['roomName' => $roomName]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Record that a participant actually entered the call. Idempotent — a
     * repeat signal (e.g. re-joining) never overwrites the first join time.
     */
    public function recordJoin(int $conferenceId, string $role): bool
    {
        $column = $this->participantColumn($role, 'JoinedAt');
        if ($column === null) {
            return false;
        }
        $stmt = $this->db->prepare(
            "UPDATE `VideoConference`
             SET `{$column}` = COALESCE(`{$column}`, NOW()), `status` = 'ongoing'
             WHERE `conferenceId` = :id"
        );
        return $stmt->execute(['id' => $conferenceId]);
    }

    /**
     * Record that a participant left the call. Idempotent — the first leave
     * time is kept.
     */
    public function recordLeave(int $conferenceId, string $role): bool
    {
        $column = $this->participantColumn($role, 'LeftAt');
        if ($column === null) {
            return false;
        }
        $stmt = $this->db->prepare(
            "UPDATE `VideoConference`
             SET `{$column}` = COALESCE(`{$column}`, NOW())
             WHERE `conferenceId` = :id"
        );
        return $stmt->execute(['id' => $conferenceId]);
    }

    public function markEnded(int $conferenceId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE `VideoConference`
             SET `status` = 'ended', `endedAt` = COALESCE(`endedAt`, NOW())
             WHERE `conferenceId` = :id"
        );
        return $stmt->execute(['id' => $conferenceId]);
    }

    /** Both patient and consultant entered the call (a genuine session). */
    public function bothJoined(array $conference): bool
    {
        return !empty($conference['patientJoinedAt']) && !empty($conference['consultantJoinedAt']);
    }

    /** Both participants have recorded a leave. */
    public function bothLeft(array $conference): bool
    {
        return !empty($conference['patientLeftAt']) && !empty($conference['consultantLeftAt']);
    }

    /** At least one participant has left (used by the stuck-session fallback). */
    public function anyLeft(array $conference): bool
    {
        return !empty($conference['patientLeftAt']) || !empty($conference['consultantLeftAt']);
    }

    private function participantColumn(string $role, string $suffix): ?string
    {
        return match ($role) {
            'patient'    => 'patient' . $suffix,
            'consultant' => 'consultant' . $suffix,
            default      => null,
        };
    }
}
