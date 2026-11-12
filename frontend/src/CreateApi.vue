<script setup>
import { onMounted, ref, inject, computed, watch } from "vue";
import router from "./router.js";
import HeadersEditor from "@/components/HeadersEditor.vue";
import {
  checkToken,
  createApi,
  rowsToHeaders,
  sleep,
  SETTLE_DELAY_MS,
} from "./api.js";
import JsonTextArea from "./components/JsonTextArea.vue";

const notify = inject("notify");
const isJwt = ref(false);
const isLoading = ref(true);
const isSubmitting = ref(false);

const urlInput = ref("");
const nameInput = ref("");
const reqBodyInput = ref("");
const headerRows = ref([]);
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
  } catch (error) {
    isJwt.value = false;
    notify("Error: " + error.message, "error", "mdi-cancel");
  } finally {
    isLoading.value = false;
  }
}

const addAskHealthAPI = async () => {
  isSubmitting.value = true;
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
      requestHeaders: rowsToHeaders(headerRows.value),
    });
    notify("Success!", "success", "$success");
    await sleep(SETTLE_DELAY_MS);
    router.push("/dashboard");
  } catch (error) {
    notify("Error: " + error.message, "error", "mdi-cancel");
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(checkif);

function formatExpectedJson() {
  if (!expectedBodyInput.value) return null;
  try {
    expectedBodyInput.value = JSON.stringify(
      JSON.parse(expectedBodyInput.value),
      null,
      2,
    );
  } catch {}
}

function formatRequestJson() {
  if (!reqBodyInput.value) return null;
  try {
    reqBodyInput.value = JSON.stringify(
      JSON.parse(reqBodyInput.value),
      null,
      2,
    );
  } catch {}
}
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
    <v-row cols="12" class="d-flex align-center justify-center">
      <v-col md="8" class="border-thin rounded">
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
            :disabled="!sendOnSlow && !sendOnDown"
          ></v-text-field>

          <div class="mb-8">
            <JsonTextArea
              v-model="reqBodyInput"
              label="Request Body (optional)"
              placeholder="JSON or plain text"
              :disabled="noRequestBody"
              class="mb-2"
            />
            <v-btn @click="formatRequestJson"> Format JSON </v-btn>
          </div>

          <div class="mb-8">
            <JsonTextArea
              v-model="expectedBodyInput"
              label="Expected Body (optional)"
              placeholder="JSON or plain text"
              :disabled="noExpectedBody"
              class="mb-2"
            />
            <v-btn @click="formatExpectedJson"> Format JSON </v-btn>
          </div>

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
          <p class="ms-2 mb-2">Request Headers (optional)</p>
          <HeadersEditor v-model="headerRows" class="mb-8" />
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
          <v-btn
            type="submit"
            color="primary"
            block
            class="mt-3"
            :loading="isSubmitting"
          >
            Create API
          </v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
  <v-container fluid class="pa-4 d-flex align-center justify-center" v-else>
    <h1>Unauthorized Entry</h1>
  </v-container>
</template>
