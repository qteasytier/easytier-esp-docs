---
title: 配置与 Kconfig 速查
description: 一页纸的 TOML 示例、Kconfig 默认值与常用命令。
---

## 最小 TOML

```toml
instance_name = "esp32-s3"
hostname = "esp32-s3"
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

## 字段速查

| 字段 | 类型 | 缺省 |
| --- | --- | --- |
| `instance_name` | string | hostname |
| `hostname` | string | `Espressif` |
| `instance_id` | string | UUID v4 |
| `ipv4` | string | 未配置 |
| `dhcp` | bool/string | false |
| `network_identity.network_name` | string | `default`（表存在时必填） |
| `network_identity.network_secret` | string | 空 |
| `peer[].uri` | string | 必填，`tcp://host:port` |
| `flags.mtu` | int | 1380 |
| `flags.enable_encryption` | bool | true |

## Kconfig 默认值

| 选项 | 默认 |
| --- | --- |
| 日志等级 | Info |
| 同时连接入口 | 6（1..8） |
| RPC 事务 | 4（1..16） |
| RPC 重组槽 | 2（1..8） |
| 网络收发栈 / 优先级 | 6144 / 7 |
| 控制面栈 / 优先级 | 10240 / 5 |
| 数据面栈 / 优先级 | 8192 / 7 |
| rx_ctrl / tx / rx_data 队列 | 8 / 8 / 8 |
| small / netif 队列 | 8 / 16 |

## 常用命令

```bash
idf.py menuconfig
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor
idf.py -DEASYTIER_STACK_USAGE=ON build
python3 tools/check_stack_usage.py
```

## 状态

`Uninitialized` → `Stopped` → `WaitingUnderlay` → `Connecting` → `Handshaking` → `Syncing` → `Ready`

`disconnect()` → `WaitingUnderlay`；`stop()` → `Stopping` → `Stopped`；错误 → `Error`。

## 事件

`Started`、`PeerUp`、`NetworkReady`、`PeerDown`（预留）、`Error`、`Stopped`。

## 关键限制

- 仅 TCP 客户端，不监听；
- 无 Noise/KCP/QUIC/UDP/子网代理/广播；
- 入口不支持 IPv6；
- 拓扑最多 32 节点；
- 转发超过 7 跳丢弃；
- `ipv4` 内容非法时静默忽略。
