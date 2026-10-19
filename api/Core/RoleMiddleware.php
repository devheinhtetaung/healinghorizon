<?php

declare(strict_types=1);

namespace Api\Core;

use Api\Core\Request;
use Api\Core\Response;

class RoleMiddleware
{
    /**
     * @param string[] $roles Allowed roles
     */
    public static function guard(Request $request, array $roles): void
    {
        $user = $request->user;

        if (!$user) {
            Response::error('Authentication required.', 401);
        }

        if (!in_array($user['role'], $roles, true)) {
            Response::error('Forbidden — insufficient permissions.', 403);
        }
    }
}
