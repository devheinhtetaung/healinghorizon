<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class Referral
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByConsultant(int $consultantId): array
    {
        $stmt = $this->db->prepare(
            'SELECT r.*,
                    u.name AS patientName,
                    COALESCE(rc.name, rp.psychiatristName) AS referredTo,
                    CASE
                        WHEN r.referToConsultantId IS NOT NULL THEN \'consultant\'
                        ELSE \'psychiatrist\'
                    END AS targetType
             FROM `Referral` r
             JOIN `Patient` p ON p.patientId = r.patientId
             JOIN `Users` u ON u.userId = p.userId
             LEFT JOIN `Consultant` c ON c.consultantId = r.referToConsultantId
             LEFT JOIN `Users` rc ON rc.userId = c.userId
             LEFT JOIN `Psychiatrists` rp ON rp.psychiatristId = r.referToPsychiatristId
             WHERE r.consultantId = :cid
             ORDER BY r.createdAt DESC'
        );
        $stmt->execute(['cid' => $consultantId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `Referral`
                (`consultantId`, `patientId`, `caseOfReferral`,
                 `referToConsultantId`, `referToPsychiatristId`, `status`, `createdAt`)
             VALUES (:consultantId, :patientId, :caseOfReferral,
                     :referToConsultantId, :referToPsychiatristId, :status, NOW())'
        );
        $stmt->execute([
            'consultantId'          => $data['consultantId'],
            'patientId'             => $data['patientId'],
            'caseOfReferral'        => $data['caseOfReferral'],
            'referToConsultantId'   => $data['referToConsultantId'] ?? null,
            'referToPsychiatristId' => $data['referToPsychiatristId'] ?? null,
            'status'                => $data['status'] ?? 'pending',
        ]);
        return (int) $this->db->lastInsertId();
    }
}
