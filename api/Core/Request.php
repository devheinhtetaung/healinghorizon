<?php

declare(strict_types=1);

namespace Api\Core;

class Request
{
    private array $body;
    private array $params;
    private array $query;
    private array $headers;
    private string $method;
    private string $uri;

    /** @var array|null Decoded JWT payload attached by AuthMiddleware */
    public ?array $user = null;

    public function __construct()
    {
        $this->method  = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $this->uri     = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $this->headers = $this->parseHeaders();
        $this->query   = $_GET ?? [];
        $this->params  = [];
        $this->body    = $this->parseBody();
    }

    public function method(): string
    {
        return $this->method;
    }

    public function uri(): string
    {
        return '/' . trim($this->uri, '/');
    }

    public function param(string $key, mixed $default = null): mixed
    {
        return $this->params[$key] ?? $default;
    }

    public function setParams(array $params): void
    {
        $this->params = $params;
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }

    /**
     * Access an uploaded file from a multipart/form-data request.
     *
     * @return array{name:string,tmp_name:string,size:int,error:int}|null
     */
    public function file(string $key): ?array
    {
        return $_FILES[$key] ?? null;
    }

    public function all(): array
    {
        return $this->body;
    }

    public function header(string $key, mixed $default = null): mixed
    {
        $normalized = strtolower($key);
        foreach ($this->headers as $hKey => $value) {
            if (strtolower($hKey) === $normalized) {
                return $value;
            }
        }
        return $default;
    }

    public function bearerToken(): ?string
    {
        $auth = $this->header('Authorization');
        if ($auth && preg_match('/^Bearer\s+(.+)$/i', $auth, $matches)) {
            return $matches[1];
        }
        return null;
    }

    private function parseHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
                $headers[$name] = $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['Content-Type'] = $_SERVER['CONTENT_TYPE'];
        }
        return $headers;
    }

    private function parseBody(): array
    {
        $contentType = $this->header('Content-Type') ?? '';

        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input');
            return json_decode($raw, true) ?: [];
        }

        if ($this->method === 'POST' || $this->method === 'PUT' || $this->method === 'PATCH') {
            return $_POST ?: [];
        }

        return [];
    }
}
