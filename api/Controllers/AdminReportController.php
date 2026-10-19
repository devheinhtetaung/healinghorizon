<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\PostReport;

class AdminReportController
{
    private PostReport $reportModel;

    public function __construct(?PostReport $reportModel = null)
    {
        $this->reportModel = $reportModel ?? new PostReport();
    }

    public function index(Request $request): void
    {
        $status = (string) $request->query('status', '');

        if ($status !== '' && !in_array($status, PostReport::STATUSES, true)) {
            Response::error('Invalid status filter.', 422);
        }

        $reports = $this->reportModel->findAll($status !== '' ? $status : null);

        $reports = array_map(function ($r) {
            $r['postReportId'] = (int) $r['postReportId'];
            $r['postId']       = (int) $r['postId'];
            $r['reporterId']   = (int) $r['reporterId'];
            $r['anonymousPost'] = (bool) $r['anonymousPost'];
            return $r;
        }, $reports);

        Response::json($reports);
    }

    public function updateStatus(Request $request): void
    {
        $postReportId = (int) $request->param('id');
        $status       = (string) $request->input('status', '');

        if (!in_array($status, PostReport::STATUSES, true)) {
            Response::error('A valid status is required.', 422);
        }

        $report = $this->reportModel->findById($postReportId);
        if (!$report) {
            Response::error('Report not found.', 404);
        }

        $this->reportModel->updateStatus($postReportId, $status);

        Response::json([
            'postReportId' => $postReportId,
            'status'       => $status,
        ]);
    }
}
