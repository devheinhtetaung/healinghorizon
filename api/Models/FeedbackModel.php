<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class FeedbackModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByAppointment(int $appointmentId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM `Feedback` WHERE `appointmentId` = :id LIMIT 1');
        $stmt->execute(['id' => $appointmentId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByConsultant(int $consultantId): array
    {
        $stmt = $this->db->prepare(
            'SELECT f.*, u.name AS patientName
             FROM `Feedback` f
             JOIN `Patient` p ON p.patientId = f.patientId
             JOIN `Users` u ON u.userId = p.userId
             WHERE f.consultantId = :cid
             ORDER BY f.createdAt DESC'
        );
        $stmt->execute(['cid' => $consultantId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `Feedback`
                (`appointmentId`, `patientId`, `consultantId`, `rating`, `comment`, `createdAt`)
             VALUES (:appointmentId, :patientId, :consultantId, :rating, :comment, NOW())'
        );
        $stmt->execute([
            'appointmentId' => $data['appointmentId'],
            'patientId'     => $data['patientId'],
            'consultantId'  => $data['consultantId'],
            'rating'        => $data['rating'],
            'comment'       => $data['comment'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }
}
