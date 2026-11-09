<script setup>
import { newHeaderRow } from "../api.js";

const rows = defineModel({ type: Array, default: () => [] });

function addRow() {
  rows.value = [...rows.value, newHeaderRow()];
}

function removeRow(id) {
  rows.value = rows.value.filter((row) => row.id !== id);
}
</script>

<template>
  <div>
    <div v-for="row in rows" :key="row.id" class="d-flex align-start ga-2 mb-2">
      <v-text-field
        v-model="row.name"
        label="Header name"
        placeholder="ex. Authorization"
        variant="outlined"
        density="comfortable"
        hide-details
        autocomplete="off"
        class="w-33"
      />
      <v-text-field
        v-model="row.value"
        label="Value"
        placeholder="ex. Bearer abc123"
        variant="outlined"
        density="comfortable"
        hide-details
        autocomplete="off"
        class="flex-grow-1"
      />
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        class="mt-2"
        aria-label="Remove header"
        @click="removeRow(row.id)"
      />
    </div>

    <v-btn
      size="small"
      variant="tonal"
      prepend-icon="mdi-plus"
      class="ms-2"
      @click="addRow"
    >
      Add header
    </v-btn>
  </div>
</template>
