<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\User;

class AvatarController
{
    // Server-side constraints must match the client-side checks (Round G5):
    // JPG/PNG/WebP only, 5 MB maximum.
    private const MAX_BYTES = 5 * 1024 * 1024;

    private const ALLOWED_MIME = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    private User $userModel;

    public function __construct(?User $userModel = null)
    {
        $this->userModel = $userModel ?? new User();
    }

    /**
     * Absolute filesystem directory avatars are stored in. Uploaded files are
     * served back over the public GET /api/uploads/avatars/:filename route.
     */
    private function storageDir(): string
    {
        return dirname(__DIR__, 2) . '/storage/uploads/avatars';
    }

    public function upload(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        if ($userId <= 0) {
            Response::error('Unauthorised.', 401);
        }

        $file = $request->file('avatar');
        if (!$file) {
            Response::error('No file uploaded.', 422);
        }

        $this->assertNoUploadError((int) $file['error']);

        // Size is reported by PHP from the actual upload — it cannot be faked
        // by a client header, so trusting it here is safe.
        $size = (int) $file['size'];
        if ($size > self::MAX_BYTES) {
            Response::error('File exceeds the 5 MB limit.', 413);
        }
        if ($size <= 0) {
            Response::error('The uploaded file is empty.', 422);
        }

        // Validate the real bytes, not the client-supplied filename/MIME.
        // finfo reads the file content, so a disguised non-image (e.g. a text
        // file renamed to .png) is rejected even if its claimed type is an image.
        $detected = (new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if ($detected === false || !isset(self::ALLOWED_MIME[$detected])) {
            Response::error('Unsupported file type — only JPG, PNG, and WebP images are allowed.', 415);
        }

        $ext = self::ALLOWED_MIME[$detected];

        // Never trust the client's original filename: generate a safe, unique
        // name from the user id + time + random bytes and the *validated* ext.
        $filename = sprintf(
            'avatar_%d_%d_%s.%s',
            $userId,
            time(),
            bin2hex(random_bytes(4)),
            $ext
        );

        $dir = $this->storageDir();
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            Response::error('Could not create upload directory.', 500);
        }

        $dest = $dir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            Response::error('Failed to store the uploaded file.', 500);
        }

        // Best-effort cleanup of the previous avatar so replaced photos don't
        // accumulate on disk.
        $this->deleteStoredAvatar($userId);

        $url = '/api/uploads/avatars/' . $filename;
        $this->userModel->update($userId, ['avatarUrl' => $url]);

        Response::json(['avatarUrl' => $url], 200);
    }

    public function remove(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        if ($userId <= 0) {
            Response::error('Unauthorised.', 401);
        }

        $this->deleteStoredAvatar($userId);
        $this->userModel->update($userId, ['avatarUrl' => null]);

        Response::json(['avatarUrl' => null], 200);
    }

    /**
     * Publicly serve an uploaded avatar. No auth — <img> tags cannot carry an
     * Authorization header, and avatars are treated as public resources.
     */
    public function serve(Request $request): void
    {
        $filename = (string) $request->param('filename');
        if (!preg_match('/^[a-zA-Z0-9._-]+$/', $filename) || str_contains($filename, '..')) {
            Response::error('Not Found', 404);
        }

        $path = $this->storageDir() . '/' . $filename;
        if (!is_file($path)) {
            Response::error('Not Found', 404);
        }

        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $mime = [
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'webp' => 'image/webp',
        ][$ext] ?? 'application/octet-stream';

        http_response_code(200);
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . (string) filesize($path));
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($path);
        // readfile() streams; no Response::json() envelope here.
        exit;
    }

    private function assertNoUploadError(int $error): void
    {
        match ($error) {
            UPLOAD_ERR_OK          => null,
            UPLOAD_ERR_INI_SIZE,
            UPLOAD_ERR_FORM_SIZE    => Response::error('File exceeds the 5 MB limit.', 413),
            UPLOAD_ERR_PARTIAL      => Response::error('The upload was interrupted. Please try again.', 422),
            UPLOAD_ERR_NO_FILE      => Response::error('No file uploaded.', 422),
            default                 => Response::error('Upload failed. Please try again.', 422),
        };
    }

    private function deleteStoredAvatar(int $userId): void
    {
        $user = $this->userModel->findById($userId);
        if (!$user || empty($user['avatarUrl'])) {
            return;
        }

        // Only unlink files that live under our own avatars directory.
        $url = (string) $user['avatarUrl'];
        $basename = basename($url);
        if ($basename === '' || !preg_match('/^avatar_\d+_/', $basename)) {
            return;
        }

        $path = $this->storageDir() . '/' . $basename;
        if (is_file($path)) {
            @unlink($path);
        }
    }
}
