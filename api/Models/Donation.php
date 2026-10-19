<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class Donation
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT * FROM `Donation` ORDER BY `donatedAt` DESC'
        );
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `Donation`
                (`userId`, `amount`, `anonymousDonation`, `donarName`, `donarEmail`, `status`, `donatedAt`)
             VALUES (:userId, :amount, :anonymousDonation, :donarName, :donarEmail, :status, NOW())'
        );
        $stmt->execute([
            'userId'            => $data['userId'] ?? null,
            'amount'            => $data['amount'],
            'anonymousDonation' => $data['anonymousDonation'] ? 1 : 0,
            'donarName'         => $data['donarName'] ?? null,
            'donarEmail'        => $data['donarEmail'] ?? null,
            'status'            => $data['status'] ?? 'completed',
        ]);
        return (int) $this->db->lastInsertId();
    }
}
