<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\Consultant;

class AdminConsultantController
{
    private Consultant $consultantModel;

    public function __construct()
    {
        $this->consultantModel = new Consultant();
    }

    public function index(Request $request): void
    {
        $consultants = $this->consultantModel->findAll();

        // Typecast
        $consultants = array_map(function ($c) {
            $c['consultantId'] = (int) $c['consultantId'];
            $c['userId']       = (int) $c['userId'];
            $c['rating']       = (float) $c['rating'];
            $c['isVerified']   = (bool) $c['isVerified'];
            return $c;
        }, $consultants);

        Response::json($consultants);
    }

    public function create(Request $request): void
    {
        $data = $request->all();

        if (empty($data['name']))     Response::error('name is required.', 422);
        if (empty($data['email']))    Response::error('email is required.', 422);
        if (empty($data['password'])) Response::error('password is required.', 422);

        if (strlen($data['password']) < 8) {
            Response::error('Password must be at least 8 characters.', 422);
        }

        // Check duplicate
        $userModel = new \Api\Models\User();
        $existing = $userModel->findByEmail($data['email']);
        if ($existing) Response::error('A user with this email already exists.', 409);

        $plainPassword = $data['password'];
        $hash = password_hash($plainPassword, PASSWORD_BCRYPT);

        $result = $this->consultantModel->createWithUser([
            'name'          => $data['name'],
            'email'         => $data['email'],
            'password_hash' => $hash,
            'biography'     => $data['biography'] ?? null,
            'gender'        => $data['gender'] ?? null,
            'dob'           => $data['dob'] ?? '1970-01-01',
            'address'       => $data['address'] ?? null,
        ]);

        // Return the temp password ONCE in the response (not stored/logged elsewhere)
        Response::json([
            'consultantId'   => $result['consultantId'],
            'userId'         => $result['userId'],
            'tempPassword'   => $plainPassword,
            'message'        => 'Consultant created. Provide this temporary password to the consultant — it will not be shown again.',
        ], 201);
    }

    public function verify(Request $request): void
    {
        $consultantId = (int) $request->param('id');
        $consultant = $this->consultantModel->findById($consultantId);

        if (!$consultant) Response::error('Consultant not found.', 404);

        $this->consultantModel->verify($consultantId);

        Response::json(['message' => 'Consultant verified.']);
    }

    public function remove(Request $request): void
    {
        $consultantId = (int) $request->param('id');
        $consultant = $this->consultantModel->findById($consultantId);

        if (!$consultant) Response::error('Consultant not found.', 404);

        try {
            $this->consultantModel->remove($consultantId);
        } catch (\PDOException $e) {
            // RESTRICT foreign keys (Appointment, SessionSummary, Referral,
            // ProgressLog) block deletion when the consultant has linked data.
            if ($e->getCode() === '23000') {
                Response::error(
                    'This consultant has linked records (appointments, session summaries, referrals, or progress logs) and cannot be removed.',
                    409
                );
            }
            throw $e;
        }

        Response::json(['message' => 'Consultant removed.']);
    }
}
