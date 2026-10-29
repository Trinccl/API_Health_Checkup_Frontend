<script setup>
import { onMounted, ref } from "vue";

const jwt = ref(localStorage.getItem("JWT"));
const isJwt = ref(false);
const errorMessage = ref("");
const urlInput = ref("");
const nameInput = ref("");
const thresholdInput = ref("");
const errorThresholdInput = ref("");
const requestMethodInput = ref("");
const intervalMinutesInput = ref("");
const ApiData = ref([]);
const isLoading = ref(true);
const sendOnSlow = ref(true);
const sendOnDown = ref(true);

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
      getApisForUser();
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

async function getApisForUser() {
  try {
    const response = await fetch("http://localhost:3000/checker/apis", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt.value}`,
      },
    });

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

const addAskHealthAPI = async () => {
  try {
    const response = await fetch("http://localhost:3000/checker/apis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt.value}`,
      },
      body: JSON.stringify({
        name: nameInput.value,
        url: urlInput.value.replace(/\/+$/, ""),
        slowThresholdMs: Number(thresholdInput.value),
        errorsToAlert: Number(errorThresholdInput.value),
        requestMethod: requestMethodInput.value,
        intervalMinutes: Number(intervalMinutesInput.value),
        alertOnDown: sendOnDown.value,
        alertOnSlow: sendOnSlow.value,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      errorMessage.value = "Success";
      getApisForUser();
    } else {
      errorMessage.value = "Error: " + data.message;
    }
  } catch (error) {
    errorMessage.value = "Error: " + error.message;
  }
};

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
      <v-col md="6" class="border-thin rounded">
        <v-form @submit.prevent="addAskHealthAPI" class="pa-3 w-100 mt-3">
          <v-text-field
            v-model="nameInput"
            label="Name"
            type="text"
            placeholder="ex. Check for github.com"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          ></v-text-field>

          <v-text-field
            v-model="urlInput"
            label="Url"
            type="url"
            placeholder="ex. https://github.com/"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          ></v-text-field>

          <v-text-field
            v-model="thresholdInput"
            label="Slow Response Threshold (Ms)"
            type="number"
            placeholder="ex. 1000"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          ></v-text-field>

          <v-text-field
            v-model="intervalMinutesInput"
            label="Health Checking Interval (minutes)"
            type="number"
            placeholder="ex. 10"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          ></v-text-field>

          <v-text-field
            v-model="errorThresholdInput"
            label="Errors in a row for warning"
            type="number"
            placeholder="ex. 3"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          ></v-text-field>

          <v-select
            v-model="requestMethodInput"
            :items="[
              'GET',
              'POST',
              'PUT',
              'PATCH',
              'DELETE',
              'OPTIONS',
              'HEAD',
            ]"
            label="Request Method"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          ></v-select>
          <v-row cols="12">
            <v-col md="6">
              <v-checkbox
                v-model="sendOnSlow"
                label="Send mail alert on Slow API status"
              ></v-checkbox
            ></v-col>
            <v-col md="6">
              <v-checkbox
                v-model="sendOnDown"
                label="Send mail alert on Down API status"
              ></v-checkbox>
            </v-col>
          </v-row>
          <v-btn type="submit" color="primary" block class="mt-3">
            Submit
          </v-btn>
        </v-form>
        <p class="ma-6 text-align-center">{{ errorMessage }}</p>
      </v-col>

      <v-col md="6">
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
        </div>
      </v-col>
    </v-row>
  </v-container>
  <v-container fluid class="pa-4 d-flex align-center justify-center" v-else>
    <h1>Unauthorized Entry</h1>
  </v-container>
</template>
