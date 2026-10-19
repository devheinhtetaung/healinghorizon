<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

/**
 * Consultant availability: recurring weekly hours + date-specific overrides,
 * plus the slot-computation used by the patient booking flow.
 *
 * `dayOfWeek` follows PHP/JS convention: 0 = Sunday .. 6 = Saturday.
 * Times are stored as TIME and surfaced as "HH:MM".
 */
class AvailabilityModel
{
    private ?PDO $db = null;

    public function __construct(?PDO $db = null)
    {
        // Connection is established lazily on first use so the model can be
        // instantiated (and mocked) without touching the database.
        $this->db = $db;
    }

    private function conn(): PDO
    {
        if ($this->db === null) {
            $this->db = Database::getInstance();
        }
        return $this->db;
    }

    /** Strip trailing seconds from a TIME value ("09:00:00" → "09:00"). */
    private function hhmm(?string $time): ?string
    {
        if ($time === null || $time === '') return null;
        return substr($time, 0, 5);
    }

    /** "HH:MM" → "HH:MM:00" for storage. */
    private function toTime(?string $time): ?string
    {
        if ($time === null || $time === '') return null;
        if (preg_match('/^\d{2}:\d{2}$/', $time)) return $time . ':00';
        return $time;
    }

    /** Map a day-of-week (0-6) to its recurring row, or null. */
    public function getRecurringForDay(int $consultantId, int $dayOfWeek): ?array
    {
        $stmt = $this->conn()->prepare(
            'SELECT * FROM `ConsultantAvailability`
             WHERE `consultantId` = :cid AND `dayOfWeek` = :dow LIMIT 1'
        );
        $stmt->execute(['cid' => $consultantId, 'dow' => $dayOfWeek]);
        $row = $stmt->fetch();
        if (!$row) return null;
        $row['isAvailable'] = (bool) $row['isAvailable'];
        $row['startTime']   = $this->hhmm($row['startTime']);
        $row['endTime']     = $this->hhmm($row['endTime']);
        return $row;
    }

    /** Map a specific date (YYYY-MM-DD) to its override row, or null. */
    public function getOverrideForDate(int $consultantId, string $date): ?array
    {
        $stmt = $this->conn()->prepare(
            'SELECT * FROM `ConsultantAvailabilityOverride`
             WHERE `consultantId` = :cid AND `overrideDate` = :date LIMIT 1'
        );
        $stmt->execute(['cid' => $consultantId, 'date' => $date]);
        $row = $stmt->fetch();
        if (!$row) return null;
        $row['isAvailable'] = (bool) $row['isAvailable'];
        $row['startTime']   = $this->hhmm($row['startTime']);
        $row['endTime']     = $this->hhmm($row['endTime']);
        return $row;
    }

    /**
     * All recurring weekly rows for a consultant, keyed by dayOfWeek (0-6).
     */
    public function getWeekly(int $consultantId): array
    {
        $stmt = $this->conn()->prepare(
            'SELECT * FROM `ConsultantAvailability`
             WHERE `consultantId` = :cid ORDER BY `dayOfWeek`'
        );
        $stmt->execute(['cid' => $consultantId]);
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $dow = (int) $row['dayOfWeek'];
            $out[$dow] = [
                'dayOfWeek'  => $dow,
                'available'  => (bool) $row['isAvailable'],
                'start'      => $this->hhmm($row['startTime']),
                'end'        => $this->hhmm($row['endTime']),
            ];
        }
        return $out;
    }

    /**
     * All overrides for a consultant, keyed by "YYYY-MM-DD".
     */
    public function getOverrides(int $consultantId): array
    {
        $stmt = $this->conn()->prepare(
            'SELECT * FROM `ConsultantAvailabilityOverride`
             WHERE `consultantId` = :cid ORDER BY `overrideDate`'
        );
        $stmt->execute(['cid' => $consultantId]);
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            $out[$row['overrideDate']] = [
                'date'      => $row['overrideDate'],
                'available' => (bool) $row['isAvailable'],
                'start'     => $this->hhmm($row['startTime']),
                'end'       => $this->hhmm($row['endTime']),
            ];
        }
        return $out;
    }

    /**
     * Upsert the full recurring weekly schedule.
     *
     * @param array<int, array{dayOfWeek:int, available:bool, start:?string, end:?string}> $days
     */
    public function saveWeekly(int $consultantId, array $days): bool
    {
        $stmt = $this->conn()->prepare(
            'INSERT INTO `ConsultantAvailability`
                (`consultantId`, `dayOfWeek`, `isAvailable`, `startTime`, `endTime`, `createdAt`, `updatedAt`)
             VALUES (:cid, :dow, :avail, :start, :end, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                `isAvailable` = VALUES(`isAvailable`),
                `startTime`   = VALUES(`startTime`),
                `endTime`     = VALUES(`endTime`),
                `updatedAt`   = NOW()'
        );

        $this->conn()->beginTransaction();
        try {
            foreach ($days as $day) {
                $dow     = (int) $day['dayOfWeek'];
                $avail   = !empty($day['available']) ? 1 : 0;
                $start   = $avail ? $this->toTime($day['start'] ?? null) : null;
                $end     = $avail ? $this->toTime($day['end'] ?? null) : null;
                $stmt->execute([
                    'cid'   => $consultantId,
                    'dow'   => $dow,
                    'avail' => $avail,
                    'start' => $start,
                    'end'   => $end,
                ]);
            }
            $this->conn()->commit();
            return true;
        } catch (\Throwable $e) {
            $this->conn()->rollBack();
            throw $e;
        }
    }

    public function upsertOverride(
        int $consultantId,
        string $date,
        bool $isAvailable,
        ?string $start = null,
        ?string $end = null
    ): bool {
        $stmt = $this->conn()->prepare(
            'INSERT INTO `ConsultantAvailabilityOverride`
                (`consultantId`, `overrideDate`, `isAvailable`, `startTime`, `endTime`, `createdAt`, `updatedAt`)
             VALUES (:cid, :date, :avail, :start, :end, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                `isAvailable` = VALUES(`isAvailable`),
                `startTime`   = VALUES(`startTime`),
                `endTime`     = VALUES(`endTime`),
                `updatedAt`   = NOW()'
        );
        $avail = $isAvailable ? 1 : 0;
        return $stmt->execute([
            'cid'   => $consultantId,
            'date'  => $date,
            'avail' => $avail,
            'start' => $avail ? $this->toTime($start) : null,
            'end'   => $avail ? $this->toTime($end) : null,
        ]);
    }

    public function deleteOverride(int $consultantId, string $date): bool
    {
        $stmt = $this->conn()->prepare(
            'DELETE FROM `ConsultantAvailabilityOverride`
             WHERE `consultantId` = :cid AND `overrideDate` = :date'
        );
        return $stmt->execute(['cid' => $consultantId, 'date' => $date]);
    }

    /**
     * Already-booked slot times ("HH:MM") for a consultant on a date.
     * Cancelled appointments do not occupy a slot.
     */
    public function getBookedTimes(int $consultantId, string $date): array
    {
        $stmt = $this->conn()->prepare(
            "SELECT TIME_FORMAT(`appointmentTime`, '%H:%i') AS t
             FROM `Appointment`
             WHERE `consultantId` = :cid AND `appointmentDate` = :date AND `status` != 'cancelled'"
        );
        $stmt->execute(['cid' => $consultantId, 'date' => $date]);
        return array_map(fn ($r) => $r['t'], $stmt->fetchAll());
    }

    /**
     * Compute the actually-bookable slots for a consultant on a date, from
     * (a) the recurring weekly hours for that weekday, overridden by (b) any
     * date override, minus (c) already-booked times.
     *
     * @return array<int, array{time: string, available: bool}>
     */
    public function computeAvailableSlots(
        int $consultantId,
        string $date,
        int $intervalMinutes = 30
    ): array {
        $dayOfWeek = (int) date('w', strtotime($date));

        $override  = $this->getOverrideForDate($consultantId, $date);
        $start = null;
        $end   = null;

        if ($override !== null) {
            if (!$override['isAvailable']) return []; // blocked day
            $start = $override['startTime'];
            $end   = $override['endTime'];
        } else {
            $recurring = $this->getRecurringForDay($consultantId, $dayOfWeek);
            if ($recurring === null || !$recurring['isAvailable']) return [];
            $start = $recurring['startTime'];
            $end   = $recurring['endTime'];
        }

        if ($start === null || $end === null || $start === '' || $end === '') {
            return [];
        }

        $booked = $this->getBookedTimes($consultantId, $date);
        return $this->generateSlots($start, $end, $booked, $intervalMinutes);
    }

    /**
     * True when a specific "HH:MM:SS" time is within the consultant's
     * effective availability for the date and not already booked.
     */
    public function isTimeAvailable(int $consultantId, string $date, string $time): bool
    {
        $hm = substr($time, 0, 5); // "HH:MM"
        $slots = $this->computeAvailableSlots($consultantId, $date);
        foreach ($slots as $slot) {
            if (!$slot['available']) continue;
            if ($slot['value'] === $hm) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param array<int, string> $bookedTimes "HH:MM"
     */
    private function generateSlots(string $start, string $end, array $bookedTimes, int $intervalMinutes): array
    {
        $slots = [];
        $t     = strtotime($start);
        $endT  = strtotime($end);
        while ($t < $endT) {
            $hm    = date('H:i', $t);
            $slots[] = [
                'time'      => $this->format12h($hm), // "9:00 AM" for display + booking payload
                'value'     => $hm,                   // "09:00" 24h for comparisons
                'available' => !in_array($hm, $bookedTimes, true),
            ];
            $t = strtotime("+{$intervalMinutes} minutes", $t);
        }
        return $slots;
    }

    /** "09:00" → 540 minutes since midnight. */
    private function toMinutes(string $hhmm): int
    {
        [$h, $m] = array_map('intval', explode(':', $hhmm));
        return $h * 60 + $m;
    }

    /** "09:00" → "9:00 AM", "14:30" → "2:30 PM". */
    private function format12h(string $hhmm): string
    {
        $minutes = $this->toMinutes($hhmm);
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;
        $suffix = $h >= 12 ? 'PM' : 'AM';
        $hour12 = $h % 12 === 0 ? 12 : $h % 12;
        return sprintf('%d:%02d %s', $hour12, $m, $suffix);
    }
}
