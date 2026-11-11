<script setup>
import { ref, inject, onMounted, onUnmounted } from "vue";
import { resendVerification } from "../api.js";

const props = defineProps({
  email: { type: String, required: true },
  // true right after signing up: an email was just sent, so start on cooldown
  startCooldown: { type: Boolean, default: false },
});

const notify = inject("notify");

// the backend ignores resend requests for 60s after the last email
const COOLDOWN_SECONDS = 60;
const secondsLeft = ref(0);
const isSending = ref(false);
let timer;

function runCooldown() {
  clearInterval(timer);
  secondsLeft.value = COOLDOWN_SECONDS;
  timer = setInterval(() => {
    secondsLeft.value -= 1;
    if (secondsLeft.value <= 0) clearInterval(timer);
  }, 1000);
}

async function resend() {
  isSending.value = true;
  try {
    await resendVerification(props.email);
    notify(
      "If the account needs it, a new email is on its way",
      "success",
      "$success",
    );
    runCooldown();
  } catch (error) {
    notify("Error: " + error.message, "error", "mdi-cancel");
  } finally {
    isSending.value = false;
  }
}

onMounted(() => {
  if (props.startCooldown) runCooldown();
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <v-btn
    variant="tonal"
    block
    :loading="isSending"
    :disabled="secondsLeft > 0 || !email"
    @click="resend"
  >
    {{
      secondsLeft > 0
        ? `Resend email (${secondsLeft}s)`
        : "Resend verification email"
    }}
  </v-btn>
</template>
