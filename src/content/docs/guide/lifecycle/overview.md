---
title: 生命周期总览
description: 构造、start、connect、disconnect、stop 与析构的顺序和注意事项。
---

:::tip
本组件所有类型、方法与函数等都由命名空间 `et` 提供。
:::

在本组件中，由 `et::Inst` 类提供一个 EasyTier 节点实例的生命周期。 `et::Inst` 是 RAII 对象：构造即完成 TOML 解析、校验与资源准备；析构自动停止并释放。

## 五个阶段

| 阶段 | 调用 | 做了什么 | 失败表现 |
| --- | --- | --- | --- |
| 构造 | `Inst(toml, options)` | 解析 TOML、校验配置、准备运行资源 | `valid() == false`，原因看 `last_error()` 与日志 |
| 启动 | `start()` | 创建连接、网卡、任务等运行资源 | 返回错误码；状态变为 `Error` |
| 连接 | `connect()` | 通知组件开始连接入口 | 返回错误码（如队列满 `ESP_ERR_NO_MEM`） |
| 断开 | `disconnect()` | 关闭连接、撤销路由，回到 `WaitingUnderlay` | 返回错误码 |
| 停止 | `stop(timeout)` / 析构 | 停止任务、释放资源 | 超时返回 `ESP_ERR_TIMEOUT`，可重试 |

> `start()` 返回成功只代表资源已创建，**不代表组网可用**。组网可用看 `NetworkReady` 事件或 `Status.state == Ready`。

## 最小调用顺序

```cpp
et::RuntimeOptions options{};
options.on_event = &on_event;

et::Inst inst(toml_text, options);
if (!inst.valid()) {
    ESP_LOGE(TAG, "config rejected: 0x%x", inst.last_error());
    return;
}

ESP_ERROR_CHECK(inst.start());
// Wi-Fi/以太网取得 IP 后：
ESP_ERROR_CHECK(inst.connect());

// 网络断开时：
(void)inst.disconnect();

// 需要主动停止时：
(void)inst.stop(5000);
```

## 构造阶段

定义 `et::Inst` 对象时，构造函数完成以下工作：

- 解析 TOML，校验支持的字段；
- 补齐 `hostname` / `instance_name` / UUID；
- 校验入口、虚拟地址、MTU、网络名；
- 准备运行组网实例所需资源。

:::tip[注意]
- 构造在**调用者任务栈**上执行，建议任务栈 ≥ 8 KiB；
- 失败不会抛异常；用 `valid()` / `last_error()` 查询；
- 具体失败原因在串口 Error 日志里；
- 构造失败的对象可以安全析构。
:::

## 启动阶段

`start()` 创建运行所需资源：连接槽、虚拟网卡（静态地址时）、任务与队列。任何一步失败都会回滚并进入 `Error`，返回错误码。

## 连接与断开

`connect()` / `disconnect()` 是**非阻塞、幂等**的应用侧开关：

- `connect()` 通知组件开始连接入口；
- `disconnect()` 关闭连接并撤销路由，状态回到 `WaitingUnderlay`；
- Wi-Fi 重连后必须再次 `connect()`；
- 两者可以在 Wi-Fi/IP 事件回调里调用，但更推荐在独立任务/主循环里串行处理。

## 停止与析构

```cpp
esp_err_t err = inst.stop(5000);
if (err == ESP_ERR_TIMEOUT) {
    // 任务尚未退出，资源仍保留，可以重试
}
```

- `stop(timeout)` 幂等；超时不会释放资源，允许再次 `stop()`；
- 析构在运行中会等待任务退出，因此不要在事件回调或组件任务里析构。

## 常见误用

| 误用 | 后果 | 正确做法 |
| --- | --- | --- |
| `start()` 后立刻认为网络可用 | 误判 | 等 `NetworkReady` 或 `Ready` |
| 在 EasyTier 事件回调里 `stop()`/析构 | 死锁/崩溃 | 交给其他任务 |
| Wi-Fi 重连后不再次 `connect()` | 不再连接 | 在 GOT_IP 后调用 |
| 构造/停止跨任务并发 | 未定义行为 | 同一实例串行调用 |
| 在小栈任务里构造 `Inst` | 栈溢出 | 使用 ≥ 8 KiB 栈的任务 |

