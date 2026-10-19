<?php

declare(strict_types=1);

namespace Api\Core;

use Api\Core\Request;
use Api\Core\Response;
use Api\Core\TokenManager;

class AuthMiddleware
{
    private TokenManager $tokenManager;

    public function __construct()
    {
        $this->tokenManager = new TokenManager();
    }

    /**
     * Verifies the Bearer token and attaches the decoded user to the request.
     * Returns the user array or sends a 401 response and exits.
     *
     * @return array{userId: int, role: string}
     */
    public function authenticate(Request $request): array
    {
        $token = $request->bearerToken();

        if (!$token) {
            Response::error('Authentication required.', 401);
        }

        $payload = $this->tokenManager->verifyAccessToken($token);

        if (!$payload) {
            Response::error('Invalid or expired token.', 401);
        }

        $user = [
            'userId' => (int) ($payload['sub'] ?? 0),
            'role'   => $payload['role'] ?? '',
        ];

        $request->user = $user;

        return $user;
    }
}
