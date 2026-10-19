/*
 * Time-bucketing for the video-session "too early" lobby state (Round G10/H2).
 *
 * All display logic derives from a single reliable appointment timestamp.
 * The backend delivers `startsAt` as an ISO 8601 UTC string (computed in the
 * platform booking timezone); the frontend never re-derives an instant from
 * naive `appointmentDate` + `appointmentTime` strings unless `startsAt` is
 * absent (legacy payload fallback). Bucketing is intentionally client-side so
 * server/client clock skew can never disagree with what is rendered — the
 * server's own join-window authorization (VideoController::checkJoinWindow)
 * remains the authoritative access control and is untouched by this module.
 */

export const LOBBY_LEAD_MS = 10 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Resolve a reliable epoch-ms timestamp for the appointment's scheduled start.
 *
 * Prefers `startsAt` (ISO 8601 with timezone, computed server-side); falls back
 * to parsing `appointmentDate` + `appointmentTime` as a naive local string for
 * older payloads. Returns null when no usable instant can be derived.
 */
export function resolveAppointmentStart(sessionInfo) {
  if (!sessionInfo) return null;

  if (sessionInfo.startsAt) {
    const ms = Date.parse(sessionInfo.startsAt);
    return Number.isNaN(ms) ? null : ms;
  }

  const dateStr = sessionInfo.appointmentDate;
  if (!dateStr) return null;
  const timeStr = sessionInfo.appointmentTime || '12:00 PM';
  const ms = Date.parse(`${dateStr} ${timeStr}`);
  return Number.isNaN(ms) ? null : ms;
}

function formatTimeOfDay(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isSameCalendarDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/**
 * Derive the early/expired join states for an appointment (display mirror of
 * the server-side window, NOT the authorization — the server still enforces
 * EARLY_JOIN_MINUTES = 10 and SESSION_DURATION_MINUTES = 60).
 */
export function getAppointmentTimeStatus(sessionInfo, now = Date.now()) {
  const EARLY_JOIN_MINUTES = 10;
  const SESSION_DURATION_MINUTES = 60;

  const apptTime = resolveAppointmentStart(sessionInfo);
  if (apptTime === null) {
    return { isEarly: false, isExpired: false, apptTime: null, startTimeFormatted: '' };
  }

  const diffMs = apptTime - now;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  const isEarly = diffMinutes > EARLY_JOIN_MINUTES;
  const isExpired = diffMinutes < -SESSION_DURATION_MINUTES;

  const startTimeFormatted = formatTimeOfDay(apptTime);

  return { isEarly, isExpired, apptTime, startTimeFormatted };
}

/**
 * Produce the display bucket + copy for the "too early" state.
 *
 * Buckets:
 *   far   — more than 24h until the lobby opens: absolute date + time only.
 *   soon  — within 24h: relative phrasing ("tomorrow at 10:30 AM",
 *           "in about 5 hours").
 *   lobby — within the last hour before the lobby opens: live mm:ss
 *           countdown ("Lobby opens in 12:45").
 */
export function describeWait(apptTime, now) {
  const lobbyOpensAt = apptTime - LOBBY_LEAD_MS;
  const msToLobby = lobbyOpensAt - now;

  if (msToLobby > DAY_MS) {
    return {
      bucket: 'far',
      live: false,
      title: 'Your Session Is Scheduled',
      box: `Your session is on ${new Date(apptTime).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} at ${formatTimeOfDay(apptTime)}`,
      subtext:
        'The video lobby opens 10 minutes before your start time. You can safely leave this page and return then.',
    };
  }

  if (msToLobby > HOUR_MS) {
    const tomorrow = new Date(now + DAY_MS);
    const base = {
      bucket: 'soon',
      live: false,
      title: 'Session Starts Soon',
      subtext: 'The video lobby will activate 10 minutes prior to your start time.',
    };
    if (isSameCalendarDay(apptTime, tomorrow)) {
      return { ...base, box: `Starts tomorrow at ${formatTimeOfDay(apptTime)}` };
    }
    const hours = Math.max(1, Math.round((apptTime - now) / HOUR_MS));
    return {
      ...base,
      box: hours === 1 ? 'Starts in about an hour' : `Starts in about ${hours} hours`,
    };
  }

  const secondsLeft = Math.max(0, Math.ceil(msToLobby / 1000));
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  return {
    bucket: 'lobby',
    live: true,
    title: 'Session Starts Soon',
    box: secondsLeft === 0 ? 'Lobby is opening now' : `Lobby opens in ${mm}:${ss}`,
    subtext:
      'This page will switch to the lobby automatically when the timer reaches zero — no need to refresh.',
  };
}
