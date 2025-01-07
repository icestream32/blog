---
title: Elasticsearch 安装
isOriginal: true
category:
    - 计算机
    - 数据库
tag:
    - Elasticsearch
    - 安装
---

最近接收了一个新需求，说是MySQL数据库的一张表的数据量已经到达了亿级别，而且数量还在不断地增长，MySQL的索引也不能满足查询的性能需求，因此需要将这张表的数据迁移到`Elasticsearch`中，以提高查询性能。刚好趁着这个需求重新了解一下`Elasticsearch`，以及`ELK`技术栈。

<!-- more -->

## 安装

安装采用docker进行部署，版本为当下最新版本`8.17.0`。

1. 创建目录

```bash
mkdir -p ~/elk/es/config
```

2. 创建network

es和kibana需要在同一个网络中，因此需要先创建一个network：

```bash
docker network create elk
```

3. 拉取镜像

```bash
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.17.0
```

4. 启动es

```bash
docker run --name es --net elk -p 9200:9200 -it -m 1GB docker.elastic.co/elasticsearch/elasticsearch:8.17.0
```

解释一下参数：

- `--name es`：容器名为`es`
- `--net elk`：加入`elk`网络
- `-p 9200:9200`：将容器的`9200`端口映射到宿主机的`9200`端口
- `-it`：交互式运行
- `-m 1GB`：限制容器内存为`1GB`

该命令运行之后，命令行窗口会打印 Kibana 的弹性用户密码和注册令牌（8.x之后新增的），如下：

```bash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Elasticsearch security features have been automatically configured!
✅ Authentication is enabled and cluster connections are encrypted.

ℹ️  Password for the elastic user (reset with `bin/elasticsearch-reset-password -u elastic`):
  6RdZuVrsfybmINR52n4*

ℹ️  HTTP CA certificate SHA-256 fingerprint:
  b55796209f7d2aa51ee880844b07cb2045b883b0c33e3545c2556c2ba5c909a7

ℹ️  Configure Kibana to use this cluster:
• Run Kibana and click the configuration link in the terminal when Kibana starts.
• Copy the following enrollment token and paste it into Kibana in your browser (valid for the next 30 minutes):
  eyJ2ZXIiOiI4LjE0LjAiLCJhZHIiOlsiMTcyLjE5LjAuMjo5MjAwIl0sImZnciI6ImI1NTc5NjIwOWY3ZDJhYTUxZWU4ODA4NDRiMDdjYjIwNDViODgzYjBjMzNlMzU0NWMyNTU2YzJiYTVjOTA5YTciLCJrZXkiOiJUWmE4UDVRQkNUZzBPc1JWcGx4SzpCNEJvb0pUOVJxZWpSbmxCcWtlSEpnIn0=

ℹ️ Configure other nodes to join this cluster:
• Copy the following enrollment token and start new Elasticsearch nodes with `bin/elasticsearch --enrollment-token <token>` (valid for the next 30 minutes):
  eyJ2ZXIiOiI4LjE0LjAiLCJhZHIiOlsiMTcyLjE5LjAuMjo5MjAwIl0sImZnciI6ImI1NTc5NjIwOWY3ZDJhYTUxZWU4ODA4NDRiMDdjYjIwNDViODgzYjBjMzNlMzU0NWMyNTU2YzJiYTVjOTA5YTciLCJrZXkiOiJUNWE4UDVRQkNUZzBPc1JWcGx4TDoyTVZvdGI4SVM3Q0J3NWU2SmMtYTlBIn0=

  If you're running in Docker, copy the enrollment token and run:
  `docker run -e "ENROLLMENT_TOKEN=<token>" docker.elastic.co/elasticsearch/elasticsearch:8.17.0`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

::: tip

- 交互式运行的容器，可以通过`Ctrl + P + Q`退出容器，容器不会停止。
- 如果容器已经停止，可以通过`docker start es`重新启动容器。

:::

5. 保存认证信息

- 将es动态密码保存在`~/.bashrc`中：

```bash
echo "export ELASTIC_PASSWORD=6RdZuVrsfybmINR52n4*" >> ~/.bashrc
```

- 将证书文件保存在`~/elk/es/config`中：

```bash
docker cp es:/usr/share/elasticsearch/config/certs/http_ca.crt ~/elk/es/config
```

5. 测试

对 es 进行 REST API 调用，以确保 es 容器正在运行（记得把代理关了）。

```bash
curl --cacert http_ca.crt -u elastic:$ELASTIC_PASSWORD https://localhost:9200
```

输出如下：

```json
{
  "name" : "3e7a37a83ca3",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "9QIfm51RRTaah-QwINcVBg",
  "version" : {
    "number" : "8.17.0",
    "build_flavor" : "default",
    "build_type" : "docker",
    "build_hash" : "2b6a7fed44faa321997703718f07ee0420804b41",
    "build_date" : "2024-12-11T12:08:05.663969764Z",
    "build_snapshot" : false,
    "lucene_version" : "9.12.0",
    "minimum_wire_compatibility_version" : "7.17.0",
    "minimum_index_compatibility_version" : "7.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

至此，Elasticsearch 安装完成。

::: info

参考：[ElasticSearch官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/8.17/docker.html)

:::