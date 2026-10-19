<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class Psychiatrist
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findAll(?int $hospitalId = null): array
    {
        $sql = 'SELECT p.*, h.hospitalName, h.city
                FROM `Psychiatrists` p
                JOIN `Hospital` h ON h.hospitalId = p.hospitalId';
        $params = [];

        if ($hospitalId !== null) {
            $sql .= ' WHERE p.hospitalId = :hid';
            $params['hid'] = $hospitalId;
        }

        $sql .= ' ORDER BY p.psychiatristName ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function findById(int $psychiatristId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT p.*, h.hospitalName, h.city
             FROM `Psychiatrists` p
             JOIN `Hospital` h ON h.hospitalId = p.hospitalId
             WHERE p.psychiatristId = :id LIMIT 1'
        );
        $stmt->execute(['id' => $psychiatristId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `Psychiatrists` (`hospitalId`, `psychiatristName`, `createdAt`)
             VALUES (:hospitalId, :psychiatristName, NOW())'
        );
        $stmt->execute([
            'hospitalId'       => $data['hospitalId'],
            'psychiatristName' => $data['psychiatristName'],
        ]);
        return (int) $this->db->lastInsertId();
    }
}
