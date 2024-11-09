import { defineUserConfig } from 'vuepress';
import { commentPlugin } from '@vuepress/plugin-comment';
import { getDirname, path } from 'vuepress/utils';

import theme from './theme.js';

const __dirname = getDirname(import.meta.url);

export default defineUserConfig({
    base: '/',

    lang: 'zh-CN',
    title: 'ICESTREAM32',
    description: 'ICESTREAM32 的博客',

    theme,

    alias: {
        '@theme-hope/modules/blog/components/BlogHero': path.resolve(
            __dirname,
            './components/BlogHero.vue'
        )
    },
    plugins: [
        commentPlugin({
            provider: 'Giscus',
            repo: 'icestream32/comments',
            repoId: 'R_kgDONMonEA',
            category: 'General',
            categoryId: 'DIC_kwDONMonEM4CkHI5'
        })
    ]

    // 和 PWA 一起启用
    // shouldPrefetch: false,
});
