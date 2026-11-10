<script setup>
import { ref, provide, reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import CubeLogo from "./components/CubeLogo.vue";
import { isLoggedIn, logout, checkToken } from "./api.js";

const router = useRouter();
const route = useRoute();

const topmessage = ref("API");
const bottommessage = ref("HP");
const xSpeed = ref(1);
const ySpeed = ref(1);
const appleModeCheck = ref(false);
const widthVal = ref(50);
const isJwt = ref(false);
const isLoading = ref(true);

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

async function checkif() {
  isLoading.value = true;
  try {
    isJwt.value = await checkToken();
  } catch (error) {
    isJwt.value = false;
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => route.fullPath,
  (newRoute, oldRoute) => {
    checkif();
  },
);

onMounted(checkif);
</script>

<template>
  <v-app class="pa-0 ma-0">
    <v-container
      fluid
      class="pa-4 d-flex align-center justify-center"
      v-if="isLoading"
    >
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-container>
    <v-main class="pa-0 ma-0 d-flex flex-column" v-else-if="!isLoading">
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
          v-if="isJwt"
        >
          Dashboard
        </v-btn>
        <v-btn
          color="primary"
          variant="text"
          class="mr-3"
          :to="`/dashboard/create`"
          v-if="isJwt"
        >
          Add API
        </v-btn>
        <v-btn
          v-if="isJwt"
          variant="text"
          prepend-icon="mdi-logout"
          class="mr-3"
          @click="handleLogout"
        >
          Logout
        </v-btn>
      </nav>
      <RouterView class="flex-grow-1" />
      <footer
        class="d-flex align-center justify-center flex-wrap flex-grow-0 pa-5 border-t-thin"
      >
        Api health check app made by Adam and Tomek
      </footer>
    </v-main>
  </v-app>
</template>
