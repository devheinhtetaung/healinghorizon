<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\Consultant;

class ConsultantController
{
    private Consultant $consultantModel;

    public function __construct()
    {
        $this->consultantModel = new Consultant();
    }

    public function index(Request $request): void
    {
        $search = $request->query('search', '');
        $consultants = $this->consultantModel->findAllVerified($search);

        // Never expose internal userIds or email in public listing
        $result = array_map(function ($c) {
            return [
                'consultantId'  => (int) $c['consultantId'],
                'name'          => $c['name'],
                'biography'     => $c['biography'],
                'rating'        => (float) $c['rating'],
                'isVerified'    => (bool) $c['isVerified'],
                'avatarUrl'     => $c['avatarUrl'] ?? null,
            ];
        }, $consultants);

        Response::json($result);
    }

    public function show(Request $request): void
    {
        $id = (int) $request->param('id');
        $consultant = $this->consultantModel->findById($id);

        if (!$consultant) {
            Response::error('Consultant not found.', 404);
        }

        unset($consultant['email']);

        $consultant['consultantId'] = (int) $consultant['consultantId'];
        $consultant['rating']       = (float) $consultant['rating'];
        $consultant['isVerified']   = (bool) $consultant['isVerified'];

        Response::json($consultant);
    }
}
