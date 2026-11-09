<script setup>
import { computed } from "vue";

const props = defineProps({
  value: { type: String, default: null },
});

const text = computed(() => {
  if (!props.value) return null;
  try {
    return JSON.stringify(JSON.parse(props.value), null, 2);
  } catch {
    return props.value;
  }
});
</script>

<template>
  <pre
    v-if="text"
    class="body-preview border-thin rounded pa-3 overflow-auto"
    >{{ text }}</pre
  >
  <span v-else class="text-medium-emphasis">none</span>
</template>

<style scoped>
.body-preview {
  max-height: 240px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.85rem;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}
</style>
