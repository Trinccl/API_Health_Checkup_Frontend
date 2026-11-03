<script setup>
import router from "./router.js";
import { onMounted, onUnmounted, ref, inject } from "vue";
import { useRoute } from "vue-router";
import ApiAreaChart from "@/components/ApiAreaChart.vue";
import {
  checkToken,
  getApi,
  getApiLogs,
  updateApi,
  deleteApi,
  createRefreshScheduler,
} from "./api.js";

const notify = inject("notify");
const route = useRoute();

const isJwt = ref(false);
const isLoading = ref(true);
const ApiData = ref(null);
const LogsData = ref(null);
const chartData = ref(null);

const thresholdInput = ref("");
const errorThresholdInput = ref("");
const intervalMinutesInput = ref("");
const sendOnSlow = ref(true);
const sendOnDown = ref(true);
const reqBodyInput = ref("");
const expectedBodyInput = ref("");

const chartConfig = {
  responseTimeMs: {
    label: "Response Time",
    color: "var(--chart-2)",
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
    sendOnDown.value = data.alertOnDown;
    sendOnSlow.value = data.alertOnSlow;
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
  await loadLogs();
  scheduler.schedule();
}

async function submitPatch() {
  try {
    await updateApi(route.params.id, {
      name: ApiData.value.name,
      url: ApiData.value.url,
      requestMethod: ApiData.value.requestMethod,
      slowThresholdMs: thresholdInput.value || ApiData.value.slowThresholdMs,
      errorsToAlert: errorThresholdInput.value || ApiData.value.errorsToAlert,
      intervalMinutes:
        intervalMinutesInput.value || ApiData.value.intervalMinutes,
      alertOnDown: sendOnDown.value,
      alertOnSlow: sendOnSlow.value,
      requestBody: reqBodyInput.value || ApiData.value.requestBody,
      expectedBody: expectedBodyInput.value || ApiData.value.expectedBody,
    });
    refresh();
    thresholdInput.value = "";
    errorThresholdInput.value = "";
    intervalMinutesInput.value = "";
    expectedBodyInput.value = "";
    reqBodyInput.value = "";
    notify("Successfully modified data!", "success", "$success");
  } catch (error) {
    notify("Error: " + error.message, "error", "mdi-cancel");
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
      <v-col md="6">
        <v-form @submit.prevent="submitPatch" class="mb-[40px]">
          <div class="border-thin rounded">
            <div class="d-flex align-center border-b-thin font-weight-bold">
              <p class="pa-3 flex-grow-1">Name: {{ ApiData?.name }}</p>
            </div>

            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 flex-grow-1">Url: {{ ApiData?.url }}</p>
            </div>

            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 w-50 border-e-thin">
                Slow API Threshold: {{ ApiData?.slowThresholdMs }}ms
              </p>
              <v-text-field
                v-model.number="thresholdInput"
                label="New slow Response Threshold (Ms)"
                type="number"
                variant="plain"
                density="compact"
                single-line
                hide-details
                class="inline-field w-50 px-3"
              ></v-text-field>
            </div>

            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 w-50 border-e-thin">
                Errors in a row until alert: {{ ApiData?.errorsToAlert }}
              </p>
              <v-text-field
                v-model.number="errorThresholdInput"
                label="New errors in a row until alert"
                type="number"
                variant="plain"
                density="compact"
                single-line
                hide-details
                class="inline-field w-50 px-3"
              ></v-text-field>
            </div>

            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 flex-grow-1">
                Request method: {{ ApiData?.requestMethod }}
              </p>
            </div>

            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 w-50 border-e-thin">
                Interval between health checks:
                {{ ApiData?.intervalMinutes }} minutes
              </p>
              <v-text-field
                v-model.number="intervalMinutesInput"
                label="New interval between health checks"
                type="number"
                variant="plain"
                density="compact"
                single-line
                hide-details
                class="inline-field w-50 px-3"
              />
            </div>

            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 flex-grow-1">Status: {{ ApiData?.status }}</p>
            </div>
            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 w-50 border-e-thin">
                Request body:
                {{ ApiData?.requestBody }}
              </p>
              <v-text-field
                v-model="reqBodyInput"
                label="New request body:"
                type="text"
                variant="plain"
                density="compact"
                hide-details
                class="inline-field w-50 px-3"
                v-if="!['GET', 'HEAD'].includes(ApiData?.requestMethod)"
              />
            </div>
            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 w-50 border-e-thin">
                Expected body:
                {{ ApiData?.expectedBody }}
              </p>
              <v-text-field
                v-model="expectedBodyInput"
                label="New expected body"
                type="text"
                variant="plain"
                density="compact"
                hide-details
                class="inline-field w-50 px-3"
                v-if="ApiData?.requestMethod != 'HEAD'"
              />
            </div>
            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 w-50 border-e-thin">
                Send alert on Slow: {{ ApiData?.alertOnSlow ? "Yes" : "No" }}
              </p>
              <v-checkbox
                v-model="sendOnSlow"
                label="Send mail alert on Slow API status"
                density="compact"
                hide-details
                class="inline-checkbox w-50 px-3"
              ></v-checkbox>
            </div>

            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 w-50 border-e-thin">
                Send alert on Down: {{ ApiData?.alertOnDown ? "Yes" : "No" }}
              </p>
              <v-checkbox
                v-model="sendOnDown"
                label="Send mail alert on Down API status"
                density="compact"
                hide-details
                class="inline-checkbox w-50 px-3"
              ></v-checkbox>
            </div>
          </div>
          <div class="d-flex justify-end align-center mt-3">
            <v-btn type="submit" color="primary">Submit new Data</v-btn>
          </div>
        </v-form>
        <ApiAreaChart
          show-y-axis
          y-label="Response time (ms)"
          :data="chartData"
          index="createdAt"
          :categories="['responseTimeMs']"
          :config="chartConfig"
          class="h-[300px]"
          v-if="LogsData?.items.length"
        />
      </v-col>

      <v-col md="6">
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
        <v-btn
          color="primary"
          class="mt-3 align-self-end"
          @click="handleDelete"
        >
          Delete API
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
  <v-container fluid class="pa-4 d-flex align-center justify-center" v-else>
    <h1>Page doesn't exist</h1>
  </v-container>
</template>
