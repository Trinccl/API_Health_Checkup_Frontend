<script setup>
import { ref } from "vue";
import CubeLogo from "./components/CubeLogo.vue";

const topmessage = ref("API");
const bottommessage = ref("HP");
const xSpeed = ref(1);
const ySpeed = ref(1);
const appleModeCheck = ref(false);
const widthVal = ref(50);
const repass = ref("");
const errorRegMessage = ref("");
const errorLogMessage = ref("");

import router from "./router.js";

const regForm = ref({
  email: "",
  name: "",
  password: "",
});

const logForm = ref({
  email: "",
  password: "",
});

const submitReg = async () => {
  if (regForm.value.password != repass.value) {
    errorRegMessage.value = "Error: passwords are not matching";
  } else {
    try {
      const response = await fetch("http://localhost:3000/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: regForm.value.name,
          email: regForm.value.email,
          password: regForm.value.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        errorRegMessage.value = "Success: " + JSON.stringify(data);
        regForm.value = {
          email: "",
          name: "",
          password: "",
        };
        repass.value = "";
      } else {
        errorRegMessage.value =
          "Error: " + (data.message || response.statusText);
      }
    } catch (error) {
      errorRegMessage.value = "Error: " + error.message;
    }
  }
  errorRegMessage.value.replace(",", ", ");
};

const submitLogin = async () => {
  try {
    const response = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: logForm.value.password,
        email: logForm.value.email,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      errorLogMessage.value = "Success: " + JSON.stringify(data);
      localStorage.setItem("JWT", data.accessToken);
      router.push("/dashboard");
    } else {
      errorLogMessage.value = "Error: " + (data.message || response.statusText);
    }
  } catch (error) {
    errorLogMessage.value = "Error: " + error.message;
  }
};
</script>

<template>
  <v-container fluid class="pa-4">
    <v-row cols="12">
      <v-col md="6" class="border-thin rounded">
        <div class="pa-4 border-b-thin">
          <h2>Login</h2>
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
              Submit
            </v-btn>
          </v-form>
          <h3 v-if="errorLogMessage">{{ errorLogMessage }}</h3>
        </div>

        <div class="pa-4">
          <h2>Register</h2>
          <hr />
          <v-form @submit.prevent="submitReg" class="pa-3 w-100 mt-3">
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
              Submit
            </v-btn>
          </v-form>
          <h3 v-if="errorRegMessage">{{ errorRegMessage }}</h3>
        </div>
      </v-col>

      <v-col md="6">
        <div class="pa-4">
          <h3>About</h3>
          <p>
            Cron based URL/api health check. Add urls, schedule checks, display
            stats in dashboard, send alerts if conditions met.
          </p>
          <v-btn @click="localStorage.clear()">Clear localStorage (TBD)</v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
