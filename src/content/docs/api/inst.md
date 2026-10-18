---
title: 网络节点实例 et::Inst
description: 构造、valid、last_error、start、connect、disconnect、get_status、get_config_info、stop 与析构的完整说明。
---

## 构造

```cpp
explicit Inst(std::string_view toml, const RuntimeOptions& options = {}) noexcept;
```

- 解析 TOML；
- 补齐身份（hostname / instance_name / UUID）；
- 结构校验；
- 准备运行所需资源。

失败时 `valid() == false`，错误码见 `last_error()`；具体原因在 `ET.TOML` / `ET.CONFIG` 日志。

```cpp
et::RuntimeOptions opt{};
opt.on_event = &on_event;
et::Inst inst(toml, opt);
if (!inst.valid()) {
    ESP_LOGE(TAG, "0x%x", inst.last_error());
}
```

> 构造在调用者任务栈上执行，建议任务栈 ≥ 8 KiB；不要跨任务并发构造。

## 析构

```cpp
~Inst() noexcept;
```

- 运行中会先 `stop(UINT32_MAX)`，**无限等待**任务退出；
- 释放运行资源并清零密钥。

禁止在事件回调或组件任务里析构。

## 方法总览
##### 1. `valid()`

```cpp
[[nodiscard]] bool valid() const noexcept;
```

构造成功且 `last_error() == ESP_OK`。只反映**构造**是否成功，不反映运行期状态。

##### 2. `last_error()`

```cpp
[[nodiscard]] esp_err_t last_error() const noexcept;
```

构造失败的错误码。运行期错误看 `Status::last_error`。

##### 3. `start()`

```cpp
esp_err_t start() noexcept;
```

创建连接、网卡、任务等运行资源。返回成功只代表资源已创建，不代表组网可用。

- 每个实例只调用一次；
- 失败会回滚并置 `State::Error`；
- 与 `stop()`/析构串行。

##### 4. `connect()`

```cpp
esp_err_t connect() noexcept;
```

允许组件连接入口。非阻塞、幂等；Wi-Fi/以太网取得 IP 后调用，重连后需再次调用。

- 成功只表示命令已入队；
- 队列满返回 `ESP_ERR_NO_MEM`，可重试；
- 可在事件回调中调用。

##### 5. `disconnect()`

```cpp
esp_err_t disconnect() noexcept;
```

关闭连接并撤销路由，状态回到 `WaitingUnderlay`。非阻塞、幂等；之后可再次 `connect()`。

##### 6. `get_status()`

```cpp
esp_err_t get_status(Status& out) const noexcept;
```

读取自洽的状态快照：

| 字段 | 含义 |
| --- | --- |
| `state` | 当前状态 |
| `peer_id` | 本机 peer id（0 表示尚未分配） |
| `virtual_ipv4` | 虚拟 IPv4（数值表示） |
| `prefix_len` | 前缀长度 |
| `direct_peer_count` | 已握手直连数 |
| `reachable_route_count` | 可达路由数 |
| `last_error` | 最近一次错误 |
| `dropped_packets` | 丢弃计数 |

实例必须存活，不能与析构并发。构造失败时返回 `ESP_ERR_INVALID_STATE`。

##### 7. `get_config_info()`

```cpp
[[nodiscard]] Settings get_config_info() const noexcept;
```

返回生效设置的**深拷贝**：

- `network_secret` 恒为空；
- 身份字段已补齐；
- 构造失败时返回缺省 `Settings`。

可以安全打印、跨任务传递。

##### 8. `stop()`

```cpp
esp_err_t stop(uint32_t timeout_ms = 5000) noexcept;
```

- 幂等；
- 置 `Stopping`、停止连接、等待组件任务退出；
- 超时返回 `ESP_ERR_TIMEOUT`，资源保留，可重试；
- 成功后 `State::Stopped`。

不要在事件回调里调用；析构会无限等待。

## 返回码

| 返回码 | 场景 |
| --- | --- |
| `ESP_OK` | 成功 |
| `ESP_ERR_INVALID_STATE` | 实例未构造/未启动/状态不允许 |
| `ESP_ERR_INVALID_ARG` | 参数/配置错误 |
| `ESP_ERR_NO_MEM` | 队列满或分配失败 |
| `ESP_ERR_TIMEOUT` | `stop()` 等待任务退出超时 |
| `ESP_ERR_NOT_SUPPORTED` | 宿主构建调用 `start()`/`stop()` |

## 完整示例

```cpp
#include "easytier-esp.hpp"

static std::optional<et::Inst> g_inst;

void on_event(const et::Event& e, void*) noexcept {
    if (e.type == et::EventType::NetworkReady) {
        ESP_LOGI(TAG, "ready: %08x/%u", e.status.virtual_ipv4, e.status.prefix_len);
    }
}

bool boot(std::string_view toml) {
    et::RuntimeOptions opt{};
    opt.on_event = &on_event;

    g_inst.emplace(toml, opt);
    if (!g_inst->valid()) {
        ESP_LOGE(TAG, "config: 0x%x", g_inst->last_error());
        g_inst.reset();
        return false;
    }
    if (g_inst->start() != ESP_OK) {
        g_inst.reset();
        return false;
    }
    return true;
}

void on_ip() {
    if (g_inst) (void)g_inst->connect();
}

void shutdown() {
    if (g_inst) {
        (void)g_inst->stop(5000);
        g_inst.reset();
    }
}
```
