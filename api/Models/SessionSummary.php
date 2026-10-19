<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

/**
 * One clinical session summary per appointment.
 *
 * The `content` column stores the summary as a JSON object with three
 * structured fields the client renders:
 *     {"focus": string, "takeaways": string, "nextSteps": string}
 *
 * `takeaways` is a single multi-line string; the patient-facing view splits it
 * into bullet points for display. The unique key on `appointmentId` (enforced
 * in the schema) guarantees there is never more than one summary per
 * appointment — `upsert()` relies on that constraint to atomically update an
 * existing row instead of inserting a duplicate.
 */
class SessionSummary
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Return the summary for an appointment as a flat array with the JSON
     * content decoded into `focus` / `takeaways` / `nextSteps`, or null when
     * no summary has been recorded yet.
     */
    public function findByAppointment(int $appointmentId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM `SessionSummary` WHERE `appointmentId` = :id LIMIT 1'
        );
        $stmt->execute(['id' => $appointmentId]);
        $row = $stmt->fetch();

        return $row ? $this->decode($row) : null;
    }

    /**
     * Insert a new summary or overwrite the existing one for the appointment.
     *
     * Relies on the `appointmentId` UNIQUE key + `ON DUPLICATE KEY UPDATE` so
     * an edit updates the existing row rather than creating a duplicate.
     */
    public function upsert(int $appointmentId, int $consultantId, array $content): bool
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `SessionSummary`
                (`appointmentId`, `consultantId`, `content`, `createdAt`, `updatedAt`)
             VALUES (:appointmentId, :consultantId, :content, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                `consultantId` = VALUES(`consultantId`),
                `content`      = VALUES(`content`),
                `updatedAt`    = NOW()'
        );

        return $stmt->execute([
            'appointmentId' => $appointmentId,
            'consultantId'  => $consultantId,
            'content'       => json_encode($content, JSON_UNESCAPED_UNICODE),
        ]);
    }

    private function decode(array $row): array
    {
        $content = json_decode((string) ($row['content'] ?? '{}'), true);

        if (!is_array($content)) {
            $content = [
                'focus'     => (string) ($row['content'] ?? ''),
                'takeaways' => '',
                'nextSteps' => '',
            ];
        }

        unset($row['content']);

        return array_merge($row, [
            'focus'     => (string) ($content['focus'] ?? ''),
            'takeaways' => (string) ($content['takeaways'] ?? ''),
            'nextSteps' => (string) ($content['nextSteps'] ?? ''),
        ]);
    }
}
