<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\Referral;
use Api\Models\Patient;
use Api\Models\Consultant;
use Api\Models\Psychiatrist;

class ReferralController
{
    private Referral $referralModel;
    private Patient $patientModel;
    private Consultant $consultantModel;
    private Psychiatrist $psychiatristModel;

    public function __construct()
    {
        $this->referralModel     = new Referral();
        $this->patientModel      = new Patient();
        $this->consultantModel   = new Consultant();
        $this->psychiatristModel = new Psychiatrist();
    }

    public function index(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $consultant = $this->consultantModel->findByUserId($userId);
        if (!$consultant) Response::error('Consultant profile not found.', 404);

        $referrals = $this->referralModel->findByConsultant((int) $consultant['consultantId']);
        Response::json($referrals);
    }

    public function create(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $consultant = $this->consultantModel->findByUserId($userId);
        if (!$consultant) Response::error('Consultant profile not found.', 404);

        $data = $request->all();

        if (empty($data['patientId']))     Response::error('patientId is required.', 422);
        if (empty($data['caseOfReferral'])) Response::error('caseOfReferral is required.', 422);

        $toConsultantId   = !empty($data['referToConsultantId']) ? (int) $data['referToConsultantId'] : null;
        $toPsychiatristId = !empty($data['referToPsychiatristId']) ? (int) $data['referToPsychiatristId'] : null;

        // Exactly one target must be set
        if (($toConsultantId && $toPsychiatristId) || (!$toConsultantId && !$toPsychiatristId)) {
            Response::error(
                'Exactly one of referToConsultantId or referToPsychiatristId must be provided.',
                422
            );
        }

        // Validate target exists
        if ($toConsultantId) {
            $target = $this->consultantModel->findById($toConsultantId);
            if (!$target) Response::error('Referral target consultant not found.', 422);
        }
        if ($toPsychiatristId) {
            $target = $this->psychiatristModel->findById($toPsychiatristId);
            if (!$target) Response::error('Referral target psychiatrist not found.', 422);
        }

        // Validate patient
        $patient = $this->patientModel->findById((int) $data['patientId']);
        if (!$patient) Response::error('Patient not found.', 404);

        $id = $this->referralModel->create([
            'consultantId'          => (int) $consultant['consultantId'],
            'patientId'             => (int) $data['patientId'],
            'caseOfReferral'        => $data['caseOfReferral'],
            'referToConsultantId'   => $toConsultantId,
            'referToPsychiatristId' => $toPsychiatristId,
            'status'                => 'pending',
        ]);

        Response::json(['referralId' => $id], 201);
    }
}
