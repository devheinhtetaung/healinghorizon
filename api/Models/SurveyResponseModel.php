<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

class SurveyResponseModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get aggregated responses for a survey, shaped for the Review Results view.
     *
     * Per question:
     *   - multiple_choice / scale → `options: [{label, count}]` (grouped by answer,
     *     zero-filled against the stored option list).
     *   - text → `responses: [{answer, patientName}]` (individual answers).
     * Every question also carries `type` and `count` (its own response total).
     */
    public function getAggregated(int $surveyId): array
    {
        $db = $this->db;

        $questions = $db->prepare(
            'SELECT `questionId`, `question`, `type`, `options`
             FROM `SurveyQuestions`
             WHERE `surveyId` = :sid
             ORDER BY `questionId` ASC'
        );
        $questions->execute(['sid' => $surveyId]);
        $questions = $questions->fetchAll();

        $result = [];
        foreach ($questions as $q) {
            $questionId = (int) $q['questionId'];
            $type       = $q['type'] ?? 'text';

            $countStmt = $db->prepare(
                'SELECT COUNT(*) FROM `SurveyResponse` WHERE `questionId` = :qid'
            );
            $countStmt->execute(['qid' => $questionId]);
            $count = (int) $countStmt->fetchColumn();

            $row = [
                'questionId' => $questionId,
                'question'   => $q['question'],
                'type'       => $type,
                'count'      => $count,
            ];

            if ($type === 'multiple_choice' || $type === 'scale') {
                $row['options'] = $this->aggregateOptions($questionId, $q['options']);
            } else {
                $row['responses'] = $this->individualResponses($questionId);
            }

            $result[] = $row;
        }

        return $result;
    }

    /**
     * Count responses per option for a fixed-answer question, ordered by the
     * stored option list and zero-filled for options nobody selected. Any
     * answer value present in the data but missing from the stored list is
     * appended so no response is lost.
     *
     * @return array<int, array{label: string, count: int}>
     */
    private function aggregateOptions(int $questionId, ?string $optionsJson): array
    {
        $stmt = $this->db->prepare(
            'SELECT `answer`, COUNT(*) AS c
             FROM `SurveyResponse`
             WHERE `questionId` = :qid
             GROUP BY `answer`'
        );
        $stmt->execute(['qid' => $questionId]);

        $counts = [];
        foreach ($stmt->fetchAll() as $r) {
            $counts[$r['answer']] = (int) $r['c'];
        }

        $labels = json_decode((string) $optionsJson, true);
        if (!is_array($labels)) {
            $labels = array_keys($counts);
        }

        $options = [];
        $seen    = [];
        foreach ($labels as $label) {
            $label = (string) $label;
            $options[] = ['label' => $label, 'count' => $counts[$label] ?? 0];
            $seen[$label] = true;
        }
        foreach ($counts as $answer => $c) {
            if (!isset($seen[$answer])) {
                $options[] = ['label' => $answer, 'count' => $c];
            }
        }

        return $options;
    }

    /**
     * @return array<int, array{answer: string, patientName: string|null}>
     */
    private function individualResponses(int $questionId): array
    {
        $stmt = $this->db->prepare(
            'SELECT sr.answer, u.name AS patientName
             FROM `SurveyResponse` sr
             JOIN `Patient` p ON p.patientId = sr.patientId
             JOIN `Users` u ON u.userId = p.userId
             WHERE sr.questionId = :qid
             ORDER BY sr.submittedAt ASC'
        );
        $stmt->execute(['qid' => $questionId]);
        return $stmt->fetchAll();
    }

    /**
     * Submit answers for a survey (one per question for a given patient).
     * $answers is an array of ['questionId' => int, 'answer' => string].
     */
    public function submit(int $patientId, array $answers): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `SurveyResponse`
                (`questionId`, `patientId`, `answer`, `submittedAt`)
             VALUES (:questionId, :patientId, :answer, NOW())
             ON DUPLICATE KEY UPDATE `answer` = VALUES(`answer`), `submittedAt` = NOW()'
        );

        foreach ($answers as $a) {
            $stmt->execute([
                'questionId' => $a['questionId'],
                'patientId'  => $patientId,
                'answer'     => $a['answer'],
            ]);
        }
    }
}
