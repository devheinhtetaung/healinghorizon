<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class SurveyModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query(
            'SELECT s.*,
                    (SELECT COUNT(*) FROM `SurveyQuestions` sq WHERE sq.surveyId = s.surveyId) AS questionCount,
                    (SELECT COUNT(DISTINCT sr.patientId) FROM `SurveyResponse` sr
                     JOIN `SurveyQuestions` sq2 ON sq2.questionId = sr.questionId
                     WHERE sq2.surveyId = s.surveyId) AS responseCount
             FROM `Survey` s
             ORDER BY s.createdAt DESC'
        );
        return $stmt->fetchAll();
    }

    public function findById(int $surveyId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM `Survey` WHERE `surveyId` = :id LIMIT 1'
        );
        $stmt->execute(['id' => $surveyId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `Survey` (`title`, `createdByAdminId`, `createdAt`)
             VALUES (:title, :adminId, NOW())'
        );
        $stmt->execute([
            'title'   => $data['title'],
            'adminId' => $data['createdByAdminId'],
        ]);
        return (int) $this->db->lastInsertId();
    }
}
