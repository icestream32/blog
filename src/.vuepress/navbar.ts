import { navbar } from 'vuepress-theme-hope';

export default navbar([
    '/',
    {
        text: '博客文章',
        icon: 'book',
        link: '/posts/README.md'
    },
    {
        text: '读书笔记',
        icon: 'fa-solid fa-pencil',
        link: '/notes/README.md'
    },
    {
        text: '音乐',
        icon: 'music',
        link: '/music/README.md'
    }
    // {
    //     text: 'V2 文档',
    //     icon: 'book',
    //     link: 'https://theme-hope.vuejs.press/zh/',
    // },
]);
