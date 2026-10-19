<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class Hospital
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findAll(string $city = ''): array
    {
        $sql = 'SELECT * FROM `Hospital`';
        $params = [];

        if ($city !== '') {
            $sql .= ' WHERE `city` LIKE :city';
            $params['city'] = "%{$city}%";
        }

        $sql .= ' ORDER BY `hospitalName` ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function findById(int $hospitalId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM `Hospital` WHERE `hospitalId` = :id LIMIT 1');
        $stmt->execute(['id' => $hospitalId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `Hospital` (`adminId`, `hospitalName`, `city`, `address`, `createdAt`)
             VALUES (:adminId, :hospitalName, :city, :address, NOW())'
        );
        $stmt->execute([
            'adminId'      => $data['adminId'],
            'hospitalName' => $data['hospitalName'],
            'city'         => $data['city'],
            'address'      => $data['address'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }
}
