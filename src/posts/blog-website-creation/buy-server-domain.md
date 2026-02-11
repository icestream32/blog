---
title: 选购云服务器与域名
index: true
isOriginal: true
order: 1
cover: https://images.icestream32.cn/images/2024/11/09/8544268_p0_master1200.jpg
category:
    - 计算机
    - 建站流程
tag:
    - 云服务器
    - 域名
    - 阿里云
---

<!-- more -->

## 阿里云轻量级服务器

云服务器选择的话一般我会选择[阿里云](https://aliyun.com)的轻量级服务器，不过即便是轻量级服务器费用还是挺贵的，因此在我这里它的作用就是提供公网 IP+Nginx 反代，下面是我选择的轻量级服务器的一种类型。链接与配置选择如下：

链接：[阿里云轻量级云服务器选购页面](https://common-buy.aliyun.com/?commodityCode=swas&regionId=cn-hongkong)

![image-20241109164649795](https://images.icestream32.cn/images/2024/11/09/image-20241109164649795.png)

> 注意：
>
> - 学生的话可以貌似可以有一个 300 券大学认证可以白嫖，还有 30 块钱一年的试用（国内服务器）
> - 选择中国地区的中国香港为服务器的话就不需要向国家工信部进行网站备案（备案这个还是有点麻烦的）
> - 24 元/月的套餐需要每天准时 0 点抢，不然抢不到

## 选购域名

建站那必须拥有一个自己的域名啊！通过以下链接，选购一个适合自己的一个域名。

链接：[阿里云域名选购页面](https://wanwang.aliyun.com/domain?spm=5176.21213303.J_qCOwPWspKEuWcmp8qiZNQ.2.72792f3dwo8ZuH&scm=20140722.S_card@@%E4%BA%A7%E5%93%81@@3417315._.ID_card@@%E4%BA%A7%E5%93%81@@3417315-RL_%E5%9F%9F%E5%90%8D-LOC_search~UND~card~UND~item-OR_ser-V_4-RE_cardNew-P0_0)

付款之后回到控制台，点击控制台

![image-20241114181224679](https://images.icestream32.cn/images/2024/11/14/image-20241114181224679.png)

然后在资源概览那里选择域名，左侧侧边栏会出现一个域名列表，点击刚刚购买的域名，进入域名管理页面

![image-20241114181542377](https://images.icestream32.cn/images/2024/11/14/image-20241114181542377.png)

接着点击左侧域名列表，中间则跳转到所拥有的域名列表，点击列表的解析按键，进入域名解析页面

![image-20241114181820721](https://images.icestream32.cn/images/2024/11/14/image-20241114181820721.png)

这里需要将域名和选购的轻量级服务器关联上，在域名解析界面选择添加记录，前缀一般都是`www`，地址为云服务器的 IP 地址。

![image-20241114182207929](https://images.icestream32.cn/images/2024/11/14/image-20241114182207929.png)

如此以来，云服务器和域名就选购完成了，如果是第一次接触的话总花费预计不到 70，接下来将配置远程连接与 Nginx。

::: info

封面来源：[Pixiv](https://pixiv.net/artworks/8544268)

:::
