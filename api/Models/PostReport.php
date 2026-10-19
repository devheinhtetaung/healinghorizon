<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

/**
 * Per-user, per-post abuse reports feeding the admin moderation queue.
 *
 * A report flags a post for admin review without hiding it — the post stays
 * visible until an admin acts. The UNIQUE (reporterId, postId) key guarantees
 * a user can only ever report a given post once, which keeps the queue from
 * being spammed with duplicate open reports.
 */
class PostReport
{
    public const REASONS = ['spam', 'harmful', 'harassment', 'other'];

    public const STATUSES = ['open', 'resolved', 'dismissed'];

    public const REASON_LABELS = [
        'spam'       => 'Spam',
        'harmful'    => 'Harmful content',
        'harassment' => 'Harassment',
        'other'      => 'Other',
    ];

    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function hasReported(int $userId, int $postId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT 1 FROM `PostReport` WHERE `reporterId` = :u AND `postId` = :p LIMIT 1'
        );
        $stmt->execute(['u' => $userId, 'p' => $postId]);
        return (bool) $stmt->fetch();
    }

    /** @return int[] postIds the given user has already reported (for list rendering). */
    public function findReportedPostIdsByUser(int $userId): array
    {
        $stmt = $this->db->prepare('SELECT `postId` FROM `PostReport` WHERE `reporterId` = :u');
        $stmt->execute(['u' => $userId]);
        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `PostReport` (`postId`, `reporterId`, `reason`, `status`, `createdAt`)
             VALUES (:postId, :reporterId, :reason, :status, NOW())'
        );
        $stmt->execute([
            'postId'     => $data['postId'],
            'reporterId' => $data['reporterId'],
            'reason'     => $data['reason'],
            'status'     => $data['status'] ?? 'open',
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** Admin listing: reports joined to their post (title/author) and reporter. */
    public function findAll(?string $status = null): array
    {
        $sql = 'SELECT r.*,
                       p.postTitle,
                       p.content AS postContent,
                       p.anonymousPost,
                       CASE WHEN p.anonymousPost = 1 THEN \'Anonymous\' ELSE u.name END AS postAuthorName,
                       ur.name AS reporterName
                FROM `PostReport` r
                JOIN `CommunityPost` p ON p.postId = r.postId
                JOIN `Users` u ON u.userId = p.userId
                JOIN `Users` ur ON ur.userId = r.reporterId';
        $params = [];

        if ($status !== null && $status !== '') {
            $sql .= ' WHERE r.status = :status';
            $params['status'] = $status;
        }

        $sql .= ' ORDER BY r.createdAt DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function findById(int $postReportId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM `PostReport` WHERE `postReportId` = :id LIMIT 1');
        $stmt->execute(['id' => $postReportId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function updateStatus(int $postReportId, string $status): void
    {
        $stmt = $this->db->prepare(
            'UPDATE `PostReport` SET `status` = :status WHERE `postReportId` = :id'
        );
        $stmt->execute(['status' => $status, 'id' => $postReportId]);
    }
}
