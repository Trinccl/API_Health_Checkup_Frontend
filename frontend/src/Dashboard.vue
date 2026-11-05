<script setup>
import { onMounted, ref, inject } from "vue";
import ApiStatsDonut from "@/components/ApiStatsDonut.vue";
import {
  checkToken,
  getApis,
  pauseApi,
  resumeApi,
  isApiPaused,
} from "./api.js";

const notify = inject("notify");
const isJwt = ref(false);
const isLoading = ref(true);
const ApiData = ref([]);
const statsRef = ref(null);
const busyId = ref(null);

async function checkif() {
  isLoading.value = true;
  try {
    isJwt.value = await checkToken();
    if (isJwt.value) await loadApis();
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
    await Promise.all([loadApis(), statsRef.value?.refresh()]);
  } catch (error) {
    notify("Error: " + error.message, "error", "mdi-cancel");
  } finally {
    busyId.value = null;
  }
}

onMounted(checkif);
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
    <div class="d-flex justify-space-between align-center mb-3">
      <h1 class="text-headline font-weight-bold">Monitored APIs</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" :to="`/dashboard/create`">
        Add API
      </v-btn>
    </div>
    <div class="px-4 mb-2" style="max-width: 360px">
      <ApiStatsDonut ref="statsRef" title="All APIs: check results" />
    </div>
    <div class="pa-4">
      <div
        class="border-thin rounded pa-4 d-flex flex-column justify-space-between mb-3"
        v-for="api in ApiData"
        :key="api.id"
      >
        <div class="border-b-thin d-flex pa-2">
          <p class="ms-3 flex-grow-1">
            Name:
            <b>{{ api.name }}</b>
          </p>
          <v-btn
            size="small"
            variant="outlined"
            class="me-3"
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
            class="me-3"
            :to="`/dashboard/${api.id}`"
          >
            Details
          </v-btn>
        </div>

        <div class="d-flex pa-2 mt-2">
          <p class="ms-3 flex-grow-1">URL: {{ api.url }}</p>
          <p class="me-3">Status: {{ api.status }}</p>
        </div>
      </div>
      <p class="text-center mt-3" v-if="!ApiData.length">
        No APIs monitored yet. Use “Add API” to create your first one.
      </p>
    </div>
  </v-container>
  <v-container fluid class="pa-4 d-flex align-center justify-center" v-else>
    <h1>Unauthorized Entry</h1>
  </v-container>
</template>
