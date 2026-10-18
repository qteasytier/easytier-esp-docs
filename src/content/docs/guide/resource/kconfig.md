---
title: Kconfig 选项总览
description: 日志、连接数、任务栈、优先级与队列深度的默认值、范围和影响。
---

所有选项位于 `idf.py menuconfig` → **EasyTier-ESP**。默认值按 ESP32-S3 上的实测余量选取；没有特殊需求时保持默认即可。

## 日志

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `EASYTIER_ESP_LOG_LEVEL` | `Info` | `Closed` / `Error` / `Warning` / `Info` / `Debug`；低于所选等级的日志编译期裁剪 |

排查问题时用 `Info`，生产固件可用 `Warning` 或 `Error`。

## 连接与 RPC

| 选项 | 默认 | 范围 | 影响 |
| --- | --- | --- | --- |
| `EASYTIER_ESP_MAX_CONNECTED_PEERS` | 6 | 1..8 | 同时连接的入口数；每槽约 12 KiB |
| `EASYTIER_ESP_RPC_MAX_TRANSACTIONS` | 4 | 1..16 | 并发 RPC 事务数 |
| `EASYTIER_ESP_RPC_REASSEMBLY_SLOTS` | 2 | 1..8 | RPC 分片重组槽 |

> 配置里的入口条目数**没有上限**；只有同时连接数受 `MAX_CONNECTED_PEERS` 限制，超出部分作为轮换备用。

## 任务栈

| 选项 | 默认 | 范围 | 说明 |
| --- | --- | --- | --- |
| `EASYTIER_ESP_IO_TASK_STACK` | 6144 | 2048..32768 | 网络收发任务 |
| `EASYTIER_ESP_PROTO_TASK_STACK` | 10240 | 4096..65536 | 控制面任务 |
| `EASYTIER_ESP_DATA_TASK_STACK` | 8192 | 2048..32768 | 数据面任务 |

改小前先看 [内存与资源](/guide/tuning/memory/) 并保留足够余量。

## 任务优先级

| 选项 | 默认 | 范围 | 说明 |
| --- | --- | --- | --- |
| `EASYTIER_ESP_IO_TASK_PRIORITY` | 7 | 1..24 | 必须低于 Wi-Fi/TCPIP（默认约 23/18） |
| `EASYTIER_ESP_PROTO_TASK_PRIORITY` | 5 | 1..24 | 默认低于 I/O，避免控制面抢占收发 |
| `EASYTIER_ESP_DATA_TASK_PRIORITY` | 7 | 1..24 | 默认与 I/O 同级 |

## 队列深度

| 选项 | 默认 | 范围 | 满时行为 |
| --- | --- | --- | --- |
| `EASYTIER_ESP_QUEUE_RX_CTRL_DEPTH` | 8 | 1..32 | 控制面丢帧并计数 |
| `EASYTIER_ESP_QUEUE_TX_DEPTH` | 8 | 1..32 | 发送积压，满即丢帧 |
| `EASYTIER_ESP_QUEUE_RX_DATA_DEPTH` | 8 | 1..32 | 数据面丢帧 |
| `EASYTIER_ESP_QUEUE_SMALL_DEPTH` | 8 | 1..32 | 连接/重连命令入队失败 |
| `EASYTIER_ESP_QUEUE_NETIF_DEPTH` | 16 | 1..64 | 网卡出站丢包 |

队列越深，常驻内存越大；默认值适合大多数接入场景。

## 通过 `sdkconfig.defaults` 设置

```ini
CONFIG_EASYTIER_ESP_LOG_LEVEL_INFO=y
CONFIG_EASYTIER_ESP_MAX_CONNECTED_PEERS=6
CONFIG_EASYTIER_ESP_IO_TASK_STACK=6144
CONFIG_EASYTIER_ESP_PROTO_TASK_STACK=10240
CONFIG_EASYTIER_ESP_DATA_TASK_STACK=8192
CONFIG_EASYTIER_ESP_QUEUE_RX_CTRL_DEPTH=8
CONFIG_EASYTIER_ESP_QUEUE_TX_DEPTH=8
CONFIG_EASYTIER_ESP_QUEUE_RX_DATA_DEPTH=8
CONFIG_EASYTIER_ESP_QUEUE_SMALL_DEPTH=8
CONFIG_EASYTIER_ESP_QUEUE_NETIF_DEPTH=16
```

## 越界会怎样

Kconfig 的 `range` 约束 menuconfig 路径；直接编辑 `sdkconfig` 越界会让固件**编译失败**，不会留到运行期才暴露。

## 调优顺序

1. 先开 PSRAM；
2. 内存不足 → 降连接槽/队列/RPC 重组槽；
3. 丢包 → 先看 `dropped_packets` 与队列满日志，再决定加深度还是查吞吐；
4. 栈问题 → 先看任务高水位，再改栈；
5. 优先级 → 不要高于 Wi-Fi/TCPIP。
