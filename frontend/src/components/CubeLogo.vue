<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    frontText: { type: String, default: '' },
    backText: { type: String, default: '' },
    rightText: { type: String, default: '' },
    leftText: { type: String, default: '' },
    topText: { type: String, default: '' },
    bottomText: { type: String, default: '' },
    rxSpeed: { type: Number, default: 1 },
    rySpeed: { type: Number, default: 1.5 },
    appleMode: { type: Boolean, default: false },
    width: { type: Number, default: 150 }
})

const rx = ref(0)
const ry = ref(0)
let animationId = null
let lastTime = null

function animate(currentTime) {
    if (!lastTime) lastTime = currentTime
    const deltaTime = (currentTime - lastTime) / 1000
    lastTime = currentTime

    rx.value = (rx.value + props.rxSpeed * deltaTime * 60) % 360
    ry.value = (ry.value + props.rySpeed * deltaTime * 60) % 360

    animationId = requestAnimationFrame(animate)
}

onMounted(() => {
    animationId = requestAnimationFrame(animate)
})

onUnmounted(() => {
    if (animationId) cancelAnimationFrame(animationId)
})

// Main cube style (includes width and height so CSS doesn't break)
const cubeStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.width}px`,
    transform: `rotateX(${rx.value}deg) rotateY(${ry.value}deg)`
}))

// Half width calculation for 3D depth
const half = computed(() => props.width / 2)

// Fixed computed properties with correct return statements and props.width
const frontStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.width}px`,
    transform: `translateZ(${half.value}px)`
}))

const backStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.width}px`,
    transform: `rotateY(180deg) translateZ(${half.value}px)`
}))

const rightStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.width}px`,
    transform: `rotateY(90deg) translateZ(${half.value}px)`
}))

const leftStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.width}px`,
    transform: `rotateY(-90deg) translateZ(${half.value}px)`
}))

const topStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.width}px`,
    transform: `rotateX(90deg) translateZ(${half.value}px)`
}))

const bottomStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.width}px`,
    transform: `rotateX(-90deg) translateZ(${half.value}px)`
}))
</script>

<template>
    <div class="scene">
        <div class="cube" :style="cubeStyle">
            <div class="face front" :style="frontStyle">{{ frontText }}
                <!-- Added colons for :width and :height -->
                <img v-if="appleMode" src="../../image.png" alt="" :width="width" :height="width">
            </div>
            <div class="face back" :style="backStyle">{{ backText }}
                <img v-if="appleMode" src="../../image.png" alt="" :width="width" :height="width">
            </div>
            <div class="face right" :style="rightStyle">{{ rightText }}
                <img v-if="appleMode" src="../../image.png" alt="" :width="width" :height="width">
            </div>
            <div class="face left" :style="leftStyle">{{ leftText }}
                <img v-if="appleMode" src="../../image.png" alt="" :width="width" :height="width">
            </div>
            <div class="face top" :style="topStyle">{{ topText }}
                <img v-if="appleMode" src="../../image.png" alt="" :width="width" :height="width">
            </div>
            <div class="face bottom" :style="bottomStyle">{{ bottomText }}
                <img v-if="appleMode" src="../../image.png" alt="" :width="width" :height="width">
            </div>
        </div>
    </div>
</template>

<style scoped>
.scene {
    perspective: 800px;
    width: 200px;
    height: 200px;
    margin: 100px auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.cube {
    position: relative;
    transform-style: preserve-3d;
}

.face {
    position: absolute;
    background: #766767;
    border: 2px solid #fff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 1.1rem;
    font-weight: bold;
    color: white;
    border-radius: 5px;
    backface-visibility: visible;
}
</style>