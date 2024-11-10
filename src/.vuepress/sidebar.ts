import { sidebar } from 'vuepress-theme-hope';

export default sidebar({
    // 主页
    '/': [
        {
            text: '首页',
            icon: 'home',
            prefix: '/',
            children: 'structure'
        }
    ],
    // 分类页面
    '/category': 'structure',
    // 标签页面
    '/tag': 'structure',
    // 博客文章页面
    '/posts/': 'structure'
});
