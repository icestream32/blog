---
title: Kibana 安装
isOriginal: true
order: 3
category:
    - 计算机
    - GUI
tag:
    - Kibana
    - 安装
---

Kibana 是一个开源的数据可视化工具，用于搜索、查看、分析和交互存储在 Elasticsearch 索引中的数据。

<!-- more -->

## 安装

安装采用docker进行部署，版本为当下最新版本`8.17.0`。

1. 创建目录

```bash
mkdir -p ~/elk/kibana/config
```

2. 拉取镜像

```bash
docker pull docker.elastic.co/kibana/kibana:8.17.0
```

3. 启动kibana

```bash
docker run --name kibana --net elk -p 5601:5601 docker.elastic.co/kibana/kibana:8.17.0
```

当 kibana 启动时，它会向终端输出一个生成的唯一链接。要访问 Kibana，请在 Web 浏览器中打开此链接，例如：`http://0.0.0.0:5601/?code=763574`

::: tip

如果令牌过期，那么请重新运行：

```bash
docker exec -it es /usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token -s kibana
```

:::

## 配置

访问[链接](http://0.0.0.0:5601/?code=763574)后，会看到如下界面：

![image-20250107215435284](https://images.icestream32.cn/images/2025/01/07/image-20250107215435284.png)

将获得到的token粘贴到输入框中，kibana就会开始进行初始化操作，成功之后进入到以下界面：

![image-20250107215713804](https://images.icestream32.cn/images/2025/01/07/image-20250107215713804.png)

此时输入前面得到的账号和密码，即可进入到kibana的主界面，至此kibana安装完成。



::: info

参考：[ElasticSearch官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/8.17/docker.html)

:::