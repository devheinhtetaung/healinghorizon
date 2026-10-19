<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\Appointment;
use Api\Models\Consultant;
use Api\Models\Patient;
use Api\Models\SessionSummary;

class SessionSummaryController
{
    private Appointment $apptModel;
    private Patient $patientModel;
    private Consultant $consultantModel;
    private SessionSummary $summaryModel;

    public function __construct(
        ?Appointment $apptModel = null,
        ?Patient $patientModel = null,
        ?Consultant $consultantModel = null,
        ?SessionSummary $summaryModel = null
    ) {
        $this->apptModel       = $apptModel ?? new Appointment();
        $this->patientModel    = $patientModel ?? new Patient();
        $this->consultantModel = $consultantModel ?? new Consultant();
        $this->summaryModel    = $summaryModel ?? new SessionSummary();
    }

    /**
     * Read the summary for an appointment. The owning patient and the owning
     * consultant may both read it; nobody else can.
     */
    public function show(Request $request): void
    {
        $appointment = $this->findAppointment($request);
        $this->checkOwnership($request, $appointment);

        $summary = $this->summaryModel->findByAppointment((int) $appointment['appointmentId']);

        Response::json($summary);
    }

    /**
     * Create or update the summary for an appointment (consultant only, and
     * only the consultant who owns the appointment).
     */
    public function upsert(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $role   = $request->user['role'] ?? '';

        // Write boundary: consultants only.
        if ($role !== 'consultant') {
            Response::error('Forbidden — only consultants can write session summaries.', 403);
        }

        $appointment = $this->findAppointment($request);
        $this->checkOwnership($request, $appointment);

        $consultant = $this->consultantModel->findByUserId($userId);
        if (!$consultant) {
            Response::error('Consultant profile not found.', 404);
        }

        $data = $request->all();

        $focus     = trim((string) ($data['focus'] ?? ''));
        $takeaways = trim((string) ($data['takeaways'] ?? ''));
        $nextSteps = trim((string) ($data['nextSteps'] ?? ''));

        // Server-side validation — do not rely on the frontend alone.
        if ($focus === '') {
            Response::error('Session summary content is required.', 422);
        }

        $this->summaryModel->upsert(
            (int) $appointment['appointmentId'],
            (int) $consultant['consultantId'],
            ['focus' => $focus, 'takeaways' => $takeaways, 'nextSteps' => $nextSteps]
        );

        $summary = $this->summaryModel->findByAppointment((int) $appointment['appointmentId']);
        Response::json($summary, 201);
    }

    private function findAppointment(Request $request): array
    {
        $id = (int) $request->param('id');
        $appointment = $this->apptModel->findById($id);

        if (!$appointment) {
            Response::error('Appointment not found.', 404);
        }

        return $appointment;
    }

    /**
     * Same ownership pattern as VideoController: the requesting user must be
     * the patient or consultant linked to the appointment. Everyone else is
     * denied with a 403.
     */
    private function checkOwnership(Request $request, array $appointment): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $role   = $request->user['role'] ?? '';

        if ($role === 'patient') {
            $patient = $this->patientModel->findByUserId($userId);
            if (!$patient || (int) $patient['patientId'] !== (int) $appointment['patientId']) {
                Response::error('Forbidden.', 403);
            }
        } elseif ($role === 'consultant') {
            $consultant = $this->consultantModel->findByUserId($userId);
            if (!$consultant || (int) $consultant['consultantId'] !== (int) $appointment['consultantId']) {
                Response::error('Forbidden.', 403);
            }
        } else {
            Response::error('Unauthorised.', 403);
        }
    }
}
