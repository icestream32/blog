<!-- .vuepress/components/BlogHero.vue -->
<script setup lang="ts">
import BlogHero from "vuepress-theme-hope/blog/components/BlogHero.js";
import HitokotoBlogHero from "vuepress-theme-hope/presets/HitokotoBlogHero.js";
import BingHeroBackground from "vuepress-theme-hope/presets/BingHeroBackground.js";
</script>

<template>
    <BlogHero>
        <template #info="info">
            <HitokotoBlogHero v-bind="info" />
        </template>
        <template #bg>
            <BingHeroBackground />
        </template>
    </BlogHero>
</template>