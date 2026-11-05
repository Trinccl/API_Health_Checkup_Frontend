<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { VisSingleContainer, VisDonut, VisTooltip } from "@unovis/vue";
import { Donut } from "@unovis/ts";
import {
  ChartContainer,
  ChartTooltipContent,
  componentToString,
} from "@/components/ui/chart";
import { getApiStats, getDashboardStats } from "@/api.js";

const props = defineProps({
  // Omit to show stats across all of the user's APIs.
  apiId: { type: [String, Number], default: null },
  title: { type: String, default: "Check results" },
});

// Known statuses get a semantic colour; anything else cycles through the
// shadcn chart palette so new backend statuses still render.
const STATUS_COLORS = {
  ERROR: "var(--destructive)",
  DOWN: "var(--destructive)",
  SLOW: "var(--chart-4)",
  OK: "var(--chart-2)",
  UP: "var(--chart-2)",
  SUCCESS: "var(--chart-2)",
  PAUSED: "var(--muted-foreground)",
  UNKNOWN: "var(--border)",
};
const FALLBACK_COLORS = [
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--chart-4)",
  "var(--chart-2)",
];

const isLoading = ref(true);
const error = ref(null);
const stats = ref([]);
const total = ref(0);

let requestId = 0;

async function load() {
  const current = ++requestId; // ignore out-of-order responses
  error.value = null;
  try {
    const res = props.apiId
      ? await getApiStats(props.apiId)
      : await getDashboardStats();
    if (current !== requestId) return;

    stats.value = (res?.stats ?? [])
      .map((s) => ({ status: String(s.status), count: Number(s.count) }))
      .filter((s) => Number.isFinite(s.count) && s.count > 0);

    const backendTotal = Number(res?.total);
    total.value = Number.isFinite(backendTotal)
      ? backendTotal
      : stats.value.reduce((sum, s) => sum + s.count, 0);
  } catch (e) {
    if (current !== requestId) return;
    error.value = e?.message || "Failed to load statistics";
  } finally {
    if (current === requestId) isLoading.value = false;
  }
}

// Used by the parent's auto-refresh: silent (no skeleton flash) re-fetch.
defineExpose({ refresh: load });

onMounted(load);
watch(
  () => props.apiId,
  () => {
    isLoading.value = true;
    load();
  },
);

const items = computed(() =>
  stats.value.map((s, i) => ({
    ...s,
    color: STATUS_COLORS[s.status.toUpperCase()] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  })),
);

// Config in the shape ChartContainer / ChartTooltipContent expect.
const chartConfig = computed(() =>
  Object.fromEntries(
    items.value.map((i) => [i.status, { label: i.status, color: i.color }]),
  ),
);

// componentToString must be created during setup, so give it a stable object
// that we keep in sync with the current statuses.
const tooltipConfig = reactive({});
watch(
  chartConfig,
  (cfg) => {
    for (const k of Object.keys(tooltipConfig)) delete tooltipConfig[k];
    Object.assign(tooltipConfig, cfg);
  },
  { immediate: true },
);
const renderTooltip = componentToString(tooltipConfig, ChartTooltipContent, {
  hideLabel: true,
});
const tooltipTemplate = (arc) =>
  renderTooltip({ [arc.data.status]: arc.data.count });

const value = (d) => d.count;
const color = (d) => d.color;
const triggers = { [Donut.selectors.segment]: tooltipTemplate };

const percent = (count) =>
  total.value ? `${Math.round((count / total.value) * 100)}%` : "0%";
</script>

<template>
  <div class="border rounded-lg bg-transparent p-4">
    <h3 class="text-sm font-medium mb-3">{{ title }}</h3>

    <!-- Loading -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center gap-3 py-2"
      role="status"
      aria-label="Loading statistics"
    >
      <div class="size-[180px] rounded-full border-[28px] border-muted animate-pulse" />
      <div class="h-3 w-32 rounded bg-muted animate-pulse" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error && !items.length"
      class="flex flex-col items-center gap-3 py-8 text-sm"
      role="alert"
    >
      <p class="text-destructive text-center">{{ error }}</p>
      <button
        type="button"
        class="border rounded-md px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        @click="
          isLoading = true;
          load();
        "
      >
        Retry
      </button>
    </div>

    <!-- Empty -->
    <p
      v-else-if="!items.length"
      class="text-muted-foreground text-sm text-center py-8"
    >
      No check results yet.
    </p>

    <!-- Chart -->
    <template v-else>
      <ChartContainer
        :config="chartConfig"
        class="relative mx-auto !aspect-square max-h-[220px]"
      >
        <VisSingleContainer :data="items" :margin="{ top: 4, bottom: 4, left: 4, right: 4 }">
          <VisDonut
            :value="value"
            :color="color"
            :arc-width="28"
            :pad-angle="0.02"
            :corner-radius="3"
          />
          <VisTooltip :triggers="triggers" />
        </VisSingleContainer>

        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        >
          <span class="text-3xl font-bold tabular-nums leading-none">
            {{ total.toLocaleString() }}
          </span>
          <span class="text-muted-foreground text-xs mt-1">Total checks</span>
        </div>
      </ChartContainer>

      <ul class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
        <li v-for="item in items" :key="item.status" class="flex items-center gap-1.5">
          <span
            class="h-2 w-2 shrink-0 rounded-xs"
            :style="{ backgroundColor: item.color }"
          />
          <span class="text-muted-foreground">{{ item.status }}</span>
          <span class="font-mono font-medium tabular-nums">
            {{ item.count.toLocaleString() }}
          </span>
          <span class="text-muted-foreground">({{ percent(item.count) }})</span>
        </li>
      </ul>
    </template>
  </div>
</template>
