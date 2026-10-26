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
const whatthefuck = ref([]);

async function checkif() {
  jwt.value = localStorage.getItem("JWT");
  if (jwt.value) {
    try {
      const response = await fetch("http://localhost:3000/auth/checkToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt.value}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        isJwt.value = true;
      } else {
        isJwt.value = false;
        errorMessage.value = "Error: " + response.statusText;
      }
    } catch (error) {
      isJwt.value = false;
      errorMessage.value = "Network Error: " + error.message;
    }
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
      whatthefuck.value = data;
    } else {
      errorMessage.value = "Error: " + data.message[0];
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
        url: urlInput.value,
        slowThresholdMs: Number(thresholdInput.value),
        errorsToAlert: Number(errorThresholdInput.value),
        requestMethod: requestMethodInput.value,
        intervalMinutes: Number(intervalMinutesInput.value),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      errorMessage.value = "Success: " + data.successMessage;
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
  getApisForUser();
});
</script>

<template>
  <v-container fluid class="pa-4" v-if="isJwt">
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
            :items="['GET', 'POST', 'PUT', 'DELETE', 'PATCH']"
            label="Request Method"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          ></v-select>

          <v-btn type="submit" color="primary" block class="mt-3">
            Submit
          </v-btn>
        </v-form>
        <p class="ms-6">{{ errorMessage }}</p>
      </v-col>

      <v-col md="6">
        <div class="pa-4">
          <h2>Simple health check</h2>
          <p>more TBA</p>
          <div
            class="border-thin rounded pa-4 d-flex flex-column justify-space-between mb-3"
            v-for="api in whatthefuck"
            :key="api.id"
          >
            <div class="border-b-thin d-flex">
              <p class="ms-3 flex-grow-1">
                Name:
                <b>{{ api.name }}</b>
              </p>
              <v-btn size="small" color="primary" class="ma-3 pa-4"
                >Action</v-btn
              >
            </div>

            <div class="d-flex">
              <p class="ms-3 flex-grow-1">URL: {{ api.url }}</p>
              <p class="">Status: {{ api.status }}</p>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
  <v-container
    fluid
    class="pa-4 d-flex align-center justify-center"
    v-if="!isJwt"
  >
    <h1>Unauthorized Entry</h1>
  </v-container>
</template>
