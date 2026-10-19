<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\AvailabilityModel;
use Api\Models\Consultant;

class AvailabilityController
{
    private AvailabilityModel $availabilityModel;
    private Consultant $consultantModel;

    public function __construct(
        ?AvailabilityModel $availabilityModel = null,
        ?Consultant $consultantModel = null
    ) {
        $this->availabilityModel = $availabilityModel ?? new AvailabilityModel();
        $this->consultantModel   = $consultantModel ?? new Consultant();
    }

    /** Resolve the signed-in consultant's id (403 if not a consultant). */
    private function currentConsultantId(Request $request): int
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $consultant = $this->consultantModel->findByUserId($userId);
        if (!$consultant) {
            Response::error('Consultant profile not found.', 404);
        }
        return (int) $consultant['consultantId'];
    }

    /**
     * GET /api/consultant/availability
     * Returns the consultant's recurring weekly schedule + date overrides.
     */
    public function getMine(Request $request): void
    {
        $consultantId = $this->currentConsultantId($request);
        Response::json([
            'weekly'    => $this->availabilityModel->getWeekly($consultantId),
            'overrides' => $this->availabilityModel->getOverrides($consultantId),
        ]);
    }

    /**
     * PUT /api/consultant/availability/weekly
     * Body: { days: [{ dayOfWeek, available, start, end }, ...] }
     */
    public function saveWeekly(Request $request): void
    {
        $consultantId = $this->currentConsultantId($request);
        $days = $request->input('days');

        if (!is_array($days) || count($days) === 0) {
            Response::error('days array is required.', 422);
        }

        foreach ($days as $day) {
            if (!isset($day['dayOfWeek']) || !is_numeric($day['dayOfWeek'])) {
                Response::error('Each day requires a numeric dayOfWeek (0-6).', 422);
            }
        }

        $this->availabilityModel->saveWeekly($consultantId, $days);
        Response::json($this->availabilityModel->getWeekly($consultantId));
    }

    /**
     * PUT /api/consultant/availability/overrides/:date
     * Body: { available, start?, end? }
     */
    public function upsertOverride(Request $request): void
    {
        $consultantId = $this->currentConsultantId($request);
        $date = (string) $request->param('date');

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            Response::error('Override date must be in YYYY-MM-DD format.', 422);
        }

        $available = !empty($request->input('available'));
        $start = $request->input('start');
        $end   = $request->input('end');

        if ($available && (empty($start) || empty($end))) {
            Response::error('start and end times are required when available is true.', 422);
        }
        if ($available && $start >= $end) {
            Response::error('End time must be after start time.', 422);
        }

        $this->availabilityModel->upsertOverride(
            $consultantId,
            $date,
            $available,
            $available ? $start : null,
            $available ? $end : null
        );

        Response::json($this->availabilityModel->getOverrideForDate($consultantId, $date));
    }

    /**
     * DELETE /api/consultant/availability/overrides/:date
     */
    public function deleteOverride(Request $request): void
    {
        $consultantId = $this->currentConsultantId($request);
        $date = (string) $request->param('date');

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            Response::error('Override date must be in YYYY-MM-DD format.', 422);
        }

        $this->availabilityModel->deleteOverride($consultantId, $date);
        Response::json(['deleted' => true, 'date' => $date]);
    }

    /**
     * GET /api/consultants/:id/availability?date=YYYY-MM-DD
     * Public (used by the patient booking flow) — returns the bookable slots
     * for that consultant/date, already minus overrides and booked times.
     */
    public function availableSlots(Request $request): void
    {
        $consultantId = (int) $request->param('id');
        $date = (string) $request->query('date', '');

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            Response::error('A date query parameter in YYYY-MM-DD format is required.', 422);
        }

        $slots = $this->availabilityModel->computeAvailableSlots($consultantId, $date);

        Response::json([
            'consultantId' => $consultantId,
            'date'         => $date,
            'dayOfWeek'    => (int) date('w', strtotime($date)),
            'slots'        => $slots,
        ]);
    }
}
