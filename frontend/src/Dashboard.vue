<script setup>
import { onMounted, onUnmounted, ref, inject } from "vue";
import ApiStatsDonut from "@/components/ApiStatsDonut.vue";
import {
  checkToken,
  getApis,
  pauseApi,
  resumeApi,
  isApiPaused,
  isStatusPending,
  sleep,
  SETTLE_DELAY_MS,
  SETTLE_MAX_ATTEMPTS,
} from "./api.js";

const notify = inject("notify");
const isJwt = ref(false);
const isLoading = ref(true);
const ApiData = ref([]);
const statsRef = ref(null);
const busyId = ref(null);

let settleTimer;
let active = true;

function settleStatuses(attempt = 0) {
  clearTimeout(settleTimer);
  if (
    !active ||
    !ApiData.value.some(isStatusPending) ||
    attempt >= SETTLE_MAX_ATTEMPTS
  ) {
    return;
  }

  settleTimer = setTimeout(async () => {
    await Promise.all([loadApis(), statsRef.value?.refresh()]);
    settleStatuses(attempt + 1);
  }, SETTLE_DELAY_MS);
}

async function checkif() {
  isLoading.value = true;
  try {
    isJwt.value = await checkToken();

    if (isJwt.value) {
      await loadApis();
      settleStatuses();
    }
  } catch (error) {
    isJwt.value = false;
    notify("Error: " + error.message, "error", "mdi-cancel");
  } finally {
    isLoading.value = false;
  }
}

async function loadApis() {
  try {
    ApiData.value = await getApis();
  } catch (error) {
    notify("Error: " + error.message, "error", "mdi-cancel");
  }
}

async function togglePause(api) {
  busyId.value = api.id;
  const pausing = !isApiPaused(api);
  try {
    await (pausing ? pauseApi(api.id) : resumeApi(api.id));
    notify(
      `${pausing ? "Paused" : "Resumed"} checks for: ${api.name}`,
      "success",
      "$success",
    );

    if (!pausing) await sleep(SETTLE_DELAY_MS);
    await Promise.all([loadApis(), statsRef.value?.refresh()]);
    settleStatuses();
  } catch (error) {
    notify("Error: " + error.message, "error", "mdi-cancel");
  } finally {
    busyId.value = null;
  }
}

onMounted(checkif);
onUnmounted(() => {
  active = false;
  clearTimeout(settleTimer);
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
  <v-container fluid class="pa-4 page" v-else-if="isJwt">
    <div class="d-flex justify-space-between align-center flex-wrap ga-2 mb-3">
      <h1 class="text-headline-small font-weight-bold">Monitored APIs</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" :to="`/dashboard/create`">
        Add API
      </v-btn>
    </div>
    <v-row cols="12">
      <v-col cols="12" md="4" lg="3" class="mb-2">
        <ApiStatsDonut ref="statsRef" title="All APIs: check results" />
      </v-col>
      <v-col cols="12" md="8" lg="9">
        <div
          class="border-thin rounded pa-4 d-flex flex-column justify-space-between mb-3"
          v-for="api in ApiData"
          :key="api.id"
        >
          <div class="border-b-thin d-flex align-center flex-wrap ga-2 pa-2">
            <p class="ms-3 flex-grow-1 text-break min-w-0">
              Name:
              <b>{{ api.name }}</b>
            </p>
            <div class="d-flex ga-2 me-3">
              <v-btn
                size="small"
                variant="outlined"
                :prepend-icon="isApiPaused(api) ? 'mdi-play' : 'mdi-pause'"
                :loading="busyId === api.id"
                :disabled="busyId !== null && busyId !== api.id"
                @click="togglePause(api)"
              >
                {{ isApiPaused(api) ? "Resume" : "Pause" }}
              </v-btn>
              <v-btn
                size="small"
                color="primary"
                :to="`/dashboard/${api.id}`"
              >
                Details
              </v-btn>
            </div>
          </div>

          <div class="d-flex flex-wrap ga-2 pa-2 mt-2">
            <p class="ms-3 flex-grow-1 text-break min-w-0">URL: {{ api.url }}</p>
            <p class="me-3">Status: {{ api.status }}</p>
          </div>
        </div>
        <p class="text-center mt-3" v-if="!ApiData.length">
          No APIs monitored yet. Use “Add API” to create your first one.
        </p>
      </v-col>
    </v-row>
  </v-container>
  <v-container fluid class="pa-4 d-flex align-center justify-center" v-else>
    <h1>Unauthorized Entry</h1>
  </v-container>
</template>
