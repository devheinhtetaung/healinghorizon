<?php

declare(strict_types=1);

// === Bootstrap ===
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/Config/env.php';

\loadEnv(__DIR__ . '/.env');

// === Error reporting (enable in development) ===
error_reporting(E_ALL);
ini_set('display_errors', '1');

// === CORS ===
$origin = $_ENV['FRONTEND_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// === Router setup ===
use Api\Core\Router;
use Api\Core\Request;
use Api\Core\AuthMiddleware;
use Api\Core\RoleMiddleware;
use Api\Controllers\AuthController;
use Api\Controllers\UserController;
use Api\Controllers\ConsultantController;
use Api\Controllers\AppointmentController;
use Api\Controllers\AvailabilityController;
use Api\Controllers\VideoController;
use Api\Controllers\SessionSummaryController;
use Api\Controllers\ForumController;
use Api\Controllers\FeedbackController;
use Api\Controllers\DonationController;
use Api\Controllers\ReferralController;
use Api\Controllers\ProgressController;
use Api\Controllers\SurveyController;
use Api\Controllers\NotificationController;
use Api\Controllers\AdminUserController;
use Api\Controllers\AdminConsultantController;
use Api\Controllers\AdminFeedbackController;
use Api\Controllers\AdminDirectoryController;
use Api\Controllers\AdminMetricsController;
use Api\Controllers\AdminReportController;
use Api\Controllers\ChatController;
use Api\Controllers\AvatarController;

$router     = new Router();
$request    = new Request();
$auth       = new AuthMiddleware();
$authCtl    = new AuthController();
$userCtl    = new UserController();
$consCtl    = new ConsultantController();
$apptCtl    = new AppointmentController();
$availCtl   = new AvailabilityController();
$videoCtl   = new VideoController();
$summaryCtl = new SessionSummaryController();
$forumCtl   = new ForumController();
$feedCtl    = new FeedbackController();
$donatCtl   = new DonationController();
$refCtl     = new ReferralController();
$progCtl    = new ProgressController();
$surveyCtl  = new SurveyController();
$notifCtl   = new NotificationController();
$adUserCtl  = new AdminUserController();
$adConsCtl  = new AdminConsultantController();
$adFeedCtl  = new AdminFeedbackController();
$adDirCtl   = new AdminDirectoryController();
$adMetricsCtl = new AdminMetricsController();
$adReportCtl  = new AdminReportController();
$chatCtl    = new ChatController();
$avatarCtl  = new AvatarController();

// ========================
//  Auth routes (public)
// ========================
$router->add('POST', '/api/auth/register', [$authCtl, 'register']);
$router->add('POST', '/api/auth/login',    [$authCtl, 'login']);
$router->add('POST', '/api/auth/refresh',  [$authCtl, 'refresh']);

$router->add('POST', '/api/auth/logout', function (Request $req) use ($auth, $authCtl) {
    $auth->authenticate($req);
    $authCtl->logout($req);
});

// ========================
//  User routes (any authenticated role)
// ========================
$router->add('GET', '/api/users/me', function (Request $req) use ($auth, $userCtl) {
    $auth->authenticate($req);
    $userCtl->me($req);
});
$router->add('PUT', '/api/users/me', function (Request $req) use ($auth, $userCtl) {
    $auth->authenticate($req);
    $userCtl->update($req);
});
$router->add('PUT', '/api/users/me/password', function (Request $req) use ($auth, $userCtl) {
    $auth->authenticate($req);
    $userCtl->changePassword($req);
});

// Profile avatar (any authenticated role — the column lives on the shared
// `Users` table, so one endpoint covers patient/consultant/admin).
$router->add('POST', '/api/users/me/avatar', function (Request $req) use ($auth, $avatarCtl) {
    $auth->authenticate($req);
    $avatarCtl->upload($req);
});
$router->add('DELETE', '/api/users/me/avatar', function (Request $req) use ($auth, $avatarCtl) {
    $auth->authenticate($req);
    $avatarCtl->remove($req);
});

// Public static serving of uploaded avatars (no auth — <img> tags cannot send
// an Authorization header). Registered before the catch-all fallthrough.
$router->add('GET', '/api/uploads/avatars/:filename', [$avatarCtl, 'serve']);

// ========================
//  Consultant routes (public)
// ========================
$router->add('GET', '/api/consultants', [$consCtl, 'index']);
$router->add('GET', '/api/consultants/:id', [$consCtl, 'show']);
$router->add('GET', '/api/consultants/:id/feedback', function (Request $req) use ($feedCtl) {
    $feedCtl->forConsultant($req);
});

// Public availability for a given consultant + date (used by patient booking).
// Registered after `/api/consultants/:id` — `:id` matches one segment, so the
// deeper `/consultants/:id/availability` path never collides with it.
$router->add('GET', '/api/consultants/:id/availability', [$availCtl, 'availableSlots']);

// ========================
//  Consultant availability (self-service)
// ========================
$router->add('GET', '/api/consultant/availability', function (Request $req) use ($auth, $availCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['consultant']);
    $availCtl->getMine($req);
});
$router->add('PUT', '/api/consultant/availability/weekly', function (Request $req) use ($auth, $availCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['consultant']);
    $availCtl->saveWeekly($req);
});
$router->add('PUT', '/api/consultant/availability/overrides/:date', function (Request $req) use ($auth, $availCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['consultant']);
    $availCtl->upsertOverride($req);
});
$router->add('DELETE', '/api/consultant/availability/overrides/:date', function (Request $req) use ($auth, $availCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['consultant']);
    $availCtl->deleteOverride($req);
});

// ========================
//  Directory routes (consultant/admin)
// ========================
$router->add('GET', '/api/directory/hospitals', function (Request $req) use ($auth, $adDirCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['consultant', 'admin']);
    $adDirCtl->listHospitals($req);
});
$router->add('GET', '/api/directory/psychiatrists', function (Request $req) use ($auth, $adDirCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['consultant', 'admin']);
    $adDirCtl->listPsychiatrists($req);
});

// ========================
//  Appointment routes
// ========================
$router->add('POST', '/api/appointments', function (Request $req) use ($auth, $apptCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['patient']);
    $apptCtl->create($req);
});
$router->add('GET', '/api/appointments', function (Request $req) use ($auth, $apptCtl) {
    $auth->authenticate($req);
    $apptCtl->index($req);
});
$router->add('GET', '/api/appointments/:id', function (Request $req) use ($auth, $apptCtl) {
    $auth->authenticate($req);
    $apptCtl->show($req);
});
$router->add('PATCH', '/api/appointments/:id/status', function (Request $req) use ($auth, $apptCtl) {
    $auth->authenticate($req);
    $apptCtl->updateStatus($req);
});

// ========================
//  Session summary routes
// ========================
// These literal `summary` segments come after `GET /api/appointments/:id` in
// registration order. They do not collide with it because `:id` matches a
// single non-slash segment, so a URI like `/api/appointments/5/summary` never
// matches the bare `:id` pattern (which requires the path to end at the id).
$router->add('GET', '/api/appointments/:id/summary', function (Request $req) use ($auth, $summaryCtl) {
    $auth->authenticate($req);
    $summaryCtl->show($req);
});
$router->add('PUT', '/api/appointments/:id/summary', function (Request $req) use ($auth, $summaryCtl) {
    $auth->authenticate($req);
    $summaryCtl->upsert($req);
});

// ========================
//  Video routes
// ========================
$router->add('POST', '/api/appointments/:id/video', function (Request $req) use ($auth, $videoCtl) {
    $auth->authenticate($req);
    $videoCtl->createVideo($req);
});
$router->add('POST', '/api/appointments/:id/leave', function (Request $req) use ($auth, $videoCtl) {
    $auth->authenticate($req);
    $videoCtl->recordLeave($req);
});
$router->add('GET', '/api/video/:roomName', function (Request $req) use ($auth, $videoCtl) {
    $auth->authenticate($req);
    $videoCtl->getVideo($req);
});

// ========================
//  Forum routes (any authenticated role)
// ========================
$router->add('GET', '/api/forum/posts', function (Request $req) use ($auth, $forumCtl) {
    $auth->authenticate($req);
    $forumCtl->index($req);
});
$router->add('GET', '/api/forum/posts/:id', function (Request $req) use ($auth, $forumCtl) {
    $auth->authenticate($req);
    $forumCtl->show($req);
});
$router->add('POST', '/api/forum/posts', function (Request $req) use ($auth, $forumCtl) {
    $auth->authenticate($req);
    $forumCtl->create($req);
});
$router->add('POST', '/api/forum/posts/:id/upvote', function (Request $req) use ($auth, $forumCtl) {
    $auth->authenticate($req);
    $forumCtl->upvote($req);
});
$router->add('POST', '/api/forum/posts/:id/report', function (Request $req) use ($auth, $forumCtl) {
    $auth->authenticate($req);
    $forumCtl->report($req);
});
$router->add('GET', '/api/forum/posts/:id/comments', function (Request $req) use ($auth, $forumCtl) {
    $auth->authenticate($req);
    $forumCtl->listComments($req);
});
$router->add('POST', '/api/forum/posts/:id/comments', function (Request $req) use ($auth, $forumCtl) {
    $auth->authenticate($req);
    $forumCtl->addComment($req);
});

// ========================
//  Chat routes (patient only)
// ========================
$router->add('POST', '/api/chat/send', function (Request $req) use ($auth, $chatCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['patient']);
    $chatCtl->send($req);
});

$router->add('GET', '/api/chat/conversations', function (Request $req) use ($auth, $chatCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['patient']);
    $chatCtl->listConversations($req);
});

$router->add('GET', '/api/chat/conversations/:id', function (Request $req) use ($auth, $chatCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['patient']);
    $chatCtl->getMessages($req);
});

$router->add('PATCH', '/api/chat/conversations/:id', function (Request $req) use ($auth, $chatCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['patient']);
    $chatCtl->updateTitle($req);
});

// ========================
//  Feedback routes
// ========================
$router->add('POST', '/api/feedback', function (Request $req) use ($auth, $feedCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['patient']);
    $feedCtl->create($req);
});

// ========================
//  Donation routes
// ========================
$router->add('POST', '/api/donations', [$donatCtl, 'create']); // public, no auth guard

$router->add('GET', '/api/donations', function (Request $req) use ($auth, $donatCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $donatCtl->index($req);
});

// ========================
//  Referral routes
// ========================
$router->add('POST', '/api/referrals', function (Request $req) use ($auth, $refCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['consultant']);
    $refCtl->create($req);
});
$router->add('GET', '/api/referrals', function (Request $req) use ($auth, $refCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['consultant']);
    $refCtl->index($req);
});

// ========================
//  Progress log routes
// ========================
$router->add('GET', '/api/patients/me/progress/latest', function (Request $req) use ($auth, $progCtl) {
    $auth->authenticate($req);
    $progCtl->latestForPatient($req);
});

$router->add('GET', '/api/patients/:id/progress', function (Request $req) use ($auth, $progCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['consultant']);
    $progCtl->index($req);
});
$router->add('POST', '/api/patients/:id/progress', function (Request $req) use ($auth, $progCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['consultant']);
    $progCtl->create($req);
});

// ========================
//  Notification routes
// ========================
$router->add('GET', '/api/notifications', function (Request $req) use ($auth, $notifCtl) {
    $auth->authenticate($req);
    $notifCtl->index($req);
});
$router->add('PATCH', '/api/notifications/:id/read', function (Request $req) use ($auth, $notifCtl) {
    $auth->authenticate($req);
    $notifCtl->markRead($req);
});

// ========================
//  Survey routes (patient)
// ========================
$router->add('POST', '/api/patient/surveys/:id/responses', function (Request $req) use ($auth, $surveyCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['patient']);
    $surveyCtl->submit($req);
});

// ========================
//  Admin routes
// ========================

// Admin — Users
$router->add('GET', '/api/admin/users', function (Request $req) use ($auth, $adUserCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adUserCtl->index($req);
});
$router->add('PATCH', '/api/admin/users/:id/ban', function (Request $req) use ($auth, $adUserCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adUserCtl->ban($req);
});
$router->add('PATCH', '/api/admin/users/:id/unban', function (Request $req) use ($auth, $adUserCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adUserCtl->unban($req);
});

// Admin — Consultants
$router->add('GET', '/api/admin/consultants', function (Request $req) use ($auth, $adConsCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adConsCtl->index($req);
});
$router->add('POST', '/api/admin/consultants', function (Request $req) use ($auth, $adConsCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adConsCtl->create($req);
});
$router->add('PATCH', '/api/admin/consultants/:id/verify', function (Request $req) use ($auth, $adConsCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adConsCtl->verify($req);
});
$router->add('DELETE', '/api/admin/consultants/:id', function (Request $req) use ($auth, $adConsCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adConsCtl->remove($req);
});

// Admin — Feedback
$router->add('GET', '/api/admin/feedback', function (Request $req) use ($auth, $adFeedCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adFeedCtl->index($req);
});
$router->add('DELETE', '/api/admin/feedback/:id', function (Request $req) use ($auth, $adFeedCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adFeedCtl->remove($req);
});

// Admin — Post Reports (moderation queue)
$router->add('GET', '/api/admin/reports', function (Request $req) use ($auth, $adReportCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adReportCtl->index($req);
});
$router->add('PATCH', '/api/admin/reports/:id/status', function (Request $req) use ($auth, $adReportCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adReportCtl->updateStatus($req);
});

// Admin — Surveys
$router->add('GET', '/api/admin/surveys', function (Request $req) use ($auth, $surveyCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $surveyCtl->index($req);
});
$router->add('POST', '/api/admin/surveys', function (Request $req) use ($auth, $surveyCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $surveyCtl->create($req);
});
$router->add('GET', '/api/admin/surveys/:id/responses', function (Request $req) use ($auth, $surveyCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $surveyCtl->responses($req);
});

// Admin — Directory
$router->add('POST', '/api/admin/directory/hospitals', function (Request $req) use ($auth, $adDirCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adDirCtl->createHospital($req);
});
$router->add('POST', '/api/admin/directory/psychiatrists', function (Request $req) use ($auth, $adDirCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adDirCtl->createPsychiatrist($req);
});

// Admin — Dashboard metrics
$router->add('GET', '/api/admin/metrics/user-growth', function (Request $req) use ($auth, $adMetricsCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adMetricsCtl->userGrowth($req);
});
$router->add('GET', '/api/admin/metrics/session-volume', function (Request $req) use ($auth, $adMetricsCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adMetricsCtl->sessionVolume($req);
});
$router->add('GET', '/api/admin/metrics/consultant-ratings', function (Request $req) use ($auth, $adMetricsCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adMetricsCtl->consultantRatings($req);
});
$router->add('GET', '/api/admin/metrics/donation-revenue', function (Request $req) use ($auth, $adMetricsCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adMetricsCtl->donationRevenue($req);
});
$router->add('GET', '/api/admin/metrics/moderation', function (Request $req) use ($auth, $adMetricsCtl) {
    $auth->authenticate($req);
    RoleMiddleware::guard($req, ['admin']);
    $adMetricsCtl->moderation($req);
});

// === Dispatch ===
try {
    $router->dispatch($request);
} catch (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'data'    => null,
        'error'   => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
