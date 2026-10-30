<script setup>
import router from "./router.js";
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import ApiAreaChart from "@/components/ApiAreaChart.vue";

const jwt = ref(localStorage.getItem("JWT"));
const isJwt = ref(false);
const errorMessage = ref("");
const route = useRoute();
const ApiData = ref(null);
const LogsData = ref(null);
const isLoading = ref(true);
const chartData = ref(null);
const thresholdInput = ref("");
const errorThresholdInput = ref("");
const intervalMinutesInput = ref("");
const sendOnSlow = ref(true);
const sendOnDown = ref(true);
const chartConfig = {
  responseTimeMs: {
    label: "Response Time",
    color: "var(--chart-2)",
  },
};

async function checkif() {
  isLoading.value = true;
  jwt.value = localStorage.getItem("JWT");

  if (!jwt.value) {
    isJwt.value = false;
    isLoading.value = false;
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/auth/checkToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt.value}`,
      },
    });

    if (response.ok) {
      refresh();
      isJwt.value = true;
    } else {
      isJwt.value = false;
      errorMessage.value = "Error: " + response.statusText;
    }
  } catch (error) {
    isJwt.value = false;
    errorMessage.value = "Network Error: " + error.message;
  } finally {
    isLoading.value = false;
  }
}

async function getApi() {
  try {
    const response = await fetch(
      `http://localhost:3000/checker/apis/${route.params.id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt.value}`,
        },
      },
    );

    const data = await response.json();

    if (response.ok) {
      ApiData.value = data;
      sendOnDown.value = ApiData.value.alertOnDown;
      sendOnSlow.value = ApiData.value.alertOnSlow;
    } else {
      errorMessage.value = "Error: " + data.message;
    }
  } catch (error) {
    errorMessage.value = "Error: " + error.message;
  }
}

function formatDate(dateString) {
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

async function getApiLogs() {
  try {
    const response = await fetch(
      `http://localhost:3000/checker/apis/${route.params.id}/logs`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt.value}`,
        },
      },
    );

    const data = await response.json();

    if (response.ok) {
      data.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      for (const item of data.items) {
        item.createdAt = formatDate(item.createdAt);
      }

      LogsData.value = data;
      chartData.value = [...data.items].reverse();

      lastCheckAt =
        Math.max(
          ...data.items.map((i) => new Date(i.createdAt).getTime()),
          0,
        ) || null;
    } else {
      errorMessage.value = "Error: " + data.message;
    }
  } catch (error) {
    errorMessage.value = "Error: " + error.message;
  }
}

async function deleteApi() {
  try {
    const response = await fetch(
      `http://localhost:3000/checker/apis/${route.params.id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt.value}`,
        },
      },
    );

    router.push("/dashboard");
  } catch (error) {
    errorMessage.value = "Error: " + error.message;
  }
}

async function submitPatch() {
  try {
    const response = await fetch(
      `http://localhost:3000/checker/apis/${route.params.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt.value}`,
        },
        body: JSON.stringify({
          name: ApiData.value.name,
          url: ApiData.value.url,
          slowThresholdMs:
            Number(thresholdInput.value) || ApiData.value.slowThresholdMs,
          errorsToAlert:
            Number(errorThresholdInput.value) || ApiData.value.errorsToAlertt,
          requestMethod: ApiData.value.requestMethod,
          intervalMinutes:
            Number(intervalMinutesInput.value) || ApiData.value.intervalMinutes,
          alertOnDown: sendOnDown.value,
          alertOnSlow: sendOnSlow.value,
        }),
      },
    );

    const data = await response.json();

    if (response.ok) {
      refresh();
      thresholdInput.value = "";
      errorThresholdInput.value = "";
      intervalMinutesInput.value = "";
    } else {
      errorMessage.value = "Error: " + data.message;
    }
  } catch (error) {
    errorMessage.value = "Error: " + error.message;
  }
}

onMounted(() => {
  checkif();
});

let active = true;
let timer;
let lastCheckAt = null;
const BUFFER_MS = 3000;
const MIN_DELAY_MS = 10000;

function scheduleRefresh() {
  clearTimeout(timer);
  if (!active) return;

  const intervalMs = (ApiData.value?.intervalMinutes ?? 0) * 60000;
  if (!intervalMs) return;

  let delay = intervalMs + BUFFER_MS;
  if (lastCheckAt) {
    delay = lastCheckAt + intervalMs - Date.now() + BUFFER_MS;
  }

  delay = Math.min(Math.max(delay, MIN_DELAY_MS), intervalMs + BUFFER_MS);

  timer = setTimeout(refresh, delay);
}

async function refresh() {
  await Promise.all([getApi(), getApiLogs()]);
  scheduleRefresh();
}

onUnmounted(() => {
  active = false;
  clearTimeout(timer);
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
          <div class="d-flex justify-end mt-3">
            <v-btn type="submit" color="primary">Submit new Data</v-btn>
          </div>
        </v-form>
        <ApiAreaChart
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
            <p class="me-3">Response time: {{ log.responseTimeMs }}ms</p>
          </div>

          <div class="d-flex mt-2 pa-2">
            <p class="ms-3 flex-grow-1">Status Code: {{ log.statusCode }}</p>
            <p v-if="log.error" class="me-3">{{ log.error }}</p>
          </div>
        </div>
        <v-btn color="primary" class="mt-3 align-self-end" @click="deleteApi">
          Delete API
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
  <v-container fluid class="pa-4 d-flex align-center justify-center" v-else>
    <h1>Page doesn't exist</h1>
  </v-container>
</template>
