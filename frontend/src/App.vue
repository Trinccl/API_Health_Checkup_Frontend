<script setup>
import { ref } from "vue";
import CubeLogo from "./components/CubeLogo.vue";

const topmessage = ref("");
const xSpeed = ref(0);
const ySpeed = ref(0);
const appleModeCheck = ref(false);
const widthVal = ref(50);
</script>

<template>
  <CubeLogo
    :topText="topmessage"
    :rxSpeed="xSpeed"
    :rySpeed="ySpeed"
    :appleMode="appleModeCheck"
    :width="widthVal"
  />
  <input v-model="topmessage" placeholder="top message" />
  <label
    >speed x<input type="range" v-model="xSpeed" min="0" max="50" step="0.1"
  /></label>
  <label
    >speed y<input type="range" v-model="ySpeed" min="0" max="50" step="0.1"
  /></label>
  <label for="checkbox"
    >Applemode<input type="checkbox" id="checkbox" v-model="appleModeCheck"
  /></label>
  <label
    >width<input type="range" v-model="widthVal" min="0" max="250" step="0.1"
  /></label>
</template>
