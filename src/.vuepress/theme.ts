import { hopeTheme } from 'vuepress-theme-hope';

import navbar from './navbar.js';
import sidebar from './sidebar.js';

export default hopeTheme({
    hostname: 'https://www.icestream32.cn',
    author: {
        name: 'ICESTREAM32',
        url: 'https://github.com/icestream32',
    },

    iconAssets: 'fontawesome',

    logo: 'logo.png',

    // repo: 'vuepress-theme-hope/vuepress-theme-hope',

    docsDir: 'src',

    // 导航栏
    navbar,

    // 侧边栏
    sidebar,

    // 页脚
    footer: 'Made by ICESTREAM32 with ❤️',
    license: 'CC BY-NC-SA 4.0',
    displayFooter: true,

    // 博客相关
    blog: {
        description: '一个后端开发者',
        // intro: '/intro.html',
        medias: {
            Email: 'icestream32@163.com',
            Gmail: 'ice1601334224@gmail.com',
            GitHub: 'https://github.com/icestream32',
            QQ: 'https://example.com',
            WeChat: 'https://example.com',
            //   Rss: 'https://example.com',
            VuePressThemeHope: {
                icon: 'https://theme-hope-assets.vuejs.press/logo.svg',
                link: 'https://theme-hope.vuejs.press',
            },
        }
    },

    // 加密配置
    encrypt: {
    },

    // 多语言配置
    metaLocales: {
        editLink: '在 GitHub 上编辑此页',
    },

    // 如果想要实时查看任何改变，启用它。注: 这对更新性能有很大负面影响
    hotReload: true,

    // 在这里配置主题提供的插件
    plugins: {

        // 代码块高亮
        shiki: {
            themes: {
                light: "one-light",
                dark: "one-dark-pro"
            }
        },

        // 水印
        watermark: {
            enabled: false
        },

        copyright: {
            // 复制内容时添加版权信息
            triggerLength: 100
        },

        blog: true,

        components: {
            components: ['Badge', 'VPCard'],
        },

        // 此处开启了很多功能用于演示，你应仅保留用到的功能。
        markdownImage: {
            figure: true,
            lazyload: true,
            size: true,
        },

        // markdownMath: {
        //   // 启用前安装 katex
        //   type: 'katex',
        //   // 或者安装 mathjax-full
        //   type: 'mathjax',
        // },

        markdownTab: true,

        // 此处开启了很多功能用于演示，你应仅保留用到的功能。
        mdEnhance: {
            align: true,
            attrs: true,
            component: true,
            demo: true,
            include: true,
            mark: true,
            plantuml: true,
            spoiler: true,
            stylize: [
                {
                    matcher: 'Recommended',
                    replacer: ({ tag }) => {
                        if (tag === 'em')
                            return {
                                tag: 'Badge',
                                attrs: { type: 'tip' },
                                content: 'Recommended',
                            };
                    },
                },
            ],
            sub: true,
            sup: true,
            tasklist: true,
            vPre: true,
        },

        // 启用代码块高亮
        prismjs: true

        // 如果你需要幻灯片，安装 @vuepress/plugin-revealjs 并取消下方注释
        // revealjs: {
        //   plugins: ['highlight', 'math', 'search', 'notes', 'zoom'],
        // },
    },
}, { custom: true });
