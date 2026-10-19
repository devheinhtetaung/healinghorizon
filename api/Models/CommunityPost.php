<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class CommunityPost
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findById(int $postId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT p.*,
                    CASE WHEN p.anonymousPost = 1 THEN \'Anonymous\' ELSE u.name END AS authorName
             FROM `CommunityPost` p
             JOIN `Users` u ON u.userId = p.userId
             WHERE p.postId = :id LIMIT 1'
        );
        $stmt->execute(['id' => $postId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findAll(int $limit = 20, int $offset = 0, string $sort = 'recent'): array
    {
        $orderBy = $sort === 'popular' ? 'p.upVoteCount DESC' : 'p.createdAt DESC';

        $stmt = $this->db->prepare(
            "SELECT p.*,
                    CASE WHEN p.anonymousPost = 1 THEN 'Anonymous' ELSE u.name END AS authorName
             FROM `CommunityPost` p
             JOIN `Users` u ON u.userId = p.userId
             ORDER BY {$orderBy}
             LIMIT :lim OFFSET :off"
        );
        $stmt->bindValue('lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue('off', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `CommunityPost`
                (`userId`, `postTitle`, `content`, `anonymousPost`, `hasAttachment`,
                 `upVoteCount`, `viewCount`, `shareCount`, `commentCount`, `createdAt`, `updatedAt`)
             VALUES (:userId, :postTitle, :content, :anonymousPost, 0,
                     0, 0, 0, 0, NOW(), NOW())'
        );
        $stmt->execute([
            'userId'        => $data['userId'],
            'postTitle'     => $data['postTitle'],
            'content'       => $data['content'],
            'anonymousPost' => $data['anonymousPost'] ? 1 : 0,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function incrementUpvotes(int $postId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE `CommunityPost` SET `upVoteCount` = `upVoteCount` + 1, `updatedAt` = NOW()
             WHERE `postId` = :id'
        );
        $stmt->execute(['id' => $postId]);
    }

    public function incrementComments(int $postId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE `CommunityPost` SET `commentCount` = `commentCount` + 1, `updatedAt` = NOW()
             WHERE `postId` = :id'
        );
        $stmt->execute(['id' => $postId]);
    }

    public function incrementViewCount(int $postId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE `CommunityPost` SET `viewCount` = `viewCount` + 1, `updatedAt` = NOW()
             WHERE `postId` = :id'
        );
        $stmt->execute(['id' => $postId]);
    }
}
