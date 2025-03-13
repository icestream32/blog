---
title: 从零开始搭建个人NAS服务器（二）
shortTitle: 软路由安装
isOriginal: true
order: 2
category: 
    - 计算机
tag:
    - 软路由
    - 飞牛OS
    - iStoreOS
---

<!-- more -->

## 前期准备

1. 准备镜像

由于飞牛OS的虚拟机不支持`img`格式，因此我采用的安装方式参考飞牛社区的以下链接（镜像下载地址也在以上这个链接中）：

[fnOS 虚拟 iStoreOS 软路由](https://club.fnnas.com/forum.php?mod=viewthread&tid=12640&highlight=)

2. 设置固定IP

在安装软路由之前，得将电脑与NAS系统直连，确保断网后还能通过电脑远程SSH连接到NAS系统，做法如下：

首先在Web飞牛OS管理界面点击系统设置-网络设置，可以看到当前的网卡名称，我的是`enp1s0`（这个时候额外的网卡还没安装），后面设置固定IP的时候需要用到。

![网卡名称](https://images.icestream32.cn/images/2025/03/13/3bbff8844840bfc2c0d60700588c7082.png)

::: tip
可以看到图片里的网卡名称为`enp1s0-ovs`，这个网卡真实的物理网卡开启了桥接模式形成的网卡，桥接模式之后会介绍。
:::

用HDMI线连接显示器和NAS，输入先前在Web界面设置的用户名和密码，再通过`sudo su`命令切换到root用户（root用户密码与Web界面设置的密码相同）。

由于飞牛OS是基于Debian，因此通过`vim /etc/network/interfaces`命令打开网络配置文件，写入以下内容：

```bash
source /etc/network/interfaces.d/*

auto enp1s0
iface lo inet loopback
allow-hotplug enp1s0
iface enp1s0 inet static
address 192.168.2.155
netmask 255.255.255.0
gateway 192.168.2.1
```

解释一下配置的内容：

- `source /etc/network/interfaces.d/*`：表示读取`/etc/network/interfaces.d`目录下的所有配置文件。
- `auto enp1s0`：表示自动启动`enp1s0`网卡。
- `iface lo inet loopback`：表示本地环回接口。
- `allow-hotplug enp1s0`：表示允许热插拔`enp1s0`网卡。
- `iface enp1s0 inet static`：表示`enp1s0`网卡使用静态IP。
- `address 192.168.2.155`：表示`enp1s0`网卡的IP地址。
- `netmask 255.255.255.0`：表示`enp1s0`网卡的子网掩码。
- `gateway 192.168.2.1`：表示`enp1s0`网卡的网关（这个网关可以随意，我的话是因为我想让软路由的网关为192.168.2.1，对现在直连没有什么影响）。

保存后退出，再通过`sudo systemctl restart networking`命令重启网络服务。

重启的时候SSH断开是正常现象，因为IP变了。

3. 网线直连NAS

将网线的一段连接到电脑，另一端连接到NAS的网口，同时设置打开电脑的网络设置，修改内容如下：

![电脑网络设置](https://images.icestream32.cn/images/2025/03/13/967847f2ae7b6090d689fa8931ae42a0.png)

修改成功之后，通过`ping 192.168.2.155`命令测试是否能ping通，如果能ping通，则说明直连成功。

## 安装iStoreOS

打开电脑浏览器，输入`http://192.168.2.155:5666`，进入飞牛OS的登录界面，点击虚拟机，安装过程大部分同链接里的内容，然后我这里要补充的是：

- 安装前插入先前购买的网卡，此时在网络设置中可以看到两个网卡，一个是自带的网卡，另一个是购买的网卡，让他们俩都开启桥接模式。

- 安装成功后，进入iStoreOS界面（虚拟机命令行界面），输入`vi /etc/config/network`命令，将`interface 'wan'`、`interface 'device'`、`interface 'lan'`修改为以下内容：

```bash
config interface 'wan'
        option device 'eth0'
        option proto 'pppoe'
        option username ''
        option password ''

config device
        option name 'br-lan'
        option type 'bridge'
        list ports 'eth1'

config interface 'lan'
        option device 'br-lan'
        option proto 'static'
        option ipaddr '192.168.2.1'
        option netmask '255.255.255.0'
        option ip6assign '60'
        option defaultroute '0'
```

想要解释一下为什么配置，那就不得不展示一下我的网络拓扑图了：

![网络拓扑图](https://images.icestream32.cn/images/2025/03/13/05fccc2005a509f2e38fee02bccb5ec1.png)

数据链路上，外部网络通过软路由将流量转发到NAS和AP，AP再将流量转发到其他设备。那么问题来了，我们现在手头上只有两个网口，一个连接外部网络，一个连接AP，那么NAS怎么和软路由网关通信呢？

答案就在上面的配置，首先通过飞牛OS网络设置将物理网卡设置成桥接模式，然后通过修改iStoreOS的网络配置，将`lan`口桥接到飞牛OS的`br-lan`口，这样NAS和软路由网关就通信了。

其他配置的说明如下：

- `interface 'wan'`：表示外部网络接口。
- `interface 'device'`：表示桥接设备。
- `interface 'lan'`：表示内部网络接口。
- `option device 'eth0'`：表示物理网卡。
- `option proto 'pppoe'`：表示宽带连接方式。
- `option username ''`：表示宽带账号。
- `option password ''`：表示宽带密码。
- `option name 'br-lan'`：表示桥接设备名称。
- `option type 'bridge'`：表示桥接设备类型。
- `list ports 'eth1'`：表示桥接设备端口。
- `option ipaddr '192.168.2.1'`：表示桥接设备IP地址（这个IP地址和上面设置的网关地址对应）。
- `option netmask '255.255.255.0'`：表示桥接设备子网掩码。

保存后退出，然后输入`reboot -f`命令重启系统。

重启后，在NAS终端界面输入`sudo ping 192.168.2.1`命令，如果能够ping通，则说明软路由现在与NAS处于同一局域网，可以进行下一步了。

```bash
sudo ping 192.168.2.1
[sudo] password for icestream32: 
PING 192.168.2.1 (192.168.2.1) 56(84) bytes of data.
64 bytes from 192.168.2.1: icmp_seq=1 ttl=64 time=0.288 ms
64 bytes from 192.168.2.1: icmp_seq=2 ttl=64 time=0.336 ms
64 bytes from 192.168.2.1: icmp_seq=3 ttl=64 time=0.374 ms
64 bytes from 192.168.2.1: icmp_seq=4 ttl=64 time=0.323 ms
^C
--- 192.168.2.1 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3024ms
rtt min/avg/max/mdev = 0.288/0.330/0.374/0.030 ms
```

::: tip
有一个问题是物理网卡和虚拟网卡的对应关系，一般是从上到下按照顺序来：

假设外部的物理网卡是`enp1s0`、`enp2s0`，那么对应的虚拟网卡就是`eth0`、`eth1`，桥接网卡也同理。

如果这招分辨不出来的话，那么直接让电脑连接到NAS的网线连到另一个网口，直接能够ping通为止。
:::

## 组网

装好软路由后，接下来就是按照拓扑图组网了：

- 外部网络连接到NAS的`wan`口

- NAS的`lan`口连接到路由器的`wan`口

- 使用手机连接路由器的WiFi，进入路由器管理界面，将路由模式改成AP（中继）模式

- 将电脑的网口连接到路由器的`lan`口

最后将电脑的IP地址获取方式改为`DHCP`，若能够获取到IP地址，则组网成功。

## 总结

讲真，由于实际物理连接与理论网络拓扑图差异比较大，所以整个软路由的搭建过程十分地坎坷，但是还在最后还是成功了。

多动手、多动脑、多查阅资料，这就是折腾的乐趣吧。

至此，软路由的安装就完成了，接下来就是配置软路由的各项功能了。













