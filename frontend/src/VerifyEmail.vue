<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { verifyEmail } from "./api.js";

const route = useRoute();
const status = ref("loading"); // "loading" | "success" | "error"
const errorMessage = ref("");

onMounted(async () => {
  const token = String(route.query.token ?? "");

  if (!token) {
    status.value = "error";
    errorMessage.value = "This verification link is incomplete.";
    return;
  }

  try {
    await verifyEmail(token);
    status.value = "success";
  } catch (error) {
    status.value = "error";
    errorMessage.value = error.message;
  }
});
</script>

<template>
  <v-container fluid class="d-flex flex-grow-1 pa-4">
    <v-row cols="12" class="d-flex align-center justify-center flex-column">
      <v-col md="6" class="border-thin rounded auth-card" style="flex: 0 0 auto">
        <div class="pa-4">
          <h2 class="text-headline-small text-md-headline-medium pa-3">Email confirmation</h2>
          <hr />

          <div v-if="status === 'loading'" class="d-flex justify-center pa-6">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <div v-else-if="status === 'success'" class="pa-3 mt-3">
            <p class="mb-4">Your email is confirmed. You can log in now.</p>
            <v-btn to="/" color="primary" block>Go to login</v-btn>
          </div>

          <div v-else class="pa-3 mt-3">
            <p class="mb-2">{{ errorMessage }}</p>
            <p class="mb-4 text-medium-emphasis">
              Try logging in: if your email is still unconfirmed, we'll offer to
              send you a new link.
            </p>
            <v-btn to="/" color="primary" block>Go to login</v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
