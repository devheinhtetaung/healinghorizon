# Healing Horizon

A full-stack mental health platform designed for university students. Patients connect with licensed consultants, chat with an AI wellness companion ("Aura"), join a peer community, book secure video sessions, and donate — all from one accessible application. Consultants manage appointments, track patient progress, write session summaries, and make referrals. Administrators manage users, consultants, hospitals, surveys, feedback, and platform-wide content.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite, plain CSS (design tokens via custom properties), `lucide-react` icons |
| Routing | `react-router-dom` v7 |
| AI Chat | Floating "Aura" widget + full-page fallback, server-side LLM integration |
| Video | `@jitsi/react-sdk` with **8x8 JaaS** (JWT-signed rooms on `8x8.vc`) |
| Backend | PHP 8.0+, pure JSON REST API, custom Router + PDO models |
| Auth | `firebase/php-jwt` — access + refresh token pair |
| Database | MySQL 8.0.16+ (utf8mb4), `schema.sql` + `seed.sql` |
| LLM | OpenAI-compatible chat API (configurable — falls back to canned replies if unset) |

## Architecture

```
┌──────────────┐     HTTP/REST      ┌───────────────┐     PDO      ┌─────────┐
│  frontend/   │ ◄──────────────► │    api/       │ ◄─────────► │  MySQL  │
│  (React SPA) │   JSON + JWT     │  (PHP API)    │             │         │
└──────────────┘                   └───────────────┘             └─────────┘
```

- **`frontend/`** — React single-page application. Pages are grouped by role (public, patient, consultant, admin) and wrapped by layout shells (`PublicLayout`, `PatientLayout`, etc.). Styling uses CSS custom properties from `tokens.css`.
- **`api/`** — PHP REST API with a lightweight custom Router, PSR-4 autoloading, JWT authentication, and role-based middleware. Every request returns consistent `{ success, data, error }` JSON.
- **`database/`** — MySQL schema (**28 tables**) + seed data (test accounts, appointments, consultants, hospitals, etc.).
- **`public/`** — Vite production build output (served alongside the API).

## Features by Role

### Public (no login required)
- Landing page with consultant teasers and community previews
- Login / Register (client-side validation + server-side JWT auth)
- Donate (public, no auth required — guest or named)
- About, Careers, Contact, Privacy Policy, Terms of Service
- Help Center / FAQ (accordion-style)

### Patient
- **Dashboard** — welcome header, upcoming appointment, live progress snapshot (Anxiety/Depression/Overthinking/Overall from the consultant's recorded logs), notification bell
- **AI Companion ("Aura")** — persistent floating chat widget (FAB + popup) on every patient page, plus a full-page fallback at `/patient/chatbot`; conversation history, auto-growing composer, reply sound
- **Book Appointments** — search/filter consultants, pick date/time, confirm booking (consultant is notified)
- **Video Sessions** — pre-call lobby with mic/camera toggles, JaaS video rooms, automatic session completion when both parties leave
- **Community Forum** — create posts (optionally anonymous), per-user upvote toggle, comment threads
- **Feedback** — rate completed appointments (1–5 stars + comment)
- **Profile / Settings** — edit personal details, change password, upload a profile photo

### Consultant
- **Dashboard** — date-grouped appointments (Today / Next 7 Days / All scope toggle), accept/decline pending requests with a required reason, stats
- **Patient Progress** — view and log anxiety/depression/overthinking/overall scores with clinical notes
- **Session Summaries** — write a post-session summary per appointment (one per appointment, editable)
- **Referrals** — searchable directory of hospitals/psychiatrists with a per-card "Refer" action
- **Availability** — recurring weekly hours + date overrides
- **Profile / Settings** — edit biography, change password, upload a profile photo, view rating/verification status

### Admin
- **Dashboard** — platform-wide stats and recent activity
- **User Management** — searchable table, ban/unban with reason
- **Consultant Management** — add (with temp password), verify, remove
- **Feedback Management** — filterable table, remove inappropriate entries
- **Survey Management** — create surveys with dynamic questions, view aggregated responses
- **Directory** — manage hospitals and psychiatrists

## Cross-cutting Features

- **Notifications** — an in-app bell surfaces events: patient books → consultant; consultant confirms/cancels → patient. Read/unread badge, mark-as-read.
- **Automatic appointment completion** — when both the patient and consultant leave a call (or the scheduled end + grace period passes with at least one leave), the appointment transitions to `completed`, feeding stats, feedback, and "Completed Sessions" counts.
- **Profile photo uploads** — all three roles can upload a JPG/PNG/WebP avatar (5 MB max) with server-side type/size validation; photos are stored server-side and served back over `GET /api/uploads/avatars/{filename}`.
- **JaaS video authentication** — every participant receives a short-lived, per-appointment JWT signed with the JaaS RSA key; the consultant is the moderator.
- **Community upvoting** — per-user, per-post upvote tracking so a second click un-votes (toggle, not repeat-increment).

## Screenshots

> Place screenshot files in a `screenshots/` folder at the repo root before final submission. Suggested captures:
> - Landing page (Hero + feature cards)
> - Login page with validation error
> - Patient Dashboard with appointments and progress bars
> - "Aura" AI chat widget (open)
> - Book Appointment page with consultant grid
> - Community Forum feed + comment thread
> - Consultant Dashboard with date-grouped appointments
> - Admin User Management table

## Known Limitations

- **No real payment gateway** — donations are recorded as completed immediately; `POST /api/donations` is a mock endpoint for a university project.
- **JaaS credentials required** — video calls need a valid 8x8 JaaS App ID, Key ID, and the RSA private key file referenced by `JAAS_PRIVATE_KEY_PATH`. The private key must **never** be committed.
- **Token storage** — refresh tokens are stored in `localStorage`. An httpOnly cookie would be more secure but requires same-site backend configuration not assumed for a university submission.
- **LLM optional** — the AI companion uses a configurable OpenAI-compatible endpoint (`LLM_API_*`); with no key configured it returns canned responses.
- **Contact page** — `/api/contact` does not exist; the contact form shows a client-side success toast without a real backend endpoint.
- **Rate limiting** — public endpoints (donation, authentication) have no rate limiting in this build.

## Related Documents

- UML diagrams and the formal project proposal are in the companion submission document. This README focuses on the technical implementation and setup instructions.
- Detailed setup steps (database, backend, frontend, production build, test accounts): see [`SETUP.md`](SETUP.md).
