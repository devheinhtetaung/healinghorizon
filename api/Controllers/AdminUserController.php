<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\User;

class AdminUserController
{
    private User $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function index(Request $request): void
    {
        $search = $request->query('search', '');
        $patients = $this->userModel->findPatients($search);

        // Typecast and remove sensitive fields
        $patients = array_map(function ($p) {
            unset($p['password_hash']);
            $p['isBanned'] = (bool) $p['isBanned'];
            return $p;
        }, $patients);

        Response::json($patients);
    }

    public function ban(Request $request): void
    {
        $userId = (int) $request->param('id');
        $user = $this->userModel->findById($userId);

        if (!$user) Response::error('User not found.', 404);
        if ($user['role'] !== 'patient') Response::error('Only patient accounts can be banned.', 422);

        $reason = $request->input('banReason');
        if (empty(trim((string) ($reason ?? '')))) {
            Response::error('banReason is required.', 422);
        }

        $this->userModel->ban($userId, trim($reason));

        Response::json(['message' => 'User banned.']);
    }

    public function unban(Request $request): void
    {
        $userId = (int) $request->param('id');
        $user = $this->userModel->findById($userId);

        if (!$user) Response::error('User not found.', 404);

        $this->userModel->unban($userId);

        Response::json(['message' => 'User unbanned.']);
    }
}
