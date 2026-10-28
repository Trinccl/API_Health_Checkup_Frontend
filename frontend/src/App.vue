<script setup>
import { ref } from "vue";
import CubeLogo from "./components/CubeLogo.vue";

const topmessage = ref("API");
const bottommessage = ref("HP");
const xSpeed = ref(1);
const ySpeed = ref(1);
const appleModeCheck = ref(false);
const widthVal = ref(50);
</script>

<template>
  <v-app class="pa-0 ma-0">
    <v-main class="pa-0 ma-0">
      <nav class="d-flex justify-start align-center ma-3 border-b-thin">
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
          API Health Checkup
        </h1>
      </nav>
      <RouterView />
    </v-main>
  </v-app>
</template>
