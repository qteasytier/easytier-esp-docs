---
title: API 总览与约定
description: 唯一公开类 et::Inst、头文件、设计约定与类型总览。
---

## 公开头

```cpp
#include "easytier-esp.hpp"
```

## 唯一公开类

```cpp
namespace et {
class Inst final {
public:
    explicit Inst(std::string_view toml, const RuntimeOptions& options = {}) noexcept;
    ~Inst() noexcept;

    Inst(const Inst&) = delete;
    Inst& operator=(const Inst&) = delete;
    Inst(Inst&&) = delete;
    Inst& operator=(Inst&&) = delete;

    [[nodiscard]] bool valid() const noexcept;
    [[nodiscard]] esp_err_t last_error() const noexcept;
    esp_err_t start() noexcept;
    esp_err_t connect() noexcept;
    esp_err_t disconnect() noexcept;
    esp_err_t get_status(Status& out) const noexcept;
    [[nodiscard]] Settings get_config_info() const noexcept;
    esp_err_t stop(uint32_t timeout_ms = 5000) noexcept;
};
}
```

## 设计约定

| 约定 | 说明 |
| --- | --- |
| RAII | 构造即初始化；析构自动停止并释放 |
| 无异常 | 构造不能返回错误码，失败用 `valid()` / `last_error()` 查询 |
| 无 RTTI | 组件源码关闭 RTTI |
| `noexcept` | 公开接口均为 `noexcept` |
| 错误码 | 返回 `esp_err_t`；运行期错误另见 `Status::last_error` |
| 配置只走 TOML | 没有编程式 setter |
| 不可拷贝/移动 | 避免生命周期与资源所有权歧义 |
| 多实例 | 每个实例独立；构造需串行 |

## 类型总览

| 类型 | 用途 |
| --- | --- |
| `Inst` | 运行实例 |
| `Settings` | 生效设置快照（`get_config_info()` 返回） |
| `PeerEndpoint` | 入口 host/port |
| `State` | 实例状态枚举 |
| `EventType` | 事件类型枚举 |
| `Status` | 状态快照 |
| `Event` | 一次事件 |
| `EventCallback` | 事件回调函数指针 |
| `RuntimeOptions` | 运行期选项（回调、user_data） |

## 常量

| 常量 | 值 | 含义 |
| --- | --- | --- |
| `kMinMtu` | 576 | MTU 下限 |
| `kDefaultMtu` | 1380 | MTU 上限与缺省值 |
| `kDefaultDhcpSubnet` | `10.126.126.0` | DHCP 回落子网 |
| `kDefaultDhcpPrefix` | 24 | DHCP 回落前缀 |
| `kDefaultHostname` | `Espressif` | hostname 回退 |
| `kDefaultNetworkName` | `default` | 网络名缺省 |

## 版本

当前 API 对应组件 **0.0.2**。0.x 阶段不承诺二进制/源码完全兼容；升级前请看仓库的 `CHANGELOG.md`，并遵循下面的 API 版本策略。

## 版本策略

- 0.x：允许不兼容变更，但会在 CHANGELOG 标注；
- 公开头是唯一契约，`src/` 下的类型不保证稳定；
- 新增字段优先追加，避免改变既有字段语义；
- 弃用先文档标注，再在下一个 minor 移除。
