<?php

declare(strict_types=1);

namespace Api\Core;

use Firebase\JWT\JWT;

class JaaSTokenManager
{
    private string $appId;
    private string $keyId;
    private string $privateKeyPath;

    public function __construct(
        ?string $appId = null,
        ?string $keyId = null,
        ?string $privateKeyPath = null
    ) {
        $this->appId          = $appId ?? $_ENV['JAAS_APP_ID'] ?? '';
        $this->keyId          = $keyId ?? $_ENV['JAAS_KEY_ID'] ?? '';
        $this->privateKeyPath = $privateKeyPath ?? $_ENV['JAAS_PRIVATE_KEY_PATH'] ?? '';
    }

    public function appId(): string
    {
        return $this->appId;
    }

    /**
     * Full JaaS room name: "<appId>/<roomSlug>". The appId already includes
     * the "vpaas-magic-cookie-" prefix in the credential, so no re-prefixing.
     */
    public function jaasRoomName(string $slug): string
    {
        return $this->appId . '/' . $slug;
    }

    public function issueForParticipant(
        string $roomSlug,
        string $name,
        string $email,
        string $userId,
        bool $moderator,
        int $nbf,
        int $exp
    ): string {
        $payload = [
            'iss'     => 'chat',
            'aud'     => 'jitsi',
            'sub'     => $this->appId,
            'room'    => '*',
            'nbf'     => $nbf,
            'exp'     => $exp,
            'context' => [
                'user' => [
                    'id'        => $userId,
                    'name'      => $name,
                    'email'     => $email,
                    'moderator' => $moderator ? 'true' : 'false',
                ],
                'features' => [
                    'livestreaming' => false,
                    'recording'     => false,
                    'transcription' => false,
                    'outbound-call' => false,
                ],
                'room' => ['regex' => false],
            ],
        ];

        return JWT::encode($payload, $this->loadPrivateKey(), 'RS256', $this->keyId);
    }

    private function loadPrivateKey(): string
    {
        $path = $this->privateKeyPath;
        if ($path === '') {
            throw new \RuntimeException('JaaS is not configured (JAAS_PRIVATE_KEY_PATH is empty).');
        }

        // Relative paths resolve against the api/ directory so the key can live
        // alongside .env without being committed.
        if ($path[0] !== '/' && !preg_match('/^[A-Za-z]:[\\\\\\/]/', $path)) {
            $path = dirname(__DIR__, 2) . '/' . $path;
        }

        if (!is_file($path)) {
            throw new \RuntimeException('JaaS private key not found at ' . $path);
        }

        $key = file_get_contents($path);
        if ($key === false || trim($key) === '') {
            throw new \RuntimeException('JaaS private key is empty.');
        }

        return $key;
    }
}
