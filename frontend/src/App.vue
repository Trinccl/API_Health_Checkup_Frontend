<script setup>
import { ref, provide, reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import CubeLogo from "./components/CubeLogo.vue";
import { isLoggedIn, logout, checkToken } from "./api.js";

const router = useRouter();
const route = useRoute();

const confirmDelete = ref(false);
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
        <v-menu open-on-hover v-if="isJwt">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props"> ... </v-btn>
          </template>

          <v-list>
            <v-list-item
              v-if="isJwt"
              variant="text"
              prepend-icon="mdi-logout"
              @click="handleLogout"
              class="ms-2 me-2"
            >
              Logout
            </v-list-item>
            <v-list-item
              v-if="isJwt"
              variant="text"
              prepend-icon="mdi-account-remove"
              @click="confirmDelete = true"
              class="ms-2 me-2"
            >
              Delete user
            </v-list-item>
          </v-list>
        </v-menu>
      </nav>
      <RouterView class="flex-grow-1" />
      <footer
        class="d-flex align-center justify-center flex-wrap flex-grow-0 pa-5 border-t-thin"
      >
        Api health check app made by Adam and Tomek
      </footer>

      <v-dialog v-model="confirmDelete" max-width="400">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span class="flex-grow-1">Confirm account deletion?</span>
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              aria-label="Close"
              @click="confirmDelete = false"
            />
          </v-card-title>
          <v-divider />
          <v-card-text class="d-flex w-100">
            <v-btn>Yes</v-btn>
            <v-btn>No</v-btn>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>
