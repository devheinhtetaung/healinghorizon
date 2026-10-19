<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class CommentModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByPost(int $postId): array
    {
        $stmt = $this->db->prepare(
            'SELECT c.*, u.name AS authorName
             FROM `Comment` c
             JOIN `Users` u ON u.userId = c.commentBy
             WHERE c.postId = :postId
             ORDER BY c.createdAt ASC'
        );
        $stmt->execute(['postId' => $postId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `Comment` (`postId`, `commentBy`, `comment`, `createdAt`)
             VALUES (:postId, :commentBy, :comment, NOW())'
        );
        $stmt->execute([
            'postId'    => $data['postId'],
            'commentBy' => $data['commentBy'],
            'comment'   => $data['comment'],
        ]);
        return (int) $this->db->lastInsertId();
    }
}
