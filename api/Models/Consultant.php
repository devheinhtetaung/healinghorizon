<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class Consultant
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByUserId(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT c.*, u.name, u.email, u.gender, u.dob, u.address, u.isBanned, u.role
             FROM `Consultant` c
             JOIN `Users` u ON u.userId = c.userId
             WHERE c.userId = :userId LIMIT 1'
        );
        $stmt->execute(['userId' => $userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findById(int $consultantId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT c.*, u.name, u.email, u.avatarUrl
             FROM `Consultant` c
             JOIN `Users` u ON u.userId = c.userId
             WHERE c.consultantId = :id LIMIT 1'
        );
        $stmt->execute(['id' => $consultantId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findAllVerified(string $search = ''): array
    {
        $sql = 'SELECT c.*, u.name, u.email, u.avatarUrl
                FROM `Consultant` c
                JOIN `Users` u ON u.userId = c.userId
                WHERE c.isVerified = 1';
        $params = [];

        if ($search !== '') {
            $sql .= ' AND (u.name LIKE :search OR c.biography LIKE :search2)';
            $params['search']  = "%{$search}%";
            $params['search2'] = "%{$search}%";
        }

        $sql .= ' ORDER BY c.rating DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    // ── Admin methods ──

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT c.*, u.name, u.email
             FROM `Consultant` c
             JOIN `Users` u ON u.userId = c.userId
             ORDER BY c.createdAt DESC'
        );
        return $stmt->fetchAll();
    }

    /**
     * Create a consultant user + consultant profile.
     * $userData: name, email, password_hash, gender?, dob?, address?
     * Returns the new consultantId.
     */
    public function createWithUser(array $userData): array
    {
        $this->db->beginTransaction();

        try {
            // Insert Users row
            $stmt = $this->db->prepare(
                'INSERT INTO `Users`
                    (`name`, `email`, `password_hash`, `role`, `gender`, `dob`, `address`, `createdAt`, `updatedAt`)
                 VALUES (:name, :email, :password_hash, \'consultant\', :gender, :dob, :address, NOW(), NOW())'
            );
            $stmt->execute([
                'name'          => $userData['name'],
                'email'         => $userData['email'],
                'password_hash' => $userData['password_hash'],
                'gender'        => $userData['gender'] ?? null,
                'dob'           => $userData['dob'] ?? '1970-01-01',
                'address'       => $userData['address'] ?? null,
            ]);
            $userId = (int) $this->db->lastInsertId();

            // Insert Consultant row
            $stmt = $this->db->prepare(
                'INSERT INTO `Consultant`
                    (`userId`, `biography`, `rating`, `isVerified`, `createdAt`, `updatedAt`)
                 VALUES (:userId, :biography, 0.00, 0, NOW(), NOW())'
            );
            $stmt->execute([
                'userId'    => $userId,
                'biography' => $userData['biography'] ?? null,
            ]);
            $consultantId = (int) $this->db->lastInsertId();

            $this->db->commit();

            return ['userId' => $userId, 'consultantId' => $consultantId];
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function verify(int $consultantId): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `Consultant` SET `isVerified` = 1, `updatedAt` = NOW() WHERE `consultantId` = :id'
        );
        return $stmt->execute(['id' => $consultantId]);
    }

    public function remove(int $consultantId): bool
    {
        // Resolve the underlying user account so it is deleted alongside the
        // consultant profile (previously only the Consultant row was removed,
        // leaving an orphaned Users row).
        $stmt = $this->db->prepare(
            'SELECT `userId` FROM `Consultant` WHERE `consultantId` = :id LIMIT 1'
        );
        $stmt->execute(['id' => $consultantId]);
        $userId = (int) $stmt->fetchColumn();

        $this->db->beginTransaction();
        try {
            // Consultant profile first (cascades availability, overrides, feedback).
            $stmt = $this->db->prepare(
                'DELETE FROM `Consultant` WHERE `consultantId` = :id'
            );
            $stmt->execute(['id' => $consultantId]);

            // Then the user account (cascades posts, comments, notifications,
            // reports, upvotes, etc.).
            if ($userId > 0) {
                $stmt = $this->db->prepare(
                    'DELETE FROM `Users` WHERE `userId` = :uid AND `role` = \'consultant\''
                );
                $stmt->execute(['uid' => $userId]);
            }

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
