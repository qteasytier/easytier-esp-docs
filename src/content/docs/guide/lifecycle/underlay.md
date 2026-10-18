---
title: 与 Wi-Fi/以太网集成
description: 在 underlay 取得 IP 后调用 connect，在断线时调用 disconnect，并正确处理重连。
---

EasyTier-ESP 不管理物理网络。它假设应用已经让 Wi-Fi/以太网取得 IP，然后通过 `connect()` 允许组件连接入口；物理网络断开时调用 `disconnect()`。

## 示例源码

```cpp
namespace {
EventGroupHandle_t g_events;
constexpr EventBits_t kUnderlayChanged = BIT0;
std::atomic<bool> g_has_ip{false};
std::optional<et::Inst> g_inst; // 或者你自己定义的 Inst
}

void on_net_event(void*, esp_event_base_t base, int32_t id, void* data) {
    if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
        g_has_ip.store(true);
        xEventGroupSetBits(g_events, kUnderlayChanged);
    } else if (base == WIFI_EVENT && id == WIFI_EVENT_STA_DISCONNECTED) {
        g_has_ip.store(false);
        xEventGroupSetBits(g_events, kUnderlayChanged);
        (void)esp_wifi_connect();  // 触发重连
    }
}

void net_task(void*) {
    for (;;) {
        xEventGroupWaitBits(g_events, kUnderlayChanged, pdTRUE, pdFALSE, portMAX_DELAY);
        if (g_has_ip.load()) {
            (void)g_inst->connect();     // 每次取得 IP 都要调用
        } else {
            (void)g_inst->disconnect();
        }
    }
}
```

该源码中，事件回调只置位，主循环做决策，这种模式的好处是：

- 事件回调不阻塞网络栈；
- `connect()`/`disconnect()` 串行执行；
- Wi-Fi 重连后一定会再次 `connect()`。

不过，也可以直接在回调里调用`connect()` / `disconnect()`，二者本身是非阻塞、幂等的，只向队列投递命令。理论上可以在 Wi-Fi 事件回调里直接调用：

```cpp
if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
    (void)g_inst->connect();
}
```

但要注意：

- 回调上下文是 ESP 事件任务，不要做耗时操作；
- 队列满时 `connect()` 返回 `ESP_ERR_NO_MEM`，需要重试；
- 不要把 `start()`、`stop()`、析构放进回调。

## 什么时候调用 `connect()`

| 场景 | 动作 |
| --- | --- |
| 首次取得 IP | `connect()` |
| Wi-Fi 断开 | `disconnect()` |
| Wi-Fi 重连并再次取得 IP | **再次** `connect()` |
| 以太网插拔 | 同上 |
| 手动关闭组网 | `disconnect()` |
| 应用退出 | `stop()` 或析构 |

## 以太网 / PPP

组件不关心 underlay 类型，只要求：

1. `esp_netif_init()` 与默认事件循环已创建；
2. 物理网卡已取得 IP；
3. TCP 能访问入口地址。

以太网示例：

```cpp
// 以 ESP-IDF 的以太网例程为准
esp_eth_start(eth_handle);
// 在 IP_EVENT_ETH_GOT_IP 后 connect()
```

PPP/蜂窝模组同理：确认 `getaddrinfo` 可用、TCP 出口没有被 modem 的 APN/防火墙限制。

## 常见错误

**1. 在 `WIFI_EVENT_STA_START` 就 `connect()`**

此时还没有 IP，组件会尝试连接入口但底层 socket 无法工作。应在 `IP_EVENT_STA_GOT_IP` 之后。

**2. Wi-Fi 重连后没有再次 `connect()`**

组件在 `disconnect()` 后不会自动恢复；重连成功必须重新调用 `connect()`。

**3. 在事件回调里 `stop()` 或析构**

EasyTier 的事件回调在控制面任务中执行，`stop()` 会等待该任务退出，造成死锁。析构更是禁止。

**4. 物理网络切换（Wi-Fi → 以太网）**

先 `disconnect()`，等新 underlay 取得 IP 后再 `connect()`。不要同时保持两个 underlay 的连接开关。

## 验证

```cpp
et::Status status{};
if (g_inst->get_status(status) == ESP_OK) {
    ESP_LOGI(TAG, "state=%d vip=%08x direct=%u routes=%u",
             static_cast<int>(status.state), status.virtual_ipv4,
             static_cast<unsigned>(status.direct_peer_count),
             static_cast<unsigned>(status.reachable_route_count));
}
```
