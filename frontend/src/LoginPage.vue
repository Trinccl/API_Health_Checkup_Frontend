<script setup>
import { ref, inject } from "vue";
import { setToken } from "./api.js";
import router from "./router.js";
import CubeLogo from "./components/CubeLogo.vue";
import ResendVerification from "./components/ResendVerification.vue";
import { login } from "./api.js";

const topmessage = ref("API");
const bottommessage = ref("HP");
const xSpeed = ref(1);
const ySpeed = ref(1);
const appleModeCheck = ref(false);
const widthVal = ref(50);

const notify = inject("notify");

const logForm = ref({
  email: "",
  password: "",
});

const needsVerification = ref(false);

const submitLogin = async () => {
  needsVerification.value = false;
  try {
    await login(logForm.value.email, logForm.value.password);
    notify("Successfully logged in", "success", "$success");
    router.push("/dashboard");
  } catch (error) {
    // 403 = right password, but the email isn't confirmed yet
    if (error.status === 403) needsVerification.value = true;
    notify("Error: " + error.message, "error", "mdi-cancel");
  }
};
</script>

<template>
  <v-container fluid class="d-flex flex-grow-1 pa-4">
    <v-row cols="12" class="d-flex align-center justify-center flex-column">
      <div md="6">
        <CubeLogo
          :topText="topmessage"
          :bottomText="bottommessage"
          :backText="bottommessage"
          :frontText="topmessage"
          :rightText="bottommessage"
          :leftText="topmessage"
          :rxSpeed="xSpeed"
          :rySpeed="ySpeed"
          :appleMode="appleModeCheck"
          :width="widthVal"
        />
        <h1 class="text-h4 md:text-headline-large pa-3 font-weight-bold text-center">
          API Health Checkup
        </h1>
      </div>
      <v-col md="6" class="border-thin rounded w-full md:w-25" style="flex: 0 0 auto">
        <div class="pa-4">
          <h2 class="text-h4 md:text-headline-large pa-3">Login</h2>
          <hr />
          <v-form @submit.prevent="submitLogin" class="pa-3 w-100 mt-3">
            <v-text-field
              v-model="logForm.email"
              label="Email"
              type="email"
              placeholder="ex. John.XYZ@gmail.com"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="logForm.password"
              label="Password"
              type="password"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            ></v-text-field>

            <v-btn type="submit" color="primary" block class="mt-3">
              Log in
            </v-btn>
          </v-form>
          <div v-if="needsVerification" class="px-3 pb-2">
            <p class="mb-3">
              Your email isn't confirmed yet. Check your inbox (and spam), or
              send a new link:
            </p>
            <ResendVerification :email="logForm.email" />
          </div>
          <p class="pa-3">
            Don't have an account?
            <router-link to="/register" class="text-decoration-underline"
              >Create one</router-link
            >
          </p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
