<script setup>
import router from "./router.js";
import { onMounted, onUnmounted, ref, inject, computed } from "vue";
import { useRoute } from "vue-router";
import ApiAreaChart from "@/components/ApiAreaChart.vue";
import ApiStatsDonut from "@/components/ApiStatsDonut.vue";
import {
  checkToken,
  getApi,
  getApiLogs,
  getApiLog,
  formatDateTime,
  deleteApi,
  pauseApi,
  resumeApi,
  isApiPaused,
  isStatusPending,
  sleep,
  SETTLE_DELAY_MS,
  SETTLE_MAX_ATTEMPTS,
  createRefreshScheduler,
} from "./api.js";

const notify = inject("notify");
const route = useRoute();

const isJwt = ref(false);
const isLoading = ref(true);
const ApiData = ref(null);
const LogsData = ref(null);
const chartData = ref(null);
const statsRef = ref(null);

const headerEntries = computed(() =>
  Object.entries(ApiData.value?.requestHeaders ?? {}),
);

const chartConfig = {
  responseTimeMs: {
    label: "Response Time",
    color: "var(--chart-2)",
  },
  slowThresholdMs: {
    label: "Slow API Threshold",
    color: "var(--destructive)",
  },
};

let lastCheckAt = null;

const scheduler = createRefreshScheduler({
  refresh,
  getIntervalMinutes: () => ApiData.value?.intervalMinutes,
  getLastCheckAt: () => lastCheckAt,
});

let settleTimer;
let active = true;

function settle(attempt = 0) {
  clearTimeout(settleTimer);
  if (
    !active ||
    !isStatusPending(ApiData.value) ||
    attempt >= SETTLE_MAX_ATTEMPTS
  ) {
    return;
  }

  settleTimer = setTimeout(async () => {
    await refresh();
    settle(attempt + 1);
  }, SETTLE_DELAY_MS);
}

async function checkif() {
  isLoading.value = true;
  try {
    if (await checkToken()) {
      await refresh();
      settle();
    }
  } catch {
    isJwt.value = false;
  } finally {
    isLoading.value = false;
  }
}

async function loadApi() {
  try {
    const data = await getApi(route.params.id);
    ApiData.value = data;
    isJwt.value = true;
  } catch {}
}

async function loadLogs() {
  try {
    const logs = await getApiLogs(route.params.id);
    LogsData.value = logs.data;
    chartData.value = logs.chartData;
    lastCheckAt = logs.lastCheckAt;
  } catch {}
}

async function refresh() {
  await loadApi();
  await Promise.all([loadLogs(), statsRef.value?.refresh()]);
  scheduler.schedule();
}

const isToggling = ref(false);

async function handleTogglePause() {
  isToggling.value = true;
  const pausing = !isApiPaused(ApiData.value);
  try {
    await (pausing ? pauseApi(route.params.id) : resumeApi(route.params.id));
    notify(
      `${pausing ? "Paused" : "Resumed"} checks for: ${ApiData.value.url}`,
      "success",
      "$success",
    );

    if (!pausing) await sleep(SETTLE_DELAY_MS);
    await refresh();
    settle();
  } catch (error) {
    notify("Error: " + error.message, "error", "mdi-cancel");
  } finally {
    isToggling.value = false;
  }
}

async function handleDelete() {
  try {
    const url = ApiData.value.url;
    await deleteApi(route.params.id);
    notify(
      `Successfully deleted health check for: ${url}`,
      "success",
      "$success",
    );
    router.push("/dashboard");
  } catch (error) {
    notify("Error: " + error.message, "error", "mdi-cancel");
  }
}

const logDialog = ref(false);
const isLogLoading = ref(false);
const selectedLog = ref(null);

async function openLog(logId) {
  selectedLog.value = null;
  logDialog.value = true;
  isLogLoading.value = true;
  try {
    selectedLog.value = await getApiLog(route.params.id, logId);
  } catch (error) {
    logDialog.value = false;
    notify("Error: " + error.message, "error", "mdi-cancel");
  } finally {
    isLogLoading.value = false;
  }
}

const logRows = computed(() => {
  const log = selectedLog.value;
  if (!log) return [];

  return [
    ["Checked at", formatDateTime(log.createdAt)],
    ["Status", log.status],
    ["Status code", log.statusCode ?? "—"],
    [
      "Response time",
      log.responseTimeMs == null
        ? "—"
        : `${Math.round(log.responseTimeMs * 100) / 100}ms`,
    ],
    ...(log.error ? [["Error", log.error]] : []),
  ];
});

const prettyBody = computed(() => {
  const body = selectedLog.value?.responseBody;
  if (!body) return null;
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
});

async function copyBody() {
  try {
    await navigator.clipboard.writeText(selectedLog.value.responseBody);
    notify("Copied response body", "success", "$success");
  } catch {
    notify("Could not copy to clipboard", "error", "mdi-cancel");
  }
}

onMounted(checkif);
onUnmounted(() => {
  active = false;
  clearTimeout(settleTimer);
  scheduler.stop();
});
</script>

<template>
  <v-container
    fluid
    class="pa-4 d-flex align-center justify-center"
    v-if="isLoading"
  >
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </v-container>
  <v-container fluid class="pa-4" v-else-if="isJwt">
    <v-btn size="small" color="primary" class="mb-3" :to="`/dashboard`">
      Return to dashboard
    </v-btn>
    <v-row cols="12">
      <v-col cols="12" md="6">
        <div class="border-thin rounded">
          <div class="d-flex align-center border-b-thin font-weight-bold">
            <p class="pa-3 flex-grow-1">Name: {{ ApiData?.name }}</p>
          </div>

          <div class="d-flex align-center border-b-thin">
            <p class="pa-3 flex-grow-1">Url: {{ ApiData?.url }}</p>
          </div>

          <div class="d-flex align-center border-b-thin">
            <p class="pa-3 flex-grow-1">
              Slow API Threshold: {{ ApiData?.slowThresholdMs }}ms
            </p>
          </div>

          <div class="d-flex align-center border-b-thin">
            <p class="pa-3 flex-grow-1">
              Errors in a row until alert: {{ ApiData?.errorsToAlert }}
            </p>
          </div>

          <div class="d-flex align-center border-b-thin">
            <p class="pa-3 flex-grow-1">
              Request method: {{ ApiData?.requestMethod }}
            </p>
          </div>

          <div class="d-flex align-center border-b-thin">
            <p class="pa-3 flex-grow-1">
              Interval between health checks:
              {{ ApiData?.intervalMinutes }} minutes
            </p>
          </div>

          <div class="d-flex align-center border-b-thin">
            <p class="pa-3 flex-grow-1">Status: {{ ApiData?.status }}</p>
          </div>
          <div class="border-b-thin pa-3">
            <p>
              Request headers:
              <span v-if="!headerEntries.length">none</span>
            </p>
            <p
              v-for="[name, value] in headerEntries"
              :key="name"
              class="ms-4 text-break"
            >
              {{ name }}: {{ value }}
            </p>
          </div>
          <div class="d-flex align-center border-b-thin">
            <p class="pa-3 flex-grow-1">
              Request body: {{ ApiData?.requestBody }}
            </p>
          </div>
          <div class="d-flex align-center border-b-thin">
            <p class="pa-3 flex-grow-1">
              Expected body: {{ ApiData?.expectedBody }}
            </p>
          </div>
          <div class="d-flex align-center border-b-thin">
            <p class="pa-3 flex-grow-1">
              Send alert on Slow: {{ ApiData?.alertOnSlow ? "Yes" : "No" }}
            </p>
          </div>

          <div class="d-flex align-center border-b-thin">
            <p class="pa-3 flex-grow-1">
              Send alert on Down: {{ ApiData?.alertOnDown ? "Yes" : "No" }}
            </p>
          </div>
        </div>
        <div class="d-flex mt-3">
          <v-btn
            color="primary"
            class="me-3"
            :to="`/dashboard/${route.params.id}/edit`"
          >
            Edit
          </v-btn>
          <v-btn
            class="me-3"
            variant="outlined"
            :prepend-icon="isApiPaused(ApiData) ? 'mdi-play' : 'mdi-pause'"
            :loading="isToggling"
            @click="handleTogglePause"
          >
            {{ isApiPaused(ApiData) ? "Resume checks" : "Pause checks" }}
          </v-btn>
          <v-btn color="error" @click="handleDelete">Delete API</v-btn>
        </div>
        <ApiStatsDonut ref="statsRef" :api-id="route.params.id" class="mt-4" />
      </v-col>

      <v-col cols="12" md="6">
        <ApiAreaChart
          show-y-axis
          y-label="Response time (ms)"
          :data="chartData"
          index="createdAt"
          :categories="['responseTimeMs']"
          :config="chartConfig"
          :threshold="ApiData?.slowThresholdMs"
          class="h-[300px] mb-4"
          v-if="LogsData?.items.length"
        />
        <div
          class="border-thin rounded pa-4 d-flex flex-column justify-space-between mb-3"
          v-for="log in LogsData?.items.slice(
            0,
            Math.min(LogsData.items.length, 5),
          )"
          :key="log.id"
        >
          <div class="border-b-thin d-flex pa-2">
            <p class="ms-3 flex-grow-1 font-weight-bold">
              Status:
              <b>{{ log.status }}</b>
            </p>
            <p class="me-3">
              Response time: {{ Math.round(log.responseTimeMs * 100) / 100 }}ms
            </p>
          </div>

          <div class="d-flex align-center mt-2 pa-2">
            <p class="ms-3 flex-grow-1">Created At: {{ log.createdAt }}</p>
            <p v-if="log.error" class="me-3">{{ log.error }}</p>
            <v-btn
              size="small"
              variant="tonal"
              class="me-3"
              prepend-icon="mdi-eye-outline"
              @click="openLog(log.id)"
            >
              Details
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-dialog v-model="logDialog" max-width="720">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span class="flex-grow-1">Log details</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Close"
            @click="logDialog = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="isLogLoading" class="d-flex justify-center pa-6">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <template v-else-if="selectedLog">
            <div class="border-thin rounded mb-4">
              <div
                v-for="[label, value] in logRows"
                :key="label"
                class="d-flex border-b-thin pa-3"
              >
                <p class="w-33 font-weight-bold">{{ label }}</p>
                <p class="flex-grow-1 text-break">{{ value }}</p>
              </div>
            </div>

            <div class="d-flex align-center mb-2">
              <p class="font-weight-bold flex-grow-1">Response body</p>
              <v-btn
                v-if="prettyBody"
                size="small"
                variant="text"
                prepend-icon="mdi-content-copy"
                @click="copyBody"
              >
                Copy
              </v-btn>
            </div>
            <pre
              v-if="prettyBody"
              class="border-thin rounded pa-3 overflow-auto"
              style="
                max-height: 320px;
                white-space: pre-wrap;
                word-break: break-word;
                font-size: 0.85rem;
                font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
              "
              >{{ prettyBody }}</pre
            >
            <p v-else class="text-medium-emphasis">
              No response body was stored for this check.
            </p>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
  <v-container fluid class="pa-4 d-flex align-center justify-center" v-else>
    <h1>Page doesn't exist</h1>
  </v-container>
</template>
