<?php

declare(strict_types=1);

namespace Api\Controllers;

use Api\Core\Request;
use Api\Core\Response;
use Api\Models\CommunityPost;
use Api\Models\CommentModel;
use Api\Models\NotificationModel;
use Api\Models\PostReport;
use Api\Models\PostUpvote;

class ForumController
{
    private CommunityPost $postModel;
    private CommentModel $commentModel;
    private PostUpvote $upvoteModel;
    private PostReport $reportModel;
    private NotificationModel $notifModel;

    public function __construct(
        ?CommunityPost $postModel = null,
        ?CommentModel $commentModel = null,
        ?PostUpvote $upvoteModel = null,
        ?PostReport $reportModel = null,
        ?NotificationModel $notifModel = null
    ) {
        $this->postModel    = $postModel ?? new CommunityPost();
        $this->commentModel = $commentModel ?? new CommentModel();
        $this->upvoteModel  = $upvoteModel ?? new PostUpvote();
        $this->reportModel  = $reportModel ?? new PostReport();
        $this->notifModel   = $notifModel ?? new NotificationModel();
    }

    public function index(Request $request): void
    {
        $sort   = $request->query('sort', 'recent');
        $page   = max(1, (int) ($request->query('page', 1)));
        $limit  = 20;
        $offset = ($page - 1) * $limit;

        if (!in_array($sort, ['recent', 'popular'], true)) {
            $sort = 'recent';
        }

        $posts = $this->postModel->findAll($limit, $offset, $sort);

        $userId     = (int) ($request->user['userId'] ?? 0);
        $upvotedIds = $userId ? array_flip($this->upvoteModel->findUpvotedPostIdsByUser($userId)) : [];
        $reportedIds = $userId ? array_flip($this->reportModel->findReportedPostIdsByUser($userId)) : [];

        // Typecast numeric fields + the current user's own upvote/report state
        $posts = array_map(function ($p) use ($upvotedIds, $reportedIds) {
            $p['postId']        = (int) $p['postId'];
            $p['upVoteCount']   = (int) $p['upVoteCount'];
            $p['viewCount']     = (int) $p['viewCount'];
            $p['shareCount']    = (int) $p['shareCount'];
            $p['commentCount']  = (int) $p['commentCount'];
            $p['anonymousPost'] = (bool) $p['anonymousPost'];
            $p['upvoted']       = isset($upvotedIds[$p['postId']]);
            $p['reported']      = isset($reportedIds[$p['postId']]);
            return $p;
        }, $posts);

        Response::json([
            'posts' => $posts,
            'page'  => $page,
        ]);
    }

    public function show(Request $request): void
    {
        $postId = (int) $request->param('id');
        $post   = $this->postModel->findById($postId);

        if (!$post) {
            Response::error('Post not found.', 404);
        }

        $this->postModel->incrementViewCount($postId);

        $post['postId']        = (int) $post['postId'];
        $post['upVoteCount']   = (int) $post['upVoteCount'];
        $post['viewCount']     = (int) $post['viewCount'] + 1;
        $post['shareCount']    = (int) $post['shareCount'];
        $post['commentCount']  = (int) $post['commentCount'];
        $post['anonymousPost'] = (bool) $post['anonymousPost'];
        $post['upvoted']       = $this->upvoteModel->hasUpvoted(
            (int) ($request->user['userId'] ?? 0),
            $postId
        );
        $post['reported']      = $this->reportModel->hasReported(
            (int) ($request->user['userId'] ?? 0),
            $postId
        );

        Response::json($post);
    }

    public function create(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $data   = $request->all();

        if (empty($data['postTitle'])) Response::error('postTitle is required.', 422);
        if (empty($data['content']))   Response::error('content is required.', 422);

        $postId = $this->postModel->create([
            'userId'        => $userId,
            'postTitle'     => $data['postTitle'],
            'content'       => $data['content'],
            'anonymousPost' => !empty($data['anonymousPost']),
        ]);

        $post = $this->postModel->findById($postId);
        Response::json($post, 201);
    }

    public function upvote(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $postId = (int) $request->param('id');
        $post = $this->postModel->findById($postId);

        if (!$post) {
            Response::error('Post not found.', 404);
        }

        $upvoted = $this->upvoteModel->toggle($userId, $postId);

        $updated = $this->postModel->findById($postId);
        Response::json([
            'postId'      => (int) $updated['postId'],
            'upVoteCount' => (int) $updated['upVoteCount'],
            'upvoted'     => $upvoted,
        ]);
    }

    public function report(Request $request): void
    {
        $userId = (int) ($request->user['userId'] ?? 0);
        $postId = (int) $request->param('id');
        $reason = (string) $request->input('reason', '');

        $post = $this->postModel->findById($postId);
        if (!$post) {
            Response::error('Post not found.', 404);
        }

        if (!in_array($reason, PostReport::REASONS, true)) {
            Response::error('A valid report reason is required.', 422);
        }

        if ($this->reportModel->hasReported($userId, $postId)) {
            Response::error('You have already reported this post.', 409);
        }

        try {
            $reportId = $this->reportModel->create([
                'postId'     => $postId,
                'reporterId' => $userId,
                'reason'     => $reason,
                'status'     => 'open',
            ]);
        } catch (\PDOException $e) {
            // Unique-constraint race: another request reported the same pair
            // first. Treat as already-reported rather than failing.
            if ($e->getCode() === '23000') {
                Response::error('You have already reported this post.', 409);
            }
            throw $e;
        }

        // Notify admins so the report surfaces in the moderation queue.
        $label = PostReport::REASON_LABELS[$reason] ?? $reason;
        $this->notifModel->notifyAdmins(sprintf(
            'A post was reported: %s. Review it in the moderation queue.',
            $label
        ));

        Response::json([
            'postReportId' => $reportId,
            'postId'       => $postId,
            'status'       => 'open',
        ], 201);
    }

    public function listComments(Request $request): void
    {
        $postId = (int) $request->param('id');
        $post = $this->postModel->findById($postId);

        if (!$post) {
            Response::error('Post not found.', 404);
        }

        $comments = $this->commentModel->findByPost($postId);

        $comments = array_map(function ($c) {
            $c['commentId'] = (int) $c['commentId'];
            $c['postId']    = (int) $c['postId'];
            return $c;
        }, $comments);

        Response::json($comments);
    }

    public function addComment(Request $request): void
    {
        $postId  = (int) $request->param('id');
        $userId  = (int) ($request->user['userId'] ?? 0);
        $comment = $request->input('comment');

        $post = $this->postModel->findById($postId);
        if (!$post) {
            Response::error('Post not found.', 404);
        }

        if (empty(trim((string) ($comment ?? '')))) {
            Response::error('comment is required.', 422);
        }

        $commentId = $this->commentModel->create([
            'postId'    => $postId,
            'commentBy' => $userId,
            'comment'   => $comment,
        ]);

        $this->postModel->incrementComments($postId);

        Response::json(['commentId' => $commentId], 201);
    }
}
