<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\NotificationModel;

class NotificationController
{
    private NotificationModel $notifModel;

    public function __construct()
    {
        $this->notifModel = new NotificationModel();
    }

    public function index(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $notifications = $this->notifModel->findByUser($userId);
        Response::json($notifications);
    }

    public function markRead(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $notifId = (int) $request->param('id');

        $notif = $this->notifModel->findById($notifId);
        if (!$notif) {
            Response::error('Notification not found.', 404);
        }

        // Ownership: notification must belong to the authenticated user
        if ((int) $notif['userId'] !== $userId) {
            Response::error('Forbidden.', 403);
        }

        $this->notifModel->markAsRead($notifId);
        Response::json(['message' => 'Notification marked as read.']);
    }
}
