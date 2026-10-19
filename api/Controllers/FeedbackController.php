<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\Appointment;
use Api\Models\FeedbackModel;
use Api\Models\Patient;
use Api\Models\Consultant;
use Api\Models\NotificationModel;

class FeedbackController
{
    private Appointment $apptModel;
    private FeedbackModel $feedbackModel;
    private Patient $patientModel;
    private Consultant $consultantModel;
    private NotificationModel $notifModel;

    public function __construct(
        ?Appointment $apptModel = null,
        ?FeedbackModel $feedbackModel = null,
        ?Patient $patientModel = null,
        ?Consultant $consultantModel = null,
        ?NotificationModel $notifModel = null
    ) {
        $this->apptModel      = $apptModel ?? new Appointment();
        $this->feedbackModel  = $feedbackModel ?? new FeedbackModel();
        $this->patientModel   = $patientModel ?? new Patient();
        $this->consultantModel = $consultantModel ?? new Consultant();
        $this->notifModel     = $notifModel ?? new NotificationModel();
    }

    public function create(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $patient = $this->patientModel->findByUserId($userId);
        if (!$patient) Response::error('Patient profile not found.', 404);

        $data = $request->all();

        if (empty($data['appointmentId'])) Response::error('appointmentId is required.', 422);
        if (!isset($data['rating']) || (int) $data['rating'] < 1 || (int) $data['rating'] > 5) {
            Response::error('rating is required and must be between 1 and 5.', 422);
        }

        $appointment = $this->apptModel->findById((int) $data['appointmentId']);
        if (!$appointment) Response::error('Appointment not found.', 404);

        // Ownership: patient must own the appointment
        if ((int) $patient['patientId'] !== (int) $appointment['patientId']) {
            Response::error('Forbidden — this is not your appointment.', 403);
        }

        // Appointment must be completed
        if ($appointment['status'] !== 'completed') {
            Response::error('Feedback can only be left for completed appointments.', 422);
        }

        // Check uniqueness (DB unique constraint on appointmentId will also enforce this)
        $existing = $this->feedbackModel->findByAppointment((int) $data['appointmentId']);
        if ($existing) {
            Response::error('Feedback has already been submitted for this appointment.', 409);
        }

        $feedbackId = $this->feedbackModel->create([
            'appointmentId' => (int) $data['appointmentId'],
            'patientId'     => (int) $patient['patientId'],
            'consultantId'  => (int) $appointment['consultantId'],
            'rating'        => (int) $data['rating'],
            'comment'       => $data['comment'] ?? null,
        ]);

        // Notify both the reviewed consultant and the admins, each with
        // appropriately scoped copy.
        $consultant = $this->consultantModel->findById((int) $appointment['consultantId']);
        if ($consultant) {
            $this->notifModel->create([
                'userId'  => (int) $consultant['userId'],
                'message' => 'You received new feedback from a patient.',
            ]);

            $this->notifModel->notifyAdmins(sprintf(
                'New consultant feedback submitted for %s.',
                $consultant['name'] ?? 'a consultant'
            ));
        }

        Response::json(['feedbackId' => $feedbackId], 201);
    }

    public function forConsultant(Request $request): void
    {
        $consultantId = (int) $request->param('id');
        $consultant = $this->consultantModel->findById($consultantId);

        if (!$consultant) {
            Response::error('Consultant not found.', 404);
        }

        $feedback = $this->feedbackModel->findByConsultant($consultantId);

        // Typecast and hide patient email
        $feedback = array_map(function ($f) {
            $f['feedbackId']    = (int) $f['feedbackId'];
            $f['appointmentId'] = (int) $f['appointmentId'];
            $f['patientId']     = (int) $f['patientId'];
            $f['consultantId']  = (int) $f['consultantId'];
            $f['rating']        = (int) $f['rating'];
            return $f;
        }, $feedback);

        Response::json($feedback);
    }
}
