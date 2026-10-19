<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class SurveyQuestion
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findBySurvey(int $surveyId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM `SurveyQuestions` WHERE `surveyId` = :sid ORDER BY `questionId` ASC'
        );
        $stmt->execute(['sid' => $surveyId]);
        return $stmt->fetchAll();
    }

    public function create(int $surveyId, string $question, string $type = 'text', ?string $options = null): int
    {
        if (!in_array($type, ['multiple_choice', 'scale', 'text'], true)) {
            $type = 'text';
        }
        if ($type === 'text') {
            $options = null;
        }

        $stmt = $this->db->prepare(
            'INSERT INTO `SurveyQuestions` (`surveyId`, `question`, `type`, `options`)
             VALUES (:surveyId, :question, :type, :options)'
        );
        $stmt->execute([
            'surveyId' => $surveyId,
            'question' => $question,
            'type'     => $type,
            'options'  => $options,
        ]);
        return (int) $this->db->lastInsertId();
    }
}
