<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class PatientProgressLog
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByPatient(int $patientId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM `PatientProgressLog`
             WHERE `patientId` = :pid
             ORDER BY `loggedAt` DESC'
        );
        $stmt->execute(['pid' => $patientId]);
        return $stmt->fetchAll();
    }

    public function findLatestByPatient(int $patientId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM `PatientProgressLog`
             WHERE `patientId` = :pid
             ORDER BY `loggedAt` DESC, `progressId` DESC
             LIMIT 1'
        );
        $stmt->execute(['pid' => $patientId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `PatientProgressLog`
                (`patientId`, `consultantId`, `anxietyScore`, `depressionScore`,
                 `overthinkingScore`, `overallScore`, `note`, `loggedAt`)
             VALUES (:patientId, :consultantId, :anxietyScore, :depressionScore,
                     :overthinkingScore, :overallScore, :note, NOW())'
        );
        $stmt->execute([
            'patientId'         => $data['patientId'],
            'consultantId'      => $data['consultantId'],
            'anxietyScore'      => $data['anxietyScore'] ?? 0,
            'depressionScore'   => $data['depressionScore'] ?? 0,
            'overthinkingScore' => $data['overthinkingScore'] ?? 0,
            'overallScore'      => $data['overallScore'] ?? 0,
            'note'              => $data['note'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Returns true if the consultant has at least one appointment with the patient.
     */
    public function consultantHasAccess(int $consultantId, int $patientId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT 1 FROM `Appointment`
             WHERE `consultantId` = :cid AND `patientId` = :pid
             LIMIT 1'
        );
        $stmt->execute(['cid' => $consultantId, 'pid' => $patientId]);
        return (bool) $stmt->fetch();
    }
}
