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
});

const x = (_, i) => i;
const y = (d) => Number(d.responseTimeMs);
const colors = ["teal"];

const template = (d) =>
  `<pre style="background-color:teal; padding:5px; color:white; border-radius:5px;">Check date: ${d.createdAt}\nResponse Time: ${Math.round(d.responseTimeMs * 100) / 100}ms\nStatus: ${d.status}</pre>`;
</script>

<template>
  <ChartContainer :config="props.config" cursor v-if="data.length >= 2">
    <VisXYContainer :data="props.data">
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
        :tick-format="(d) => ''"
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
