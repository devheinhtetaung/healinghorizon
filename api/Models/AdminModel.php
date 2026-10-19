<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class AdminModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByUserId(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT a.*, u.name, u.email, u.gender, u.dob, u.address, u.isBanned, u.role
             FROM `Admin` a
             JOIN `Users` u ON u.userId = a.userId
             WHERE a.userId = :userId LIMIT 1'
        );
        $stmt->execute(['userId' => $userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}
