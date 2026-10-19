<?php

declare(strict_types=1);

namespace Api\Core;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

class TokenManager
{
    private string $secret;
    private int $accessTtl;
    private int $refreshTtl;

    public function __construct()
    {
        $this->secret     = $_ENV['JWT_SECRET'] ?? 'change-me';
        $this->accessTtl  = (int) ($_ENV['JWT_ACCESS_TTL'] ?? 900);
        $this->refreshTtl = (int) ($_ENV['JWT_REFRESH_TTL'] ?? 604800);
    }

    public function issueAccessToken(int $userId, string $role): string
    {
        $now = time();
        return JWT::encode([
            'iss'  => 'healinghorizon',
            'sub'  => $userId,
            'role' => $role,
            'iat'  => $now,
            'exp'  => $now + $this->accessTtl,
            'type' => 'access',
        ], $this->secret, 'HS256');
    }

    public function issueRefreshToken(int $userId): string
    {
        $now = time();
        return JWT::encode([
            'iss'  => 'healinghorizon',
            'sub'  => $userId,
            'iat'  => $now,
            'exp'  => $now + $this->refreshTtl,
            'type' => 'refresh',
        ], $this->secret, 'HS256');
    }

    /**
     * @return array{userId: int, role: string}|null
     */
    public function verifyAccessToken(string $token): ?array
    {
        return $this->verify($token, 'access');
    }

    /**
     * @return array{userId: int}|null
     */
    public function verifyRefreshToken(string $token): ?array
    {
        return $this->verify($token, 'refresh');
    }

    private function verify(string $token, string $expectedType): ?array
    {
        try {
            $payload = (array) JWT::decode($token, new Key($this->secret, 'HS256'));
        } catch (ExpiredException) {
            return null;
        } catch (\Exception) {
            return null;
        }

        if (($payload['type'] ?? '') !== $expectedType) {
            return null;
        }

        return $payload;
    }
}
