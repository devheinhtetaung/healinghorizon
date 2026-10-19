<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\AdminMetricsModel;

/**
 * Admin-only dashboard metric endpoints. Each returns a zero-filled trend
 * series (`[{label, value}]`) over a bounded default range.
 */
class AdminMetricsController
{
    private AdminMetricsModel $model;

    public function __construct(?AdminMetricsModel $model = null)
    {
        $this->model = $model ?? new AdminMetricsModel();
    }

    /** Clamp the `days` query param to a sane 1..365 range. */
    private function days(Request $request, int $default): int
    {
        $days = (int) $request->query('days', $default);
        return ($days >= 1 && $days <= 365) ? $days : $default;
    }

    public function userGrowth(Request $request): void
    {
        Response::json($this->model->userGrowth($this->days($request, 90)));
    }

    public function sessionVolume(Request $request): void
    {
        Response::json($this->model->sessionVolume($this->days($request, 90)));
    }

    public function consultantRatings(Request $request): void
    {
        Response::json($this->model->consultantRatings());
    }

    public function donationRevenue(Request $request): void
    {
        Response::json($this->model->donationRevenue($this->days($request, 90)));
    }

    public function moderation(Request $request): void
    {
        Response::json($this->model->reportActivity($this->days($request, 30)));
    }
}
