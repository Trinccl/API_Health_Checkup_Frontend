import { ref, computed } from "vue";

export const BASE_URL = "http://localhost:3000";
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
    },
  });
}

export function updateApi(id, current, changes = {}) {
  return request(`/checker/apis/${id}`, {
    method: "PATCH",
    body: {
      name: current.name,
      url: current.url,
      slowThresholdMs:
        Number(changes.slowThresholdMs) || current.slowThresholdMs,
      errorsToAlert: Number(changes.errorsToAlert) || current.errorsToAlert,
      requestMethod: current.requestMethod,
      intervalMinutes:
        Number(changes.intervalMinutes) || current.intervalMinutes,
      alertOnDown: changes.alertOnDown ?? current.alertOnDown,
      alertOnSlow: changes.alertOnSlow ?? current.alertOnSlow,
      requestBody: changes.requestBody ?? current.requestBody,
      expectedBody: changes.expectedBody ?? current.expectedBody,
    },
  });
}

export function deleteApi(id) {
  return request(`/checker/apis/${id}`, { method: "DELETE" });
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
