---
title: 内存与资源
description: 单实例需要多少 RAM/PSRAM、如何实测，以及内存不足时先调哪里。
---

EasyTier-ESP 的资源是**有界**的，但单实例并不算小。规划时先看量级，再用运行时数据确认。

## 主要开销

| 项目 | 量级 | 说明 |
| --- | --- | --- |
| 单实例常驻 | 约 **90 KiB** | 组件运行上下文 |
| 每条入口连接 | 约 12 KiB | 默认最多 6 条 |
| 任务栈 | 约 24 KiB | 组件任务合计，可调 |
| 队列/缓冲 | 数十 KiB | 与队列深度配置相关 |

这些数字用于容量规划，不是硬性承诺。实际值以构建日志和运行时测量为准。

## 建议开启 PSRAM

- 单实例常驻、连接缓冲等大块分配通常会落到 PSRAM；
- 任务栈仍在内部 RAM；
- 不开 PSRAM 时，默认配置很容易在分配阶段失败。

N16R8 模组按实际型号配置 Octal/Quad PSRAM。开启后确认系统能识别到 PSRAM。

## 实测

```cpp
ESP_LOGI(TAG, "free internal: %u", esp_get_free_heap_size());
ESP_LOGI(TAG, "free PSRAM: %u", heap_caps_get_free_size(MALLOC_CAP_SPIRAM));
ESP_LOGI(TAG, "main stack high water: %u", uxTaskGetStackHighWaterMark(nullptr));
```

启动后看 `ET.CONTEXT` 日志，确认连接槽与队列深度与 Kconfig 一致：

```text
runtime context: ... bytes; slots: 6; queues: ...
```

## 多实例

N 个实例大致是 N 倍资源：

```text
总内存 ≈ N × (单实例常驻 + 连接缓冲 + 任务栈) + 应用开销
```

规划时至少确认：

- 内部 RAM 能容纳 N × 任务栈；
- PSRAM 能容纳 N × 常驻内存；
- `CONFIG_LWIP_MAX_SOCKETS` 足够；
- 每个实例的虚拟网段不冲突。

## 内存不足时

按这个顺序处理：

1. 开启 PSRAM；
2. 降低 `EASYTIER_ESP_MAX_CONNECTED_PEERS`；
3. 降低队列深度；
4. 减少同时运行的实例数；
5. 确认没有其他大块分配或泄漏。

常见日志：

```text
context allocation failed
queue/semaphore allocation failed
TcpConn slot N allocation failed
```

看到这些，先查 PSRAM 与上面几项配置，不要直接改任务栈。

Kconfig 选项见 [Kconfig 选项总览](/guide/tuning/kconfig/)。
