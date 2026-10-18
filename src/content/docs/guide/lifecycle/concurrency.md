---
title: 线程、回调与多实例
description: 哪些调用必须串行、事件回调里能做什么、多个 Inst 如何共存。
---

## 一句话规则

**同一实例的构造、`start()`、`stop()`、析构必须串行；不同实例互不影响；只读查询要求实例仍存活且不与销毁并发。**

## 调用约束

| 操作 | 约束 |
| --- | --- |
| 构造 `Inst` | 在 ≥ 8 KiB 栈的任务中；**不要跨任务并发构造** |
| `start()` | 每个实例只调用一次；与 `stop()`/析构串行 |
| `connect()` / `disconnect()` | 非阻塞、幂等；可以在事件回调中调用 |
| `get_status()` / `get_config_info()` | 只读；实例必须存活，不能与析构并发 |
| `stop()` | 与 `start()`/析构串行；不要在事件回调里调用 |
| 析构 | 运行中会等待任务退出；禁止在事件回调/控制面任务里执行 |

## 构造要串行

TOML 解析和实例构造不要在多个任务里同时做。推荐在同一个任务里依次构造：

```cpp
et::Inst a(toml_a, options);
et::Inst b(toml_b, options);
```

不同实例运行起来后互不共享连接、队列、任务或网卡。

## 事件回调里能做什么

事件在组件任务中同步执行：

```cpp
void on_event(const et::Event& event, void*) noexcept;
```

允许：

- 读取 `event.status` / `event.peer_id`；
- 调用 `get_status()` / `get_config_info()`；
- 调用 `connect()` / `disconnect()`；
- 置位事件组、写原子量、打印短日志。

禁止：

- `stop()` 或析构实例；
- 阻塞等待、文件 IO、网络请求；
- 在回调里再次构造实例；
- 长时间持有锁。

## 多实例

:::caution
尽管本组件理论上支持多实例，但受限于单片机的资源，性能，在实际场景中并不推荐。
我们也尚未对多实例进行全面的测试。
:::

每个 `et::Inst` 独占连接、队列、任务与虚拟网卡，资源大致是 N 倍。规划时按 [内存与资源](/guide/tuning/memory/) 估算，并确认：

- `CONFIG_LWIP_MAX_SOCKETS` 足够；
- 内部 RAM 能容纳 N 个实例的任务栈；
- 每个实例的虚拟网段不冲突；
- 事件回调里能区分实例（用 `user_data`）。

```cpp
struct AppCtx { int id; };
AppCtx ctx_a{1}, ctx_b{2};

et::RuntimeOptions oa{};
oa.on_event = &on_event;
oa.user_data = &ctx_a;

et::RuntimeOptions ob{};
ob.on_event = &on_event;
ob.user_data = &ctx_b;
```

## 与停止/析构并发

不要在另一个任务还在调用 `get_status()` 时析构实例。推荐：

1. 先 `stop()`；
2. 确认业务任务已退出或不再访问实例；
3. 再析构。

`stop()` 超时返回 `ESP_ERR_TIMEOUT` 时，资源仍保留，可以重试；不要立刻析构。

## 队列满与分配失败

- `connect()` / `disconnect()` 队列满时返回 `ESP_ERR_NO_MEM`，这是可重试错误；
- 内存分配失败可能返回错误或终止进程；
- 开启 PSRAM、减少入口/队列深度可以降低风险。
