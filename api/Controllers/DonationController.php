<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Core\AuthMiddleware;
use Api\Models\Donation;
use Api\Models\User;

class DonationController
{
    private Donation $donationModel;
    private User $userModel;

    public function __construct()
    {
        $this->donationModel = new Donation();
        $this->userModel     = new User();
    }

    /**
     * Public endpoint — no auth required.
     * If an optional Bearer token is present and the donation is not anonymous,
     * the donor's userId is attached to the donation record.
     *
     * NOTE: This endpoint has no rate limiting in the current implementation.
     * A simplified demonstration deployment can accept this trade-off; production would add
     * throttling middleware (e.g. per-IP limits).
     */
    public function create(Request $request): void
    {
        $data = $request->all();

        if (empty($data['amount']) || !is_numeric($data['amount']) || (float) $data['amount'] <= 0) {
            Response::error('A valid positive amount is required.', 422);
        }

        $amount  = (float) $data['amount'];
        $isAnon  = !empty($data['anonymousDonation']);
        $userId  = null;

        // Attempt to attach userId if token present and not anonymous
        $token = $request->bearerToken();
        if ($token && !$isAnon) {
            $auth = new AuthMiddleware();
            try {
                $user = $auth->authenticate($request);
                $userId = $user['userId'] ?? null;
            } catch (\Exception) {
                // Token invalid — proceed as guest; no error returned
            }
        }

        $donarName  = null;
        $donarEmail = null;

        if (!$isAnon && !$userId) {
            // Named guest donation
            $donarName  = $data['donarName'] ?? null;
            $donarEmail = $data['donarEmail'] ?? null;
        }

        $id = $this->donationModel->create([
            'userId'            => $userId,
            'amount'            => $amount,
            'anonymousDonation' => $isAnon,
            'donarName'         => $isAnon ? null : $donarName,
            'donarEmail'        => $isAnon ? null : $donarEmail,
            'status'            => 'completed',
        ]);

        Response::json([
            'donationId' => $id,
            'amount'     => $amount,
            'status'     => 'completed',
        ], 201);
    }

    public function index(Request $request): void
    {
        $donations = $this->donationModel->findAll();

        $donations = array_map(function ($d) {
            $d['donationId']        = (int) $d['donationId'];
            $d['userId']            = $d['userId'] ? (int) $d['userId'] : null;
            $d['amount']            = (float) $d['amount'];
            $d['anonymousDonation'] = (bool) $d['anonymousDonation'];
            return $d;
        }, $donations);

        Response::json($donations);
    }
}
