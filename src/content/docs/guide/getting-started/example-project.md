---
title: 示例项目
description: 克隆 EasyTier-ESP 源码，配置并编译 main/ 示例，以及上电后应看到的现象。
---

源码中的`main/` 是一个示例工程，演示 Wi-Fi 连接、EasyTier 组网、状态打印与一个简单的 HTTP 控制服务。本问文将向你介绍如何跑通该示例项目，以便你自行上手体验 EasyTier-ESP。

## 前置条件

- 已安装 **ESP-IDF 6.1**；
- 一块 ESP32-S3 开发板（推荐 N16R8，开启 PSRAM）；
- 一个可访问的 EasyTier Peer入口（可选；没有入口也能编译，只是组网不会成功）；

## 1. 克隆源码

```bash
# 国内用户可以从腾讯 CNB 克隆源码
# git clone https://cnb.cool/myqfeng/qteasytier/easytier-esp.git
git clone https://github.com/EasyTier/easytier-esp.git

cd easytier-esp
```

## 2. 配置示例

### 2.1. 创建 `main/easytier.toml`

仓库**不包含** `main/easytier.toml`（它含真实入口与密钥，已被 `.gitignore` 忽略）。新建它：

```toml
instance_name = "esp32-example"
hostname = "esp32-example"
dhcp = true

[network_identity]
network_name = "esp-demo"
network_secret = "<YOUR_NETWORK_SECRET>"

[[peer]]
uri = "tcp://192.0.2.10:11010"

[flags]
mtu = 1380
enable_encryption = true
```

- 把 `192.0.2.10:11010` 换成你的入口地址与 TCP 端口；
- 把网络名和密钥换成你的网络；
- 也可以改用静态地址：把 `dhcp = true` 换成 `ipv4 = "10.144.144.10/24"`。
没有这个文件时，示例仍然能编译和运行，但只会连接 Wi-Fi 与启动 HTTP 服务，不会启动 EasyTier。

### 2.2 设置 Wi-Fi

```bash
idf.py menuconfig
```

进入 **EasyTier-ESP 示例**：

- `EXAMPLE_WIFI_SSID`：Wi-Fi 名称；
- `EXAMPLE_WIFI_PASSWORD`：Wi-Fi 密码；
- `EXAMPLE_EASYTIER_TOML_ENABLED`：是否在启动时加载嵌入的 TOML 并组网（默认开启）。

示例的 `sdkconfig.defaults` 已经设置：

```ini
CONFIG_LWIP_MAX_SOCKETS=24
CONFIG_ESP_MAIN_TASK_STACK_SIZE=8192
```

不要把它们改小；否则入口连接或 TOML 解析可能失败。

## 3. 编译与烧录
可以在图形化的 IDE 中直接点击构建按钮进行构建和编译，也可以进入 ESP-IDF 的命令行界面使用以下命令进行构建和编译。

```bash
idf.py set-target esp32s3
idf.py build
```

构建成功后，产物在 `build/` 下。组件源码与示例由同一个工程构建，不需要额外安装组件。接下来进行烧录，可以在图形化界面中点击烧录按钮进行烧录，也可以进入 ESP-IDF 的命令行界面使用以下命令进行烧录。

```bash
idf.py -p /dev/ttyUSB0 flash monitor
```

Windows 把 `/dev/ttyUSB0` 换成 `COMx`。烧录前确认串口、供电和目标芯片。

## 5. 上电观察现象

### 5.1 启动

串口先出现示例启动日志，随后是 Wi-Fi 连接与 IP 获取：

```text
I (...) et_example: EasyTier-ESP example starting
I (...) et_example: got ip: 192.168.1.50
```

### 5.2 组网成功

如果 `main/easytier.toml` 存在且 `EXAMPLE_EASYTIER_TOML_ENABLED` 开启，会看到：

```text
I (...) ET.PROTO: handshake ok, peer=...
I (...) ET.PROTO: network ready: 1 reachable peer(s)
```

以及示例打印的生效配置与状态：

```text
I (...) et_example: config: instance=... hostname=... network=... instance_id=...
I (...) et_example: status: state=ready peer_id=0x... vip=10.144.144.10/24 direct=1 routes=1 dropped=0 err=0x0
```

状态日志每 10 秒打印一次，可以观察 `state`、`vip`、`direct`、`routes`、`dropped` 与 `err` 的变化。

### 5.3 HTTP 演示

示例会启动一个监听 80 端口的 HTTP 服务：

- `http://<设备IP>/`；
- `http://<设备IP>/toggle`。

两个路径都会翻转 **GPIO38** 的电平，并返回一个简单页面。设备 IP 可以是 Wi-Fi 获取的物理 IP，也可以是 EasyTier 的虚拟 IP（组网成功后）。

### 5.4 没有 TOML 时

如果 `main/easytier.toml` 不存在，串口会出现类似提示：

```text
W (...) et_example: main/easytier.toml not found; create it and rebuild
```

此时示例只连接 Wi-Fi、启动 HTTP 服务，不会启动 EasyTier。补上 TOML 后重新 `idf.py build` 即可。

### 5.5 Wi-Fi 断开与重连

- Wi-Fi 断开时，示例会按 `EXAMPLE_WIFI_MAX_RETRY` 重连（0 表示无限重试）；
- 重新取得 IP 后，示例会再次允许组件连接；
- 组网状态可能短暂回到 `waiting-underlay` / `connecting`，恢复后重新变成 `ready`。

## 6. 常见现象

| 现象 | 先看 |
| --- | --- |
| 串口没有 `got ip` | Wi-Fi SSID/密码、信号、路由器 |
| 有 `got ip`，没有 `network ready` | 检查入口地址/端口、网络名与密钥；见 [常见问题 FAQ](/appendix/faq/) |
| 有 `network ready`，ping 不通 | 检查对端路由、防火墙与虚拟网段冲突；见 [常见问题 FAQ](/appendix/faq/) |
| 提示找不到 `easytier.toml` | 创建 `main/easytier.toml` 并重新构建 |
| HTTP 打不开 | 设备 IP、80 端口、物理网段/虚拟网段是否可达 |
| 构建失败 | [兼容性与硬件要求](/guide/getting-started/requirements/) |

## 7. 注意

- 示例用于演示，不是生产固件模板；
- `main/easytier.toml` 含真实密钥，不要提交到仓库；
