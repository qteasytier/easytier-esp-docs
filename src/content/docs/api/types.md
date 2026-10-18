---
title: 设置、状态与事件
description: Settings、PeerEndpoint、State、EventType、Status、Event、RuntimeOptions 的字段与语义。
---

## `PeerEndpoint`

```cpp
struct PeerEndpoint {
    std::string host{};
    uint16_t port = 0;
};
```

来自 TOML `[[peer]].uri`，已去掉 `tcp://` 前缀。

## `Settings`

`get_config_info()` 返回的生效设置副本。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `instance_name` | `std::string` | 实例名，缺省取 hostname |
| `hostname` | `std::string` | 主机名，缺省 `Espressif`，最多 32 码点 |
| `instance_id` | `std::array<uint8_t,16>` | UUID 字节 |
| `has_instance_id` | `bool` | 是否已确定 UUID（内部状态） |
| `instance_name_explicit` | `bool` | instance_name 是否显式配置（内部状态） |
| `network_name` | `std::string` | 网络名，缺省 `default` |
| `network_secret` | `std::string` | 网络密钥；对外副本恒为空 |
| `peers` | `std::vector<PeerEndpoint>` | 入口列表 |
| `has_static_ipv4` | `bool` | 是否配置静态 IPv4 |
| `static_ipv4` | `uint32_t` | 静态 IPv4 数值 |
| `static_prefix` | `uint8_t` | 前缀，缺省 24 |
| `dhcp` | `bool` | 是否启用 DHCP |
| `dhcp_has_subnet` | `bool` | 是否显式配置 DHCP 子网（内部状态） |
| `dhcp_subnet` | `uint32_t` | DHCP 子网网络号 |
| `dhcp_prefix` | `uint8_t` | DHCP 子网前缀 |
| `enable_encryption` | `bool` | 是否加密数据与 RPC |
| `mtu` | `uint16_t` | 虚拟 MTU |

> `has_instance_id`、`instance_name_explicit`、`dhcp_has_subnet` 是内部状态位，应用通常不需要读取。

## `State`

```cpp
enum class State : uint8_t {
    Uninitialized,
    Stopped,
    WaitingUnderlay,
    Connecting,
    Handshaking,
    Syncing,
    Ready,
    Stopping,
    Error,
};
```

迁移与语义见 [状态机、事件与时序](/guide/lifecycle/state-events/)。

## `EventType`

```cpp
enum class EventType : uint8_t {
    Started,
    PeerUp,
    NetworkReady,
    PeerDown,   // 预留，当前不产生
    Error,
    Stopped,
};
```

## `Status`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `state` | `State` | 当前状态 |
| `peer_id` | `uint32_t` | 本机 peer id，0 表示尚未分配 |
| `virtual_ipv4` | `uint32_t` | 虚拟 IPv4 数值 |
| `prefix_len` | `uint8_t` | 前缀长度 |
| `direct_peer_count` | `size_t` | 已握手直连数 |
| `reachable_route_count` | `size_t` | 可达路由数 |
| `last_error` | `esp_err_t` | 最近一次错误 |
| `dropped_packets` | `uint64_t` | 丢弃的报文数 |

## `Event`

```cpp
struct Event {
    EventType type = EventType::Error;
    Status status{};
    uint32_t peer_id = 0;  // PeerUp 时有效
};
```

## `EventCallback`

```cpp
using EventCallback = void (*)(const Event& event, void* user_data) noexcept;
```

- 在控制面任务中同步执行；
- 必须快速返回；
- 可调用只读接口与 `connect()`/`disconnect()`；
- 禁止 `stop()`/析构。

## `RuntimeOptions`

```cpp
struct RuntimeOptions {
    EventCallback on_event = nullptr;
    void* user_data = nullptr;
};
```

`user_data` 在 `stop()` 返回前保持有效；多实例时用它区分上下文。

## 常量

| 常量 | 值 |
| --- | --- |
| `kMinMtu` | 576 |
| `kDefaultMtu` | 1380 |
| `kDefaultDhcpSubnet` | `0x0A7E7E00`（10.126.126.0） |
| `kDefaultDhcpPrefix` | 24 |
| `kDefaultHostname` | `"Espressif"` |
| `kDefaultNetworkName` | `"default"` |

## 数值格式

- IPv4 用**主机字节序数值**表示，例如 `10.144.144.10` = `0x0A90900A`；
- 打印时按 `(ip >> 24) & 0xff` 依次取字节；
- `peer_id` 是 32 位无符号整数，日志里常用 `0x%08x`。
