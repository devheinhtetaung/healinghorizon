<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\User;
use Api\Models\Patient;
use Api\Models\Consultant;
use Api\Models\AdminModel;
use Api\Models\Appointment;

class UserController
{
    private User $userModel;
    private Patient $patientModel;
    private Consultant $consultantModel;
    private AdminModel $adminModel;
    private Appointment $appointmentModel;

    public function __construct()
    {
        $this->userModel       = new User();
        $this->patientModel    = new Patient();
        $this->consultantModel = new Consultant();
        $this->adminModel      = new AdminModel();
        $this->appointmentModel = new Appointment();
    }

    public function me(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $role   = $request->user['role'] ?? '';

        $user = $this->userModel->findById($userId);
        if (!$user) {
            Response::error('User not found.', 404);
        }

        unset($user['password_hash']);

        // Attach role-specific profile
        $profile = null;

        switch ($role) {
            case 'patient':
                $profile = $this->patientModel->findByUserId($userId);
                break;
            case 'consultant':
                $profile = $this->consultantModel->findByUserId($userId);
                if ($profile) {
                    $profile['totalSessions'] = $this->appointmentModel
                        ->countCompletedForConsultant((int) $profile['consultantId']);
                }
                break;
            case 'admin':
                $profile = $this->adminModel->findByUserId($userId);
                break;
        }

        Response::json([
            'user'    => $user,
            'profile' => $profile,
        ]);
    }

    public function update(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $role   = $request->user['role'] ?? '';
        $data   = $request->all();

        if (isset($data['emailNotification'])) {
            $data['emailNotification'] = (int) filter_var($data['emailNotification'], FILTER_VALIDATE_BOOLEAN);
        }

        // Update base user fields
        $userData = [];
        foreach (['name', 'gender', 'dob', 'address'] as $field) {
            if (array_key_exists($field, $data)) {
                $userData[$field] = $data[$field];
            }
        }

        if (!empty($userData)) {
            $this->userModel->update($userId, $userData);
        }

        // Update role-specific fields
        if ($role === 'patient') {
            $patient = $this->patientModel->findByUserId($userId);
            if ($patient) {
                $patientData = [];
                foreach (['supportPreference', 'emailNotification'] as $field) {
                    if (array_key_exists($field, $data)) {
                        $patientData[$field] = $data[$field];
                    }
                }
                if (!empty($patientData)) {
                    $this->patientModel->update((int) $patient['patientId'], $patientData);
                }
            }
        }

        // Return updated profile
        $this->me($request);
    }

    public function changePassword(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $data   = $request->all();

        if (empty($data['currentPassword'])) {
            Response::error('Current password is required.', 422);
        }
        if (empty($data['newPassword']) || strlen($data['newPassword']) < 8) {
            Response::error('New password must be at least 8 characters.', 422);
        }

        $user = $this->userModel->findById($userId);
        if (!$user || !password_verify($data['currentPassword'], $user['password_hash'])) {
            Response::error('Current password is incorrect.', 401);
        }

        $newHash = password_hash($data['newPassword'], PASSWORD_BCRYPT);
        $this->userModel->updatePassword($userId, $newHash);

        Response::json(['message' => 'Password changed successfully.']);
    }
}
