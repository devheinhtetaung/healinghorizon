const BASE_URL = import.meta.env.PROD ? 'http://localhost:8000/api' : '/api';

const TOKEN_KEY = 'healing_horizon_access_token';
const REFRESH_KEY = 'healing_horizon_refresh_token';

let refreshTokenFn = null;

function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setAccessToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function setTokens(access, refresh) {
  setAccessToken(access);
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

export function clearTokens() {
  setAccessToken(null);
  localStorage.removeItem(REFRESH_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshHandler(fn) {
  refreshTokenFn = fn;
}

async function attemptRefresh() {
  const refresh = getRefreshToken();
  if (!refresh || !refreshTokenFn) return null;
  try {
    const newAccess = await refreshTokenFn(refresh);
    setAccessToken(newAccess);
    return newAccess;
  } catch {
    clearTokens();
    return null;
  }
}

function networkError() {
  const err = new Error('Network error — unable to reach the server.');
  err.status = 0;
  return err;
}

// Build an Error whose `.message` is the backend's actual error string
// (Response::error(...) puts it in `data.error`) and `.status` the HTTP code.
function backendError(data, status) {
  const error = data?.error;
  let message = `Request failed (${status})`;

  if (typeof error === 'string' && error.trim() !== '') {
    message = error;
  } else if (error && typeof error === 'object') {
    const parts = Object.values(error).filter((m) => typeof m === 'string');
    message = parts.length ? parts.join(' ') : JSON.stringify(error);
  }

  const err = new Error(message);
  err.status = status;
  err.data = data;
  return err;
}

async function request(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw networkError();
  }

  if (res.status === 401 && token) {
    const newToken = await attemptRefresh();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      try {
        res = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch {
        throw networkError();
      }
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw backendError(data, res.status);
  }

  return data.data;
}

export const apiClient = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
  upload: (path, file) => uploadFile(path, file),
  beacon: (path) => fireBeacon(path),
};

// Fire-and-forget POST that survives page unload (keepalive) — used for the
// leave signal on tab close / browser exit, where the response can't be read.
function fireBeacon(path) {
  const url = `${BASE_URL}${path}`;
  const token = getAccessToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    fetch(url, { method: 'POST', headers, keepalive: true }).catch(() => {});
  } catch {
    // Best-effort only — the server-side fallback covers a lost signal.
  }
}

// Multipart upload (FormData). The browser sets the Content-Type boundary, so
// we must not set it manually. Mirrors request()'s auth + refresh handling.
async function uploadFile(path, file) {
  const url = `${BASE_URL}${path}`;
  const token = getAccessToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const form = new FormData();
  form.append('avatar', file);

  let res;
  try {
    res = await fetch(url, { method: 'POST', headers, body: form });
  } catch {
    throw networkError();
  }

  if (res.status === 401 && token) {
    const newToken = await attemptRefresh();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      try {
        res = await fetch(url, { method: 'POST', headers, body: form });
      } catch {
        throw networkError();
      }
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw backendError(data, res.status);
  }

  return data.data;
}
