<script setup>
import { computed } from "vue";
import { VisXYContainer, VisArea, VisLine, VisAxis } from "@unovis/vue";
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartLegendContent,
} from "@/components/ui/chart";

const props = defineProps({
  data: { type: Array, required: true },
  index: { type: String, required: true },
  categories: { type: Array, required: true },
  config: { type: Object, required: true },
  showYAxis: { type: Boolean, default: false },
  yLabel: { type: String, default: "" },
});

const x = (_, i) => i;
const y = (d) => Number(d.responseTimeMs);
const colors = ["teal"];

const template = (d) =>
  `<pre style="background-color:teal; padding:5px; color:white; border-radius:5px;">Check date: ${d.createdAt}\nResponse Time: ${Math.round(d.responseTimeMs * 100) / 100}ms\nStatus: ${d.status}</pre>`;

function niceStep(raw) {
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / pow;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * pow;
}

const dataMax = computed(() =>
  Math.max(...props.data.map((d) => Number(d.responseTimeMs)), 0),
);

const yStep = computed(() => niceStep(dataMax.value / 4));
const yMax = computed(
  () => Math.ceil(dataMax.value / yStep.value) * yStep.value || yStep.value,
);
const yTicks = computed(() =>
  Array.from(
    { length: Math.round(yMax.value / yStep.value) + 1 },
    (_, i) => i * yStep.value,
  ),
);
</script>

<template>
  <ChartContainer :config="props.config" cursor v-if="data.length >= 2">
    <VisXYContainer
      :data="props.data"
      :y-domain="[0, yMax]"
      :padding="{ top: 12 }"
    >
      <template v-for="(c, i) in props.categories" :key="c">
        <VisArea :x="x" :y="y" :color="colors[i]" :opacity="0.25" />
        <VisLine :x="x" :y="y" :color="colors[i]" />
      </template>
      <VisAxis
        type="x"
        :x="x"
        :tick-format="() => ''"
        :tick-line="false"
        :num-ticks="data.length"
        :grid-line="false"
      />
      <VisAxis
        type="y"
        :y="y"
        :tick-values="yTicks"
        :tick-format="showYAxis ? (d) => `${d}ms` : () => ''"
        :label="showYAxis ? yLabel : undefined"
        :tick-line="false"
        :domain-line="false"
        :grid-line="true"
      />
      <ChartTooltip />
      <ChartCrosshair :x="x" :y="y" :template="template" :color="colors[0]" />
    </VisXYContainer>
    <ChartLegendContent />
  </ChartContainer>
</template>
