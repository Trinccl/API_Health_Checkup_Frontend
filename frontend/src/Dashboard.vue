<script setup>
import { onMounted, ref, inject, computed, watch } from "vue";
import { checkToken, getApis, createApi } from "./api.js";

const notify = inject("notify");
const isJwt = ref(false);
const isLoading = ref(true);
const ApiData = ref([]);

const urlInput = ref("");
const nameInput = ref("");
const reqBodyInput = ref("");
const expectedBodyInput = ref("");
const thresholdInput = ref("");
const errorThresholdInput = ref("");
const requestMethodInput = ref("");
const intervalMinutesInput = ref("");
const sendOnSlow = ref(true);
const sendOnDown = ref(true);

const noRequestBody = computed(() =>
  ["GET", "HEAD"].includes(requestMethodInput.value),
);
const noExpectedBody = computed(() => requestMethodInput.value === "HEAD");

watch(requestMethodInput, () => {
  if (noRequestBody.value) reqBodyInput.value = "";
  if (noExpectedBody.value) expectedBodyInput.value = "";
});

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

const addAskHealthAPI = async () => {
  try {
    await createApi({
      name: nameInput.value,
      url: urlInput.value,
      slowThresholdMs: thresholdInput.value,
      errorsToAlert: errorThresholdInput.value,
      requestMethod: requestMethodInput.value,
      intervalMinutes: intervalMinutesInput.value,
      alertOnDown: sendOnDown.value,
      alertOnSlow: sendOnSlow.value,
      requestBody: reqBodyInput.value,
      expectedBody: expectedBodyInput.value,
    });
    notify("Success!", "success", "$success");
    setTimeout(loadApis, 1000);
  } catch (error) {
    notify("Error: " + error.message, "error", "mdi-cancel");
  }
};

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

          <v-text-field
            v-model="reqBodyInput"
            label="Request Body (optional)"
            type="text"
            placeholder="JSON or plainText"
            variant="outlined"
            density="comfortable"
            class="mb-2"
            :disabled="noRequestBody"
          ></v-text-field>

          <v-text-field
            v-model="expectedBodyInput"
            label="Expected Body (optional)"
            type="text"
            placeholder="JSON or plainText"
            variant="outlined"
            density="comfortable"
            class="mb-2"
            :disabled="noExpectedBody"
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
