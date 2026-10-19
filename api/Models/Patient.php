<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class Patient
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findById(int $patientId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT p.*, u.name, u.email, u.gender, u.dob, u.address, u.isBanned, u.role
             FROM `Patient` p
             JOIN `Users` u ON u.userId = p.userId
             WHERE p.patientId = :id LIMIT 1'
        );
        $stmt->execute(['id' => $patientId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByUserId(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT p.*, u.name, u.email, u.gender, u.dob, u.address, u.isBanned, u.role
             FROM `Patient` p
             JOIN `Users` u ON u.userId = p.userId
             WHERE p.userId = :userId LIMIT 1'
        );
        $stmt->execute(['userId' => $userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Create a patient user + patient profile atomically.
     *
     * $userData: name, email, password_hash, gender?, dob, address?
     * $patientData: supportPreference?, emailNotification?
     *
     * @return array{userId: int, patientId: int}
     */
    public function createWithUser(array $userData, array $patientData): array
    {
        $this->db->beginTransaction();

        try {
            $stmt = $this->db->prepare(
                'INSERT INTO `Users`
                    (`name`, `email`, `password_hash`, `role`, `gender`, `dob`, `address`, `createdAt`, `updatedAt`)
                 VALUES (:name, :email, :password_hash, \'patient\', :gender, :dob, :address, NOW(), NOW())'
            );
            $stmt->execute([
                'name'          => $userData['name'],
                'email'         => $userData['email'],
                'password_hash' => $userData['password_hash'],
                'gender'        => $userData['gender'] ?? null,
                'dob'           => $userData['dob'],
                'address'       => $userData['address'] ?? null,
            ]);
            $userId = (int) $this->db->lastInsertId();

            $stmt = $this->db->prepare(
                'INSERT INTO `Patient`
                    (`userId`, `supportPreference`, `emailNotification`, `createdAt`, `updatedAt`)
                 VALUES (:userId, :supportPreference, :emailNotification, NOW(), NOW())'
            );
            $stmt->execute([
                'userId'            => $userId,
                'supportPreference' => $patientData['supportPreference'] ?? null,
                'emailNotification' => (int) ($patientData['emailNotification'] ?? 1),
            ]);
            $patientId = (int) $this->db->lastInsertId();

            $this->db->commit();

            return ['userId' => $userId, 'patientId' => $patientId];
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    /**
     * @param array $data Keys: userId, supportPreference?, emailNotification?
     * @return int The new patientId
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `Patient`
                (`userId`, `supportPreference`, `emailNotification`, `createdAt`, `updatedAt`)
             VALUES (:userId, :supportPreference, :emailNotification, NOW(), NOW())'
        );
        $stmt->execute([
            'userId'            => $data['userId'],
            'supportPreference' => $data['supportPreference'] ?? null,
            'emailNotification' => (int) ($data['emailNotification'] ?? 1),
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $patientId, array $data): bool
    {
        $fields = [];
        $params = ['patientId' => $patientId];

        $allowed = ['supportPreference', 'emailNotification'];
        foreach ($allowed as $col) {
            if (array_key_exists($col, $data)) {
                $fields[] = "`{$col}` = :{$col}";
                $params[$col] = $col === 'emailNotification'
                    ? (int) $data[$col]
                    : $data[$col];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $fields[] = '`updatedAt` = NOW()';
        $sql = 'UPDATE `Patient` SET ' . implode(', ', $fields) . ' WHERE `patientId` = :patientId';
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }
}
