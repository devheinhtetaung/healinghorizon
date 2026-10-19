<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class NotificationModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM `Notification`
             WHERE `userId` = :uid
             ORDER BY `createdAt` DESC'
        );
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `Notification` (`userId`, `message`, `createdAt`)
             VALUES (:userId, :message, NOW())'
        );
        $stmt->execute([
            'userId'  => $data['userId'],
            'message' => $data['message'],
        ]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Deliver one notification to every admin account. Used by events that must
     * surface in the admin moderation queue (post reports, survey completions,
     * consultant feedback).
     */
    public function notifyAdmins(string $message): void
    {
        $stmt = $this->db->query('SELECT `userId` FROM `Admin`');
        $adminUserIds = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));

        foreach ($adminUserIds as $adminUserId) {
            $this->create(['userId' => $adminUserId, 'message' => $message]);
        }
    }

    public function findById(int $notificationId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM `Notification` WHERE `notificationId` = :id LIMIT 1'
        );
        $stmt->execute(['id' => $notificationId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function markAsRead(int $notificationId): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `Notification` SET `isRead` = 1 WHERE `notificationId` = :id'
        );
        return $stmt->execute(['id' => $notificationId]);
    }
}
