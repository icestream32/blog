---
title: 配置远程连接与Nginx
index: true
order: 2
cover: https://images.icestream32.cn/images/2024/11/09/92607177_p0_master1200.jpg
category:
    - 计算机
    - 建站流程
tag:
    - Nginx
    - 域名
    - Acme.sh
---

在这里一章里我们要做到以下几件事：

- 配置远程连接

- 配置 Nginx

- 配置 HTTPS 访问

<!-- more -->

## 配置远程连接

### 生成 SSH 密钥对

首先我们要生成 SSH 密钥对，这样我们就可以在本地连接服务器了。在本地终端输入以下命令：

```bash
ssh-kengen
```

一路回车即可，生成的密钥对会存放在`~/.ssh/`目录下，其中`id_ed25519`为私钥，`id_ed25519.pub`为公钥。

> 注意：windows 系统密钥在`C:\Users\用户名\.ssh\`目录下

### 上传公钥

登录阿里云轻量服务器界面，点击远程连接页面中的去连接，通过一键连接按钮进入网页终端页面。

![image-20241117183223087](https://images.icestream32.cn/images/2024/11/17/image-20241117183223087.png)

在网页终端中输入以下命令：

```bash
sudo su # 切换到 root 用户
mkdir ~/.ssh # 创建.ssh目录
vim ~/.ssh/authorized_keys # 编辑 authorized_keys 文件
```

将本地生成的公钥`id_ed25519.pub`的内容复制到`authorized_keys`文件中，保存并退出。

可以在本地使用以下命令测试是否连接成功：

```bash
ssh root@服务器域名 -p 22 -i ~/.ssh/id_ed25519
```

### 本地连接云服务器

这里需要用到 SSH 客户端，这里我用的是`WindTerm`, 可以在[Github 仓库](https://github.com/kingToolbox/WindTerm/releases)下载。

在 WindTerm 会话中添加一个新的会话，输入服务器的 IP 地址、端口号、用户名、私钥路径，点击连接即可。

![image-20241117184449390](https://images.icestream32.cn/images/2024/11/17/image-20241117184449390.png)

> 注意：之后的操作都在 WindTerm 会话中进行。

## Nginx

### 安装

安装过程就不再赘述，详情请参考[官方文档](https://nginx.org/en/docs/)。

### 配置

前期 Nginx 配置主要是把服务器名称设置成服务器域名，配置如下：

::: details 点击查看配置文件

```nginx
server {
    listen       80; # 监听80端口
    server_name  localhost; # 服务器域名

    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html; # 要展示的博客文件目录
        index  index.html index.htm; # 博客文件索引
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

:::

配置文件所在的目录一般为`/etc/nginx/conf.d/`，可以通过`cp`命令将默认的文件拷贝一份，然后在此基础上修改即可。

### 测试

配置完成后，可以通过以下命令测试配置文件是否正确：

```bash
nginx -t
```

输出如下：

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

如果没有报错，可以通过以下命令重启 Nginx 服务：

```bash
systemctl reload nginx
```

接着在浏览器中输入服务器域名，如果能够出现以下内容则说明配置成功。

![image-20241117185154257](https://images.icestream32.cn/images/2024/11/17/image-20241117185154257.png)

## 配置 HTTPS 访问

一般来说，申请 SSL 证书可以通过阿里云的 SSL 证书服务，不过这里我选择使用[Acme.sh](https://github.com/acmesh-official/acme.sh)来申请免费的 SSL 证书。

SSL 如果是付费证书的话，一般是需要备案的，而免费的 SSL 证书则不需要备案。

Acme.sh 在支持免费申请证书的同时还可以自动续期，非常方便。

### 安装 Acme.sh

一行命令即可

```bash
curl https://get.acme.sh | sh -s email=my@example.com
```

### 生成证书

由于我们在之前已经配置好域名解析和 Nginx，因此可以直接生成证书。

```bash
acme.sh --issue -d 你的域名 --nginx
```

### 安装证书

生成证书之后还不能直接用，需要使用以下命令将证书安装到指定为止，这里我推荐安装到`/etc/nginx/ssl`目录下。

> 注意：ssl 目录需要提前创建

```bash
acme.sh --install-cert -d 你的域名 \
--key-file       /etc/nginx/ssl/key.pem  \
--fullchain-file /etc/nginx/ssl/cert.pem \
--reloadcmd     "service nginx force-reload"
```

### 配置 Nginx 证书

生成证书之后，Nginx 配置就可以修改了，修改如下：

::: details 点击查看配置文件

```nginx
# HTTP 转 HTTPS
server {
    listen 80;
    server_name 你的域名;

    return 301 https://$host$request_uri;
}

server {
    listen       443 ssl;
    server_name  你的域名;

    #access_log  /var/log/nginx/host.access.log  main;

    ssl_certificate /etc/nginx/ssl/cert.pem; # 证书路径
    ssl_certificate_key /etc/nginx/ssl/key.pem; # 私钥路径

    location / {
        root   /usr/share/nginx/html; # 要展示的博客文件目录
        index  index.html index.htm; # 博客文件索引
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

:::

接着重新进行配置文件测试和重启 Nginx 服务即可，此时再去浏览器刷新发现已经是 HTTPS 访问了。

前期的工作已经准备好了，接下来就是正式的博客网站搭建了。

::: info

封面来源：[Pixiv](https://pixiv.net/artworks/92607177) <br>

文档参考：

- [Nginx](https://nginx.org/en/docs/)
- [Acme.sh](https://github.com/acmesh-official/acme.sh/wiki/%E8%AF%B4%E6%98%8E)

:::
