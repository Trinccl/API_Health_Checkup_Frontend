<script setup>
import { ref, provide, reactive } from "vue";
import { useRouter } from "vue-router";
import CubeLogo from "./components/CubeLogo.vue";
import { isLoggedIn, logout } from "./api.js";

const router = useRouter();

const topmessage = ref("API");
const bottommessage = ref("HP");
const xSpeed = ref(1);
const ySpeed = ref(1);
const appleModeCheck = ref(false);
const widthVal = ref(50);

const state = reactive({
  show: false,
  text: "",
  color: "",
  icon: "",
});

function notify(text, color, icon) {
  state.text = text;
  state.color = color;
  state.show = true;
  state.icon = icon;
}

provide("notify", notify);

function handleLogout() {
  logout();
  notify("Logged out", "success", "mdi-logout");
  router.push("/");
}
</script>

<template>
  <v-app class="pa-0 ma-0">
    <v-main class="pa-0 ma-0 d-flex flex-column">
      <v-snackbar
        :color="state.color"
        location="bottom"
        :prepend-icon="state.icon"
        :text="state.text"
        contained
        v-model="state.show"
        timeout="5000"
      >
        <template v-slot:actions>
          <v-btn variant="text" @click="state.show = false" rounded> OK </v-btn>
        </template>
      </v-snackbar>

      <nav
        class="d-flex justify-start align-center ma-3 border-b-thin"
        v-if="$route.path != '/' && $route.path != '/register'"
      >
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
        <h1 class="text-headline-large pa-3 font-weight-bold">
          <a href="/"> API Health Checkup </a>
        </h1>

        <v-spacer />

        <v-btn
          color="primary"
          variant="text"
          class="mr-3"
          :to="`/dashboard`"
        >
          Dashboard
        </v-btn>
        <v-btn
          color="primary"
          variant="text"
          class="mr-3"
          :to="`/dashboard/create`"
        >
          Add API
        </v-btn>
        <v-btn
          v-if="isLoggedIn"
          variant="text"
          prepend-icon="mdi-logout"
          class="mr-3"
          @click="handleLogout"
        >
          Logout
        </v-btn>
      </nav>
      <RouterView />
    </v-main>
  </v-app>
</template>
