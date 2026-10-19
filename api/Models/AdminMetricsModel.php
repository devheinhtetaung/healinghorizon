<?php

declare(strict_types=1);

namespace Api\Models;

use Api\Core\Database;
use PDO;

/**
 * Aggregation queries backing the admin dashboard metric charts.
 *
 * Each method returns a zero-filled trend series of `[{ label, value }]` so
 * charts render a continuous axis even when a bucket has no data. Default
 * ranges (last 30/90 days) are enforced by the controller; the model accepts
 * an explicit number of days for flexibility and testability.
 *
 * Note on time semantics: `createdAt` / `donatedAt` are stored in the DB
 * server's timezone and bucketed with `DATE()` / `WEEKDAY()` in that same
 * timezone, which keeps the admin-facing trend internally consistent.
 */
class AdminMetricsModel
{
    private ?PDO $db = null;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db; // lazy connection (see conn())
    }

    private function conn(): PDO
    {
        if ($this->db === null) {
            $this->db = Database::getInstance();
        }
        return $this->db;
    }

    /** New user accounts per day. */
    public function userGrowth(int $days = 90): array
    {
        $rows = $this->countByDay('Users', 'createdAt', $days);
        return $this->zeroFillDaily($rows, $days);
    }

    /** Booked appointments per week (createdAt = booking time). */
    public function sessionVolume(int $days = 90): array
    {
        $rows = $this->countByWeek('Appointment', 'createdAt', $days);
        return $this->zeroFillWeekly($rows, $days);
    }

    /** Distribution of feedback ratings (5★ → 1★). */
    public function consultantRatings(): array
    {
        $stmt = $this->conn()->query(
            'SELECT rating, COUNT(*) AS c FROM `Feedback` GROUP BY rating'
        );
        $byRating = [];
        foreach ($stmt->fetchAll() as $row) {
            $byRating[(int) $row['rating']] = (int) $row['c'];
        }

        $out = [];
        for ($r = 5; $r >= 1; $r--) {
            $out[] = ['label' => "{$r} ★", 'value' => $byRating[$r] ?? 0];
        }
        return $out;
    }

    /** Completed donation revenue per week. */
    public function donationRevenue(int $days = 90): array
    {
        $from = date('Y-m-d 00:00:00', strtotime("-{$days} days"));
        $stmt = $this->conn()->prepare(
            "SELECT DATE(DATE_SUB(donatedAt, INTERVAL WEEKDAY(donatedAt) DAY)) AS bucket,
                    SUM(amount) AS s
             FROM `Donation`
             WHERE status = 'completed' AND donatedAt >= :from
             GROUP BY bucket"
        );
        $stmt->execute(['from' => $from]);
        $rows = [];
        foreach ($stmt->fetchAll() as $row) {
            $rows[] = ['bucket' => $row['bucket'], 'c' => (float) $row['s']];
        }
        return $this->zeroFillWeekly($rows, $days);
    }

    /** Flagged posts (reports) entering the moderation queue per day. */
    public function reportActivity(int $days = 30): array
    {
        $rows = $this->countByDay('PostReport', 'createdAt', $days);
        return $this->zeroFillDaily($rows, $days);
    }

    /* ── aggregation primitives ── */

    private function countByDay(string $table, string $column, int $days): array
    {
        $from = date('Y-m-d 00:00:00', strtotime("-{$days} days"));
        $stmt = $this->conn()->prepare(
            "SELECT DATE({$column}) AS bucket, COUNT(*) AS c
             FROM `{$table}`
             WHERE {$column} >= :from
             GROUP BY DATE({$column})"
        );
        $stmt->execute(['from' => $from]);
        return array_map(
            fn ($r) => ['bucket' => $r['bucket'], 'c' => (int) $r['c']],
            $stmt->fetchAll()
        );
    }

    private function countByWeek(string $table, string $column, int $days): array
    {
        $from = date('Y-m-d 00:00:00', strtotime("-{$days} days"));
        $stmt = $this->conn()->prepare(
            "SELECT DATE(DATE_SUB({$column}, INTERVAL WEEKDAY({$column}) DAY)) AS bucket,
                    COUNT(*) AS c
             FROM `{$table}`
             WHERE {$column} >= :from
             GROUP BY bucket"
        );
        $stmt->execute(['from' => $from]);
        return array_map(
            fn ($r) => ['bucket' => $r['bucket'], 'c' => (int) $r['c']],
            $stmt->fetchAll()
        );
    }

    private function zeroFillDaily(array $rows, int $days): array
    {
        $buckets = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $buckets[$date] = ['label' => date('M j', strtotime($date)), 'value' => 0];
        }
        foreach ($rows as $row) {
            $d = (string) $row['bucket'];
            if (isset($buckets[$d])) {
                $buckets[$d]['value'] = $row['c'];
            }
        }
        return array_values($buckets);
    }

    private function zeroFillWeekly(array $rows, int $days): array
    {
        $buckets = [];
        $start  = strtotime("-{$days} days");
        $monday = strtotime('monday this week', $start);
        for ($t = $monday; $t <= time(); $t = strtotime('+7 days', $t)) {
            $date = date('Y-m-d', $t);
            $buckets[$date] = ['label' => date('M j', $t), 'value' => 0];
        }
        foreach ($rows as $row) {
            $d = (string) $row['bucket'];
            if (isset($buckets[$d])) {
                $buckets[$d]['value'] = $row['c'];
            }
        }
        return array_values($buckets);
    }
}
