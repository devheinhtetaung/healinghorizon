<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\SurveyModel;
use Api\Models\SurveyQuestion;
use Api\Models\SurveyResponseModel;
use Api\Models\AdminModel;
use Api\Models\Patient;
use Api\Models\NotificationModel;

class SurveyController
{
    private SurveyModel $surveyModel;
    private SurveyQuestion $questionModel;
    private SurveyResponseModel $responseModel;
    private AdminModel $adminModel;
    private Patient $patientModel;
    private NotificationModel $notifModel;

    public function __construct(
        ?SurveyModel $surveyModel = null,
        ?SurveyQuestion $questionModel = null,
        ?SurveyResponseModel $responseModel = null,
        ?AdminModel $adminModel = null,
        ?Patient $patientModel = null,
        ?NotificationModel $notifModel = null
    ) {
        $this->surveyModel   = $surveyModel ?? new SurveyModel();
        $this->questionModel = $questionModel ?? new SurveyQuestion();
        $this->responseModel = $responseModel ?? new SurveyResponseModel();
        $this->adminModel    = $adminModel ?? new AdminModel();
        $this->patientModel  = $patientModel ?? new Patient();
        $this->notifModel    = $notifModel ?? new NotificationModel();
    }

    // ── Admin: list surveys ──
    public function index(Request $request): void
    {
        $surveys = $this->surveyModel->findAll();
        Response::json($surveys);
    }

    // ── Admin: create survey ──
    public function create(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $admin = $this->adminModel->findByUserId($userId);
        if (!$admin) Response::error('Admin profile not found.', 404);

        $data = $request->all();
        if (empty($data['title'])) Response::error('title is required.', 422);
        if (empty($data['questions']) || !is_array($data['questions'])) {
            Response::error('questions must be a non-empty array.', 422);
        }

        $surveyId = $this->surveyModel->create([
            'title'            => $data['title'],
            'createdByAdminId' => (int) $admin['adminId'],
        ]);

        $questionIds = [];
        foreach ($data['questions'] as $q) {
            if (is_string($q)) {
                $qText   = $q;
                $type    = 'text';
                $options = null;
            } else {
                $qText   = $q['question'] ?? '';
                $type    = $q['type'] ?? 'text';
                $options = isset($q['options']) && is_array($q['options'])
                    ? json_encode(array_values($q['options']))
                    : null;
            }

            if (trim($qText) === '') continue;
            $qId = $this->questionModel->create($surveyId, trim($qText), $type, $options);
            $questionIds[] = $qId;
        }

        Response::json([
            'surveyId'     => $surveyId,
            'questionIds'  => $questionIds,
        ], 201);
    }

    // ── Admin: aggregated responses ──
    public function responses(Request $request): void
    {
        $surveyId = (int) $request->param('id');
        $survey = $this->surveyModel->findById($surveyId);
        if (!$survey) Response::error('Survey not found.', 404);

        $data = $this->responseModel->getAggregated($surveyId);
        Response::json($data);
    }

    // ── Patient: submit answers ──
    public function submit(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $patient = $this->patientModel->findByUserId($userId);
        if (!$patient) Response::error('Patient profile not found.', 404);

        $surveyId = (int) $request->param('id');
        $survey = $this->surveyModel->findById($surveyId);
        if (!$survey) Response::error('Survey not found.', 404);

        $data = $request->all();
        if (empty($data['answers']) || !is_array($data['answers'])) {
            Response::error('answers must be an array of {questionId, answer} objects.', 422);
        }

        // Validate that all questions belong to this survey
        $validQuestions = $this->questionModel->findBySurvey($surveyId);
        $validIds = array_column($validQuestions, 'questionId');

        $answers = [];
        foreach ($data['answers'] as $a) {
            $qId = (int) ($a['questionId'] ?? 0);
            if (!in_array($qId, $validIds, true)) {
                Response::error("questionId {$qId} does not belong to this survey.", 422);
            }
            $answers[] = [
                'questionId' => $qId,
                'answer'     => (string) ($a['answer'] ?? ''),
            ];
        }

        $this->responseModel->submit((int) $patient['patientId'], $answers);

        // Notify admins that a patient completed the survey.
        $this->notifModel->notifyAdmins(sprintf(
            'A patient completed "%s".',
            $survey['title'] ?? 'a survey'
        ));

        Response::json(['message' => 'Responses submitted successfully.'], 201);
    }
}
