<script setup>
import router from "./router.js";
import { onMounted, ref, inject, computed } from "vue";
import { useRoute } from "vue-router";
import HeadersEditor from "@/components/HeadersEditor.vue";
import {
  checkToken,
  getApi,
  updateApi,
  headersToRows,
  rowsToHeaders,
} from "./api.js";
import JsonTextArea from "./components/JsonTextArea.vue";
import FormatterWithPre from "./components/FormatterWithPre.vue";
const notify = inject("notify");
const route = useRoute();

const isJwt = ref(false);
const isLoading = ref(true);
const ApiData = ref(null);

const thresholdInput = ref("");
const errorThresholdInput = ref("");
const intervalMinutesInput = ref("");
const sendOnSlow = ref(true);
const sendOnDown = ref(true);
const reqBodyInput = ref("");
const expectedBodyInput = ref("");
const headerRows = ref([]);

async function checkif() {
  isLoading.value = true;
  try {
    if (await checkToken()) {
      await loadApi();
      isJwt.value = true;
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
    sendOnDown.value = data.alertOnDown;
    sendOnSlow.value = data.alertOnSlow;
    headerRows.value = headersToRows(data.requestHeaders);
  } catch (error) {
    notify("Error: " + error.message, "error", "mdi-cancel");
  }
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
      requestHeaders: rowsToHeaders(headerRows.value),
    });
    notify("Successfully modified data!", "success", "$success");
    router.push(`/dashboard/${route.params.id}`);
  } catch (error) {
    notify("Error: " + error.message, "error", "mdi-cancel");
  }
}

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
  <v-container fluid class="pa-4 page" v-else-if="isJwt">
    <v-btn
      size="small"
      color="primary"
      class="mb-3"
      :to="`/dashboard/${route.params.id}`"
    >
      Return to details
    </v-btn>
    <v-row cols="12" class="d-flex align-center justify-center">
      <v-col cols="12" md="10" lg="9">
        <v-form @submit.prevent="submitPatch" class="mb-[40px]">
          <div class="border-thin rounded field-card">
            <div class="d-flex align-center border-b-thin font-weight-bold">
              <p class="pa-3 flex-grow-1">Name: {{ ApiData?.name }}</p>
            </div>

            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 flex-grow-1 text-break">Url: {{ ApiData?.url }}</p>
            </div>

            <div class="field-row border-b-thin">
              <p class="field-label pa-3">
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
                class="field-input px-3"
              ></v-text-field>
            </div>

            <div class="field-row border-b-thin">
              <p class="field-label pa-3">
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
                class="field-input px-3"
              ></v-text-field>
            </div>

            <div class="d-flex align-center border-b-thin">
              <p class="pa-3 flex-grow-1">
                Request method: {{ ApiData?.requestMethod }}
              </p>
            </div>

            <div class="field-row border-b-thin">
              <p class="field-label pa-3">
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
                class="field-input px-3"
              />
            </div>

            <div
              class="field-row border-b-thin"
              v-if="!['GET', 'HEAD'].includes(ApiData?.requestMethod)"
            >
              <p class="field-label pa-3">
                Request body:
                <FormatterWithPre :value="ApiData?.requestBody" />
              </p>
              <div class="field-input pa-3">
                <JsonTextArea
                  v-model="reqBodyInput"
                  label="New request body:"
                  class="mb-3"
                />
                <v-btn @click="formatRequestJson"> Format JSON </v-btn>
              </div>
            </div>
            <div
              class="field-row border-b-thin"
              v-if="ApiData?.requestMethod != 'HEAD'"
            >
              <p class="field-label pa-3">
                Expected body:
                <FormatterWithPre :value="ApiData?.expectedBody" />
              </p>
              <div class="field-input pa-3">
                <JsonTextArea
                  v-model="expectedBodyInput"
                  label="New expected body"
                  class="mb-3"
                />
                <v-btn @click="formatExpectedJson"> Format JSON </v-btn>
              </div>
            </div>

            <div class="border-b-thin pa-3">
              <p class="mb-3">Request headers:</p>
              <HeadersEditor v-model="headerRows" />
            </div>

            <div class="field-row border-b-thin">
              <p class="field-label pa-3">
                Send alert on Slow: {{ ApiData?.alertOnSlow ? "Yes" : "No" }}
              </p>
              <v-checkbox
                v-model="sendOnSlow"
                label="Send mail alert on Slow API status"
                density="compact"
                hide-details
                class="field-input px-3"
              ></v-checkbox>
            </div>

            <div class="field-row border-b-thin">
              <p class="field-label pa-3">
                Send alert on Down: {{ ApiData?.alertOnDown ? "Yes" : "No" }}
              </p>
              <v-checkbox
                v-model="sendOnDown"
                label="Send mail alert on Down API status"
                density="compact"
                hide-details
                class="field-input px-3"
              ></v-checkbox>
            </div>
          </div>
          <div class="d-flex justify-end align-center mt-3">
            <v-btn type="submit" color="primary">Save changes</v-btn>
          </div>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
  <v-container fluid class="pa-4 d-flex align-center justify-center" v-else>
    <h1>Page doesn't exist</h1>
  </v-container>
</template>
