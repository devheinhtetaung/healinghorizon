<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Core\TokenManager;
use Api\Models\User;
use Api\Models\Patient;

class AuthController
{
    private User $userModel;
    private Patient $patientModel;
    private TokenManager $tokenManager;

    public function __construct(
        ?User $userModel = null,
        ?Patient $patientModel = null,
        ?TokenManager $tokenManager = null
    ) {
        $this->userModel    = $userModel ?? new User();
        $this->patientModel = $patientModel ?? new Patient();
        $this->tokenManager = $tokenManager ?? new TokenManager();
    }

    public function register(Request $request): void
    {
        $data = $request->all();

        $data['emailNotification'] = isset($data['emailNotification'])
            ? (int) filter_var($data['emailNotification'], FILTER_VALIDATE_BOOLEAN)
            : 1;

        // --- Validation ---
        $errors = [];

        if (empty($data['name'])) {
            $errors['name'] = 'Name is required.';
        }

        if (empty($data['email'])) {
            $errors['email'] = 'Email is required.';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'A valid email is required.';
        }

        if (empty($data['password'])) {
            $errors['password'] = 'Password is required.';
        } elseif (strlen($data['password']) < 8) {
            $errors['password'] = 'Password must be at least 8 characters.';
        }

        if (empty($data['dob'])) {
            $errors['dob'] = 'Date of birth is required.';
        }

        if (!empty($errors)) {
            Response::error(json_encode($errors), 422);
        }

        // Check duplicate
        $existing = $this->userModel->findByEmail($data['email']);
        if ($existing) {
            Response::error('A user with this email already exists.', 409);
        }

        // --- Create user + patient profile atomically ---
        // Both rows are created in a single transaction inside
        // Patient::createWithUser so a failure on either INSERT can never leave
        // an orphaned patient account (a Users row without a Patient row).
        $hash = password_hash($data['password'], PASSWORD_BCRYPT);

        $result = $this->patientModel->createWithUser(
            [
                'name'          => $data['name'],
                'email'         => $data['email'],
                'password_hash' => $hash,
                'gender'        => $data['gender'] ?? null,
                'dob'           => $data['dob'],
                'address'       => $data['address'] ?? null,
            ],
            [
                'supportPreference' => $data['supportPreference'] ?? null,
                'emailNotification' => $data['emailNotification'] ?? 1,
            ]
        );

        $userId = (int) $result['userId'];

        // --- Tokens ---
        $accessToken  = $this->tokenManager->issueAccessToken($userId, 'patient');
        $refreshToken = $this->tokenManager->issueRefreshToken($userId);

        Response::json([
            'user'         => [
                'userId' => $userId,
                'name'   => $data['name'],
                'email'  => $data['email'],
                'role'   => 'patient',
            ],
            'accessToken'  => $accessToken,
            'refreshToken' => $refreshToken,
        ], 201);
    }

    public function login(Request $request): void
    {
        $data = $request->all();

        if (empty($data['email']) || empty($data['password'])) {
            Response::error('Email and password are required.', 422);
        }

        $user = $this->userModel->findByEmail($data['email']);
        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            Response::error('Invalid email or password.', 401);
        }

        if ((int) $user['isBanned'] === 1) {
            Response::error(
                'Your account has been suspended. Reason: ' . ($user['banReason'] ?? 'No reason provided.'),
                403
            );
        }

        $accessToken  = $this->tokenManager->issueAccessToken((int) $user['userId'], $user['role']);
        $refreshToken = $this->tokenManager->issueRefreshToken((int) $user['userId']);

        unset($user['password_hash']);

        Response::json([
            'user'         => $user,
            'accessToken'  => $accessToken,
            'refreshToken' => $refreshToken,
        ]);
    }

    public function refresh(Request $request): void
    {
        $token = $request->input('refreshToken');
        if (!$token) {
            Response::error('Refresh token is required.', 422);
        }

        $payload = $this->tokenManager->verifyRefreshToken($token);
        if (!$payload) {
            Response::error('Invalid or expired refresh token.', 401);
        }

        $userId = (int) ($payload['sub'] ?? 0);
        $user   = $this->userModel->findById($userId);
        if (!$user) {
            Response::error('User not found.', 404);
        }

        $accessToken = $this->tokenManager->issueAccessToken($userId, $user['role']);

        Response::json([
            'accessToken' => $accessToken,
        ]);
    }

    public function logout(Request $request): void
    {
        // Stateless logout — clients discard the token.
        // A token blacklist could be added here for production hardening.
        Response::json(['message' => 'Logged out successfully. Please discard your tokens client-side.']);
    }
}
