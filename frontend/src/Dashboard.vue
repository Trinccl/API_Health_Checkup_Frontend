<script setup>
import { onMounted, ref } from "vue";

const jwt = ref(localStorage.getItem("JWT"));
const isJwt = ref(false);
const errorMessage = ref("");
const urlInput = ref("");

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

const askHealth = async () => {
  try {
    const response = await fetch("http://localhost:3000/checker/ping", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt.value}`,
      },
      body: JSON.stringify({
        url: urlInput.value,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      errorMessage.value =
        "Success: API healthy, response time: " + data.time + " ms";
    } else {
      errorMessage.value = "Error: " + data.message[0];
    }
  } catch (error) {
    errorMessage.value = "Error: " + error.message;
  }
  errorMessage.value.replace(",", ", ");
};

onMounted(() => {
  checkif();
});
</script>

<template>
  <v-container
    fluid
    class="pa-4 d-flex align-center justify-center flex-column"
    v-if="isJwt"
  >
    <h2>Simple health check</h2>
    <p>more TBA</p>
    <v-form @submit.prevent="askHealth" class="pa-3 w-100 mt-3">
      <v-text-field
        v-model="urlInput"
        label="Url"
        type="url"
        placeholder="ex. https://github.com/"
        variant="outlined"
        density="comfortable"
        class="mb-2"
      ></v-text-field>

      <v-btn type="submit" color="primary" block class="mt-3"> Submit </v-btn>
    </v-form>
    <p>{{ errorMessage }}</p>
  </v-container>
  <v-container
    fluid
    class="pa-4 d-flex align-center justify-center"
    v-if="!isJwt"
  >
    <h1>Unauthorized Entry</h1>
    <p>{{ errorMessage }}</p>
  </v-container>
</template>
