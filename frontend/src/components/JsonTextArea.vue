<script setup>
import { computed } from "vue";
import { Codemirror } from "vue-codemirror";
import { json } from "@codemirror/lang-json";
import { basicSetup, EditorView } from "codemirror";

defineProps({
  label: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
});

const model = defineModel({ type: String, default: "" });

const extensions = [basicSetup, json()];

function format() {
  model.value = JSON.stringify(JSON.parse(model.value), null, 2);
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-1">
      <p class="text-body-2 flex-grow-1">{{ label }}</p>
    </div>

    <div
      class="json-field border-thin rounded overflow-hidden"
      :class="{ 'json-field--disabled': disabled }"
    >
      <Codemirror
        v-model="model"
        :placeholder="placeholder"
        :extensions="extensions"
        :disabled="disabled"
        :indent-with-tab="true"
        :tab-size="2"
      />
    </div>
  </div>
</template>

<style scoped>
.json-field:focus-within {
  border-color: rgb(var(--v-theme-primary)) !important;
}
.json-field--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
