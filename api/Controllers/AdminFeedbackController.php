<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\FeedbackModel;

class AdminFeedbackController
{
    private FeedbackModel $feedbackModel;

    public function __construct()
    {
        $this->feedbackModel = new FeedbackModel();
    }

    public function index(Request $request): void
    {
        $consultantId = $request->query('consultantId');
        $rating       = $request->query('rating');
        $search       = $request->query('search', '');

        // The FeedbackModel has findByConsultant — but we need a general admin listing.
        // We'll use the underlying DB/direct query for the admin listing with filters.
        $db = \Api\Core\Database::getInstance();

        $sql = 'SELECT f.*, u.name AS patientName, uc.name AS consultantName
                FROM `Feedback` f
                JOIN `Patient` p ON p.patientId = f.patientId
                JOIN `Users` u ON u.userId = p.userId
                JOIN `Consultant` c ON c.consultantId = f.consultantId
                JOIN `Users` uc ON uc.userId = c.userId
                WHERE 1=1';
        $params = [];

        if ($consultantId) {
            $sql .= ' AND f.consultantId = :cid';
            $params['cid'] = (int) $consultantId;
        }
        if ($rating) {
            $sql .= ' AND f.rating = :rating';
            $params['rating'] = (int) $rating;
        }
        if ($search !== '') {
            $sql .= ' AND (u.name LIKE :search OR uc.name LIKE :search2 OR f.comment LIKE :search3)';
            $params['search']  = "%{$search}%";
            $params['search2'] = "%{$search}%";
            $params['search3'] = "%{$search}%";
        }

        $sql .= ' ORDER BY f.createdAt DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $feedback = $stmt->fetchAll();

        $feedback = array_map(function ($f) {
            $f['feedbackId']    = (int) $f['feedbackId'];
            $f['appointmentId'] = (int) $f['appointmentId'];
            $f['patientId']     = (int) $f['patientId'];
            $f['consultantId']  = (int) $f['consultantId'];
            $f['rating']        = (int) $f['rating'];
            return $f;
        }, $feedback);

        Response::json($feedback);
    }

    public function remove(Request $request): void
    {
        $id = (int) $request->param('id');
        $db = \Api\Core\Database::getInstance();

        $stmt = $db->prepare('SELECT * FROM `Feedback` WHERE `feedbackId` = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        if (!$row) Response::error('Feedback not found.', 404);

        $stmt = $db->prepare('DELETE FROM `Feedback` WHERE `feedbackId` = :id');
        $stmt->execute(['id' => $id]);

        Response::json(['message' => 'Feedback removed.']);
    }
}
