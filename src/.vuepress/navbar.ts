import { navbar } from 'vuepress-theme-hope';

export default navbar([
    '/',
    {
        text: '博客文章',
        icon: 'book',
        prefix: '/posts/',
        children: [
            {
                text: '建站教程',
                link: 'blog-website-creation/'
            },
            {
                text: '杂项',
                link: 'commons/'
            }
        ]
    },
    {
        text: '读书笔记',
        icon: 'fa-solid fa-pencil',
        prefix: 'notes/',
        children: [
            {
                text: '大话设计模式',
                link: 'design-patterns/',
            },
            {
                text: '深入理解Go并发编程',
                link: 'concurrency-in-go/',
            }           
        ],
    }
    // {
    //     text: 'V2 文档',
    //     icon: 'book',
    //     link: 'https://theme-hope.vuejs.press/zh/',
    // },
]);
