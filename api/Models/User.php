<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class User
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findById(int $userId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM `Users` WHERE `userId` = :id LIMIT 1');
        $stmt->execute(['id' => $userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM `Users` WHERE `email` = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `Users`
                (`name`, `email`, `password_hash`, `role`, `gender`, `dob`, `address`, `createdAt`, `updatedAt`)
             VALUES (:name, :email, :password_hash, :role, :gender, :dob, :address, NOW(), NOW())'
        );
        $stmt->execute([
            'name'          => $data['name'],
            'email'         => $data['email'],
            'password_hash' => $data['password_hash'],
            'role'          => $data['role'],
            'gender'        => $data['gender'] ?? null,
            'dob'           => $data['dob'],
            'address'       => $data['address'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $userId, array $data): bool
    {
        $fields = [];
        $params = ['id' => $userId];

        $allowed = ['name', 'email', 'gender', 'dob', 'address', 'avatarUrl'];
        foreach ($allowed as $col) {
            if (array_key_exists($col, $data)) {
                $fields[] = "`{$col}` = :{$col}";
                $params[$col] = $data[$col];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $fields[] = '`updatedAt` = NOW()';
        $sql = 'UPDATE `Users` SET ' . implode(', ', $fields) . ' WHERE `userId` = :id';
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function updatePassword(int $userId, string $newHash): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `Users` SET `password_hash` = :hash, `updatedAt` = NOW() WHERE `userId` = :id'
        );
        return $stmt->execute(['hash' => $newHash, 'id' => $userId]);
    }

    // ── Admin methods ──

    /**
     * Find patients, supports ?search=. Returns Users joined with Patient.
     */
    public function findPatients(string $search = ''): array
    {
        $sql = 'SELECT u.*, p.patientId, p.supportPreference, p.emailNotification, p.createdAt AS patientCreatedAt
                FROM `Users` u
                JOIN `Patient` p ON p.userId = u.userId
                WHERE u.role = \'patient\'';

        $params = [];

        if ($search !== '') {
            $sql .= ' AND (u.name LIKE :search OR u.email LIKE :search2)';
            $params['search']  = "%{$search}%";
            $params['search2'] = "%{$search}%";
        }

        $sql .= ' ORDER BY u.createdAt DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function ban(int $userId, string $reason): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `Users` SET `isBanned` = 1, `banReason` = :reason, `updatedAt` = NOW()
             WHERE `userId` = :id'
        );
        return $stmt->execute(['reason' => $reason, 'id' => $userId]);
    }

    public function unban(int $userId): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `Users` SET `isBanned` = 0, `banReason` = NULL, `updatedAt` = NOW()
             WHERE `userId` = :id'
        );
        return $stmt->execute(['id' => $userId]);
    }
}
