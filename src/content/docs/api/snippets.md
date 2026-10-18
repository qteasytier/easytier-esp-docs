---
title: 代码片段集
description: 最小构造、Wi-Fi 集成、状态轮询、优雅停止、多实例与内嵌 TOML 的常用片段。
---

## 最小构造

```cpp
#include "easytier-esp.hpp"

et::Inst inst(toml_text);
if (!inst.valid()) {
    ESP_LOGE(TAG, "config rejected: 0x%x", inst.last_error());
    return;
}
ESP_ERROR_CHECK(inst.start());
```

## 事件驱动

```cpp
void on_event(const et::Event& e, void*) noexcept {
    switch (e.type) {
        case et::EventType::Started:
            ESP_LOGI(TAG, "started, peer_id=%u", static_cast<unsigned>(e.status.peer_id));
            break;
        case et::EventType::PeerUp:
            ESP_LOGI(TAG, "peer up: %u", static_cast<unsigned>(e.peer_id));
            break;
        case et::EventType::NetworkReady:
            ESP_LOGI(TAG, "ready: %u.%u.%u.%u/%u",
                     (e.status.virtual_ipv4 >> 24) & 0xff,
                     (e.status.virtual_ipv4 >> 16) & 0xff,
                     (e.status.virtual_ipv4 >> 8) & 0xff,
                     e.status.virtual_ipv4 & 0xff,
                     e.status.prefix_len);
            break;
        case et::EventType::Error:
            ESP_LOGE(TAG, "runtime error: 0x%x", e.status.last_error);
            break;
        case et::EventType::Stopped:
            ESP_LOGI(TAG, "stopped");
            break;
        default:
            break;
    }
}
```

## Wi-Fi 取得 IP 后连接

```cpp
static void on_ip_event(void*, esp_event_base_t base, int32_t id, void* data) {
    if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
        if (g_inst) {
            (void)g_inst->connect();
        }
    }
}

static void on_wifi_disconnected(void*, esp_event_base_t, int32_t, void*) {
    if (g_inst) {
        (void)g_inst->disconnect();
    }
    (void)esp_wifi_connect();
}
```

## 状态轮询

```cpp
void log_status() {
    if (!g_inst) return;
    et::Status s{};
    if (g_inst->get_status(s) != ESP_OK) return;
    ESP_LOGI(TAG, "state=%d peer=%08x vip=%08x/%u direct=%u routes=%u dropped=%llu err=0x%x",
             static_cast<int>(s.state), s.peer_id, s.virtual_ipv4, s.prefix_len,
             static_cast<unsigned>(s.direct_peer_count),
             static_cast<unsigned>(s.reachable_route_count),
             static_cast<unsigned long long>(s.dropped_packets),
             s.last_error);
}
```

## 优雅停止

```cpp
void shutdown() {
    if (!g_inst) return;
    esp_err_t err = g_inst->stop(5000);
    if (err == ESP_ERR_TIMEOUT) {
        ESP_LOGW(TAG, "stop timeout, retry after tasks settle");
        err = g_inst->stop(5000);
    }
    if (err == ESP_OK) {
        g_inst.reset();
    }
}
```

不要在事件回调里调用。

## 多实例

```cpp
struct Ctx { const char* name; };
Ctx ctx_a{"a"}, ctx_b{"b"};

void on_event(const et::Event& e, void* user) noexcept {
    auto* ctx = static_cast<Ctx*>(user);
    ESP_LOGI(TAG, "[%s] event %d", ctx->name, static_cast<int>(e.type));
}

et::RuntimeOptions oa{};
oa.on_event = &on_event;
oa.user_data = &ctx_a;

et::RuntimeOptions ob{};
ob.on_event = &on_event;
ob.user_data = &ctx_b;

et::Inst a(toml_a, oa);
et::Inst b(toml_b, ob);  // 构造串行，不要跨任务并发
```

## 内嵌 TOML

```cpp
extern const uint8_t toml_start[] asm("_binary_easytier_toml_start");
extern const uint8_t toml_end[] asm("_binary_easytier_toml_end");

std::string_view embedded_toml() {
    size_t len = static_cast<size_t>(toml_end - toml_start);
    if (len != 0 && toml_start[len - 1] == 0) {
        --len;  // EMBED_TXTFILES 末尾 NUL
    }
    return {reinterpret_cast<const char*>(toml_start), len};
}
```

## 错误处理

```cpp
if (!inst.valid()) {
    ESP_LOGE(TAG, "config: 0x%x", inst.last_error());
    return;
}

const esp_err_t err = inst.start();
if (err != ESP_OK) {
    ESP_LOGE(TAG, "start: 0x%x", err);
    return;
}

if (inst.connect() == ESP_ERR_NO_MEM) {
    // 队列满：稍后重试，不要忙等
}
```

## 打印生效配置

```cpp
et::Settings cfg = inst.get_config_info();
ESP_LOGI(TAG, "instance=%s hostname=%s network=%s mtu=%u enc=%d peers=%u",
         cfg.instance_name.c_str(), cfg.hostname.c_str(), cfg.network_name.c_str(),
         cfg.mtu, cfg.enable_encryption, static_cast<unsigned>(cfg.peers.size()));
for (const auto& p : cfg.peers) {
    ESP_LOGI(TAG, "peer %s:%u", p.host.c_str(), p.port);
}
```
