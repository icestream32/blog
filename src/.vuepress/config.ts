import { defineUserConfig } from 'vuepress';
import { getDirname, path } from 'vuepress/utils';
import { viteBundler } from '@vuepress/bundler-vite';

import theme from './theme.js';

const __dirname = getDirname(import.meta.url);

// 为 SSR 环境提供 navigator mock
if (typeof globalThis.navigator === 'undefined') {
    globalThis.navigator = {
        platform: 'Linux',
        userAgent: 'SSR',
    } as Navigator;
}

export default defineUserConfig({
    base: '/',

    lang: 'zh-CN',
    title: 'ICESTREAM32',
    description: 'ICESTREAM32 的博客',

    theme,

    bundler: viteBundler({
        viteOptions: {
            ssr: {
                noExternal: ['@vuepress/plugin-docsearch'],
            },
        },
    }),

    alias: {
        '@theme-hope/modules/blog/components/BlogHero': path.resolve(
            __dirname,
            './components/BlogHero.vue'
        )
    },

    // 和 PWA 一起启用
    // shouldPrefetch: false,
});
