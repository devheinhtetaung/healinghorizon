<?php

declare(strict_types=1);

namespace Api\Core;

class Response
{
    /** Set to true during testing to throw instead of exit. */
    public static bool $testing = false;

    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => $status >= 200 && $status < 300,
            'data'    => $data,
            'error'   => null,
        ], JSON_UNESCAPED_UNICODE);
        self::terminate();
    }

    public static function error(string $message, int $status = 400): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'data'    => null,
            'error'   => $message,
        ], JSON_UNESCAPED_UNICODE);
        self::terminate();
    }

    private static function terminate(): never
    {
        if (self::$testing) {
            throw new \RuntimeException('Response sent');
        }
        exit;
    }
}
