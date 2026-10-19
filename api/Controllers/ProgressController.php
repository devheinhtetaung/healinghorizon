<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\PatientProgressLog;
use Api\Models\Patient;
use Api\Models\Consultant;

class ProgressController
{
    private PatientProgressLog $logModel;
    private Patient $patientModel;
    private Consultant $consultantModel;

    public function __construct(
        ?PatientProgressLog $logModel = null,
        ?Patient $patientModel = null,
        ?Consultant $consultantModel = null
    ) {
        $this->logModel       = $logModel ?? new PatientProgressLog();
        $this->patientModel   = $patientModel ?? new Patient();
        $this->consultantModel = $consultantModel ?? new Consultant();
    }

    public function index(Request $request): void
    {
        $userId      = (int) ($request->user['userId'] ?? 0);
        $patientId   = (int) $request->param('id');
        $consultant   = $this->consultantModel->findByUserId($userId);
        if (!$consultant) Response::error('Consultant profile not found.', 404);

        $patient = $this->patientModel->findById($patientId);
        if (!$patient) Response::error('Patient not found.', 404);

        // Ownership check: consultant must have appointment history with this patient
        if (!$this->logModel->consultantHasAccess((int) $consultant['consultantId'], $patientId)) {
            Response::error('Forbidden — you do not have access to this patient\'s progress.', 403);
        }

        $logs = $this->logModel->findByPatient($patientId);
        Response::json($logs);
    }

    /**
     * A patient's own latest progress — powers the Patient Dashboard's
     * Progress Snapshot. Reads the same `PatientProgressLog` rows the
     * consultant writes via create(), so the two surfaces stay in sync.
     */
    public function latestForPatient(Request $request): void
    {
        $role = $request->user['role'] ?? '';
        if ($role !== 'patient') {
            Response::error('Forbidden.', 403);
        }

        $userId  = (int) ($request->user['userId'] ?? 0);
        $patient = $this->patientModel->findByUserId($userId);
        if (!$patient) {
            Response::error('Patient profile not found.', 404);
        }

        Response::json($this->logModel->findLatestByPatient((int) $patient['patientId']));
    }

    public function create(Request $request): void
    {
        $userId      = (int) ($request->user['userId'] ?? 0);
        $patientId   = (int) $request->param('id');
        $consultant   = $this->consultantModel->findByUserId($userId);
        if (!$consultant) Response::error('Consultant profile not found.', 404);

        $patient = $this->patientModel->findById($patientId);
        if (!$patient) Response::error('Patient not found.', 404);

        // Ownership check
        if (!$this->logModel->consultantHasAccess((int) $consultant['consultantId'], $patientId)) {
            Response::error('Forbidden — you do not have access to this patient\'s progress.', 403);
        }

        $data = $request->all();

        $anxiety      = isset($data['anxietyScore'])      ? (float) $data['anxietyScore']      : null;
        $depression   = isset($data['depressionScore'])   ? (float) $data['depressionScore']   : null;
        $overthinking = isset($data['overthinkingScore']) ? (float) $data['overthinkingScore'] : null;
        $overall      = isset($data['overallScore'])      ? (float) $data['overallScore']      : null;

        if ($anxiety === null && $depression === null && $overthinking === null && $overall === null) {
            Response::error('At least one score field is required.', 422);
        }

        $logId = $this->logModel->create([
            'patientId'         => $patientId,
            'consultantId'      => (int) $consultant['consultantId'],
            'anxietyScore'      => $anxiety ?? 0,
            'depressionScore'   => $depression ?? 0,
            'overthinkingScore' => $overthinking ?? 0,
            'overallScore'      => $overall ?? 0,
            'note'              => $data['note'] ?? null,
        ]);

        Response::json(['progressId' => $logId], 201);
    }
}
