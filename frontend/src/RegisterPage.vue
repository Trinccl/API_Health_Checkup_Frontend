<script setup>
import { ref, inject } from "vue";
import CubeLogo from "./components/CubeLogo.vue";
import ResendVerification from "./components/ResendVerification.vue";
import { register } from "./api.js";
const topmessage = ref("API");
const bottommessage = ref("HP");
const xSpeed = ref(1);
const ySpeed = ref(1);
const appleModeCheck = ref(false);
const widthVal = ref(50);
const notify = inject("notify");
const repass = ref("");
const sentTo = ref("");

const regForm = ref({
  email: "",
  name: "",
  password: "",
});

const submitReg = async () => {
  if (regForm.value.password != repass.value) {
    notify("Error: passwords are not matching", "error", "mdi-cancel");
    return;
  }

  try {
    await register(
      regForm.value.name,
      regForm.value.email,
      regForm.value.password,
    );
    notify(
      "Account created. Check your email to confirm it.",
      "success",
      "$success",
    );
    sentTo.value = regForm.value.email;
  } catch (error) {
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
          <h2 class="text-h4 md:text-headline-large pa-3">Register</h2>
          <hr />
          <v-form
            v-if="!sentTo"
            @submit.prevent="submitReg"
            class="pa-3 w-100 mt-3"
          >
            <v-text-field
              v-model="regForm.name"
              label="Name"
              placeholder="Your Name"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="regForm.email"
              label="Email"
              type="email"
              placeholder="ex. John.XYZ@gmail.com"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="regForm.password"
              label="Password"
              type="password"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="repass"
              label="Repeat password"
              type="password"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            ></v-text-field>

            <v-btn type="submit" color="primary" block class="mt-3">
              Create account
            </v-btn>
          </v-form>
          <div v-else class="pa-3 mt-3">
            <p class="mb-2 font-weight-bold">Check your inbox</p>
            <p class="mb-4">
              We sent a confirmation link to {{ sentTo }}. Open it to activate
              your account. It expires in 24 hours.
            </p>
            <ResendVerification :email="sentTo" start-cooldown />
          </div>
          <p class="pa-3">
            Already have an account?
            <router-link to="/" class="text-decoration-underline"
              >Log in</router-link
            >
          </p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
