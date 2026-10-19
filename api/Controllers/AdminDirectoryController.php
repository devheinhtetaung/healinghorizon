<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\Hospital;
use Api\Models\Psychiatrist;
use Api\Models\AdminModel;

class AdminDirectoryController
{
    private Hospital $hospitalModel;
    private Psychiatrist $psychiatristModel;
    private AdminModel $adminModel;

    public function __construct()
    {
        $this->hospitalModel     = new Hospital();
        $this->psychiatristModel = new Psychiatrist();
        $this->adminModel        = new AdminModel();
    }

    // ── Directory: list hospitals ──
    public function listHospitals(Request $request): void
    {
        $city = $request->query('city', '');
        $hospitals = $this->hospitalModel->findAll($city);
        Response::json($hospitals);
    }

    // ── Directory: list psychiatrists ──
    public function listPsychiatrists(Request $request): void
    {
        $hospitalId = $request->query('hospitalId');
        $psychiatrists = $this->psychiatristModel->findAll(
            $hospitalId ? (int) $hospitalId : null
        );
        Response::json($psychiatrists);
    }

    // ── Admin: add hospital ──
    public function createHospital(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $admin = $this->adminModel->findByUserId($userId);
        if (!$admin) Response::error('Admin profile not found.', 404);

        $data = $request->all();
        if (empty($data['hospitalName'])) Response::error('hospitalName is required.', 422);
        if (empty($data['city']))         Response::error('city is required.', 422);

        $id = $this->hospitalModel->create([
            'adminId'      => (int) $admin['adminId'],
            'hospitalName' => $data['hospitalName'],
            'city'         => $data['city'],
            'address'      => $data['address'] ?? null,
        ]);

        Response::json(['hospitalId' => $id], 201);
    }

    // ── Admin: add psychiatrist ──
    public function createPsychiatrist(Request $request): void
    {
        $data = $request->all();
        if (empty($data['psychiatristName'])) Response::error('psychiatristName is required.', 422);
        if (empty($data['hospitalId']))       Response::error('hospitalId is required.', 422);

        $hospital = $this->hospitalModel->findById((int) $data['hospitalId']);
        if (!$hospital) Response::error('Hospital not found.', 404);

        $id = $this->psychiatristModel->create([
            'hospitalId'       => (int) $data['hospitalId'],
            'psychiatristName' => $data['psychiatristName'],
        ]);

        Response::json(['psychiatristId' => $id], 201);
    }
}
