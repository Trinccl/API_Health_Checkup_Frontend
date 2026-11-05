<script setup>
import router from "./router.js";
import { onMounted, onUnmounted, ref, inject } from "vue";
import { useRoute } from "vue-router";
import ApiAreaChart from "@/components/ApiAreaChart.vue";
import ApiStatsDonut from "@/components/ApiStatsDonut.vue";
import {
  checkToken,
  getApi,
  getApiLogs,
  deleteApi,
  pauseApi,
  resumeApi,
  isApiPaused,
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

async function checkif() {
  isLoading.value = true;
  try {
    if (await checkToken()) await refresh();
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
    await refresh();
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

onMounted(checkif);
onUnmounted(scheduler.stop);
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

          <div class="d-flex mt-2 pa-2">
            <p class="ms-3 flex-grow-1">Status Code: {{ log.statusCode }}</p>
            <p v-if="log.error" class="me-3">{{ log.error }}</p>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
  <v-container fluid class="pa-4 d-flex align-center justify-center" v-else>
    <h1>Page doesn't exist</h1>
  </v-container>
</template>
