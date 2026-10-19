<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

/**
 * Per-user, per-post upvote tracking. The authoritative upvote COUNT lives on
 * `CommunityPost.upVoteCount`; this table only records WHO upvoted WHAT so the
 * toggle can reverse a previous upvote.
 */
class PostUpvote
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function hasUpvoted(int $userId, int $postId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT 1 FROM `PostUpvote` WHERE `userId` = :u AND `postId` = :p LIMIT 1'
        );
        $stmt->execute(['u' => $userId, 'p' => $postId]);
        return (bool) $stmt->fetch();
    }

    /**
     * Toggle this user's upvote atomically.
     *
     * @return bool the post-upvote state (true = now upvoted, false = removed)
     */
    public function toggle(int $userId, int $postId): bool
    {
        $this->db->beginTransaction();

        try {
            if ($this->hasUpvoted($userId, $postId)) {
                $this->db->prepare('DELETE FROM `PostUpvote` WHERE `userId` = :u AND `postId` = :p')
                    ->execute(['u' => $userId, 'p' => $postId]);
                $this->db->prepare(
                    'UPDATE `CommunityPost`
                     SET `upVoteCount` = GREATEST(`upVoteCount` - 1, 0), `updatedAt` = NOW()
                     WHERE `postId` = :p'
                )->execute(['p' => $postId]);
                $this->db->commit();
                return false;
            }

            try {
                $this->db->prepare(
                    'INSERT INTO `PostUpvote` (`userId`, `postId`, `createdAt`) VALUES (:u, :p, NOW())'
                )->execute(['u' => $userId, 'p' => $postId]);
                $this->db->prepare(
                    'UPDATE `CommunityPost`
                     SET `upVoteCount` = `upVoteCount` + 1, `updatedAt` = NOW()
                     WHERE `postId` = :p'
                )->execute(['p' => $postId]);
                $this->db->commit();
                return true;
            } catch (\PDOException $e) {
                // Unique-constraint race: another request inserted the same
                // pair first. Treat as already-upvoted — don't double count.
                if ($e->getCode() === '23000') {
                    $this->db->rollBack();
                    return true;
                }
                throw $e;
            }
        } catch (\Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    /** @return int[] postIds the given user has upvoted (for list rendering). */
    public function findUpvotedPostIdsByUser(int $userId): array
    {
        $stmt = $this->db->prepare('SELECT `postId` FROM `PostUpvote` WHERE `userId` = :u');
        $stmt->execute(['u' => $userId]);
        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }
}
