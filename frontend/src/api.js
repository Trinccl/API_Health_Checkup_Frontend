import { ref, computed } from "vue";

export const BASE_URL = "https://apihub.kapitanat.pl/backend";
const TOKEN_KEY = "JWT";

const jwt = ref(localStorage.getItem(TOKEN_KEY));

export const isLoggedIn = computed(() => !!jwt.value);

export function getToken() {
  return jwt.value;
}

export function setToken(newToken) {
  jwt.value = newToken;
  localStorage.setItem(TOKEN_KEY, newToken);
}

export function logout() {
  jwt.value = null;
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    const msg = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message;
    const error = new Error(
      msg || response.statusText || `Request failed (${response.status})`,
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function login(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  setToken(data.accessToken);
  return data;
}

export function register(name, email, password) {
  return request("/auth/signup", {
    method: "POST",
    auth: false,
    body: { name, email, password },
  });
}

export function deleteMe() {
  request("/auth/me", {
    method: "DELETE",
    auth: true,
  });
  logout();
}

export function verifyEmail(token) {
  return request("/auth/verify-email", {
    method: "POST",
    auth: false,
    body: { token },
  });
}

export function resendVerification(email) {
  return request("/auth/resend-verification", {
    method: "POST",
    auth: false,
    body: { email },
  });
}

export async function checkToken() {
  if (!getToken()) return false;
  await request("/auth/checkToken", { method: "POST" });
  return true;
}

export function getApis() {
  return request("/checker/apis");
}

export function getApi(id) {
  return request(`/checker/apis/${id}`);
}

export function createApi(form) {
  if (!form.alertOnDown && !form.alertOnSlow) {
    return request("/checker/apis", {
      method: "POST",
      body: {
        name: form.name,
        url: String(form.url).replace(/\/+$/, ""),
        slowThresholdMs: Number(form.slowThresholdMs),
        errorsToAlert: null,
        requestMethod: form.requestMethod,
        intervalMinutes: Number(form.intervalMinutes),
        alertOnDown: form.alertOnDown,
        alertOnSlow: form.alertOnSlow,
        requestBody: form.requestBody,
        expectedBody: form.expectedBody,
        requestHeaders: form.requestHeaders,
      },
    });
  }
  return request("/checker/apis", {
    method: "POST",
    body: {
      name: form.name,
      url: String(form.url).replace(/\/+$/, ""),
      slowThresholdMs: Number(form.slowThresholdMs),
      errorsToAlert: Number(form.errorsToAlert),
      requestMethod: form.requestMethod,
      intervalMinutes: Number(form.intervalMinutes),
      alertOnDown: form.alertOnDown,
      alertOnSlow: form.alertOnSlow,
      requestBody: form.requestBody,
      expectedBody: form.expectedBody,
      requestHeaders: form.requestHeaders,
    },
  });
}

export function updateApi(id, changes = {}) {
  if (!changes.alertOnDown && !changes.alertOnSlow) {
    return request(`/checker/apis/${id}`, {
      method: "PATCH",
      body: {
        name: changes.name,
        url: changes.url,
        slowThresholdMs: Number(changes.slowThresholdMs),
        errorsToAlert: null,
        requestMethod: changes.requestMethod,
        intervalMinutes: Number(changes.intervalMinutes),
        alertOnDown: changes.alertOnDown,
        alertOnSlow: changes.alertOnSlow,
        requestBody: changes.requestBody,
        expectedBody: changes.expectedBody,
        requestHeaders: changes.requestHeaders,
      },
    });
  }
  return request(`/checker/apis/${id}`, {
    method: "PATCH",
    body: {
      name: changes.name,
      url: changes.url,
      slowThresholdMs: Number(changes.slowThresholdMs),
      errorsToAlert: Number(changes.errorsToAlert),
      requestMethod: changes.requestMethod,
      intervalMinutes: Number(changes.intervalMinutes),
      alertOnDown: changes.alertOnDown,
      alertOnSlow: changes.alertOnSlow,
      requestBody: changes.requestBody,
      expectedBody: changes.expectedBody,
      requestHeaders: changes.requestHeaders,
    },
  });
}

// ---- Request header helpers -------------------------------------------
// The form edits headers as rows ({ id, name, value }); the backend stores
// them as a plain object ({ "Authorization": "Bearer ..." }).

let headerRowId = 0;

export function newHeaderRow() {
  return { id: ++headerRowId, name: "", value: "" };
}

export function headersToRows(headers) {
  return Object.entries(headers ?? {}).map(([name, value]) => ({
    id: ++headerRowId,
    name,
    value: String(value ?? ""),
  }));
}

const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9a-z-]+$/i;

// Throws a readable Error for bad input; returns null when there are no
// headers (which makes the backend clear them).
export function rowsToHeaders(rows) {
  const headers = {};
  const seen = new Set();

  for (const row of rows ?? []) {
    const name = row.name.trim();
    const value = row.value.trim();

    if (!name && !value) continue; // ignore blank rows

    if (!name) throw new Error("Every header needs a name");
    if (!HEADER_NAME.test(name)) {
      throw new Error(`"${name}" is not a valid header name`);
    }
    if (seen.has(name.toLowerCase())) {
      throw new Error(`Header "${name}" is added more than once`);
    }

    seen.add(name.toLowerCase());
    headers[name] = value;
  }

  return Object.keys(headers).length ? headers : null;
}

export function deleteApi(id) {
  return request(`/checker/apis/${id}`, { method: "DELETE" });
}

export function getApiStats(id) {
  return request(`/checker/apis/${id}/stats`);
}

// Dashboard-level stats across all of the user's APIs.
// Same shape as getApiStats: { stats: [{ status, count }], total }.
export function getDashboardStats() {
  return request("/checker/apis/apiStats");
}

export function pauseApi(id) {
  return request(`/checker/apis/${id}/pause`, { method: "POST" });
}

export function resumeApi(id) {
  return request(`/checker/apis/${id}/resume`, { method: "POST" });
}

export function isApiPaused(api) {
  if (!api) return false;
  if (typeof api.isPaused === "boolean") return api.isPaused;
  if (typeof api.paused === "boolean") return api.paused;
  if (api.enabled === false) return true;
  return String(api.status ?? "").toUpperCase() === "PAUSED";
}

export async function getApiLogs(id) {
  const data = await request(`/checker/apis/${id}/logs`);

  data.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const lastCheckAt =
    Math.max(...data.items.map((i) => new Date(i.createdAt).getTime()), 0) ||
    null;

  for (const item of data.items) {
    item.createdAt = formatDate(item.createdAt);
  }

  return { data, chartData: [...data.items].reverse(), lastCheckAt };
}

// The backend checks a new or resumed API right away, but that request can take
// a few seconds (up to its 5s timeout). Until it finishes the status is UNKNOWN.
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const SETTLE_DELAY_MS = 1000;
export const SETTLE_MAX_ATTEMPTS = 5;

export function isStatusPending(api) {
  return String(api?.status ?? "").toUpperCase() === "UNKNOWN";
}

export function getApiLog(id, logId) {
  return request(`/checker/apis/${id}/logs/${logId}`);
}

// Same as formatDate but with seconds, for the single-log view.
export function formatDateTime(dateString) {
  if (!dateString) return "";

  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
}

export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function createRefreshScheduler({
  refresh,
  getIntervalMinutes,
  getLastCheckAt,
  bufferMs = 3000,
  minDelayMs = 10000,
}) {
  let active = true;
  let timer;

  function schedule() {
    clearTimeout(timer);
    if (!active) return;

    const intervalMs = (getIntervalMinutes() ?? 0) * 60000;
    if (!intervalMs) return;

    const lastCheckAt = getLastCheckAt();
    let delay = intervalMs + bufferMs;
    if (lastCheckAt) {
      delay = lastCheckAt + intervalMs - Date.now() + bufferMs;
    }

    delay = Math.min(Math.max(delay, minDelayMs), intervalMs + bufferMs);
    timer = setTimeout(refresh, delay);
  }

  function stop() {
    active = false;
    clearTimeout(timer);
  }

  return { schedule, stop };
}
