<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const jwt = ref(localStorage.getItem("JWT"));
const isJwt = ref(false);
const errorMessage = ref("");
const route = useRoute();
const ApiData = ref(null);
const LogsData = ref(null);
const isLoading = ref(true);

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
      isJwt.value = true;
      getApi();
      getApiLogs();
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
    } else {
      errorMessage.value = "Error: " + data.message;
    }
  } catch (error) {
    errorMessage.value = "Error: " + error.message;
  }
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
      LogsData.value = data;
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
        <div class="border-thin rounded">
          <p class="ps-3 pb-3 border-b-thin d-flex font-weight-bold">
            Name: {{ ApiData?.name }}
          </p>
          <p class="ps-3 pb-3 border-b-thin d-flex">Url: {{ ApiData?.url }}</p>
          <p class="ps-3 pb-3 border-b-thin d-flex">
            Slow API Threshold: {{ ApiData?.slowThresholdMs }}ms
          </p>
          <p class="ps-3 pb-3 border-b-thin d-flex">
            Errors in a row until alert: {{ ApiData?.errorsToAlert }}
          </p>
          <p class="ps-3 pb-3 border-b-thin d-flex">
            Request method: {{ ApiData?.requestMethod }}
          </p>
          <p class="ps-3 pb-3 border-b-thin d-flex">
            Interval between health checks:
            {{ ApiData?.intervalMinutes }} minutes
          </p>
          <p class="ps-3 d-flex">Status: {{ ApiData?.status }}</p>
        </div>
      </v-col>

      <v-col md="6">
        <div
          class="border-thin rounded pa-4 d-flex flex-column justify-space-between mb-3"
          v-for="log in LogsData?.items"
          :key="log.id"
        >
          <div class="border-b-thin d-flex">
            <p class="ms-3 flex-grow-1 font-weight-bold">
              Status:
              <b>{{ log.status }}</b>
            </p>
            <p class="me-3">Response time: {{ log.responseTimeMs }}ms</p>
          </div>

          <div class="d-flex">
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
