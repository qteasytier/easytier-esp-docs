---
title: 错误处理与日志
description: 构造失败、启动失败、运行期错误分别怎么查；日志标签与常见错误码。
---

组件不使用异常。错误分三层：**构造**、**启动**、**运行期**。

## 三层错误

| 阶段 | 查询方式 | 错误去向 |
| --- | --- | --- |
| 构造 | `valid()` / `last_error()` | 构造函数不返回错误码；具体原因已由 `ET.TOML` / `ET.CONFIG` 输出 |
| 启动 | `start()` 返回值 | 同时置 `Status.state = Error`、`Status.last_error` |
| 运行期 | `get_status().last_error` + `Error` 事件 | 组件内部记录最近一次错误 |

> 组件**不缓存解析诊断**。要定位配置错误，必须看串口日志；`last_error()` 只给错误码。

## 构造失败

```cpp
et::Inst inst(toml, options);
if (!inst.valid()) {
    ESP_LOGE(TAG, "config rejected: 0x%x", inst.last_error());
    // 具体原因看串口第一条 ET.TOML / ET.CONFIG Error
    return;
}
```

常见错误码：

| 错误码 | 常见原因 |
| --- | --- |
| `ESP_ERR_INVALID_ARG` | 字段类型/取值错误、peer URI 非法、结构校验失败 |
| `ESP_ERR_NO_MEM` | 运行上下文分配失败（堆不足） |
| `ESP_ERR_INVALID_SIZE` | TOML 节点/数组/表键超限 |
| `ESP_ERR_NOT_SUPPORTED` | 宿主构建（无 FreeRTOS）调用 `start()` |

`ipv4` 是唯一不报错的字段：内容非法时静默忽略。

## 启动失败

```cpp
esp_err_t err = inst.start();
if (err != ESP_OK) {
    ESP_LOGE(TAG, "start failed: 0x%x", err);
    return;
}
```

`start()` 失败会回滚已创建资源并置 `State::Error`。常见原因：

- 队列/信号量分配失败（降低深度或开 PSRAM）；
- `TcpConn` 槽分配失败（约 12 KiB/槽）；
- 加密组件初始化失败（PSA/mbedTLS）；
- 任务创建失败（栈太大或内存不足）；
- 虚拟网卡创建失败（静态地址时）。

## 运行期错误

```cpp
void on_event(const et::Event& event, void*) noexcept {
    if (event.type == et::EventType::Error) {
        ESP_LOGE(TAG, "runtime error: 0x%x", event.status.last_error);
    }
}
```

`Status::last_error` 是“最近一次错误”，不是历史累计。排障时结合日志时间线看。

## 日志标签

| 标签 | 模块 |
| --- | --- |
| `ET.INSTANCE` | `Inst` 构造/生命周期 |
| `ET.TOML` | TOML 解析与字段校验 |
| `ET.CONFIG` | 结构校验、身份补齐 |
| `ET.CONTEXT` | 上下文、队列、任务、启动/停止 |
| `ET.IO` | socket、连接、切帧、重连 |
| `ET.TCP` | TCP 连接细节 |
| `ET.PROTO` | 握手、保活、RPC 分发、状态迁移 |
| `ET.RPC` | 服务注册、事务、分片 |
| `ET.SYNC` | 路由同步 |
| `ET.ROUTE` | 最短路与快照 |
| `ET.TOPO` | 拓扑表 |
| `ET.DHCP` | 地址自分配 |
| `ET.NETIF` | 虚拟网卡 |
| `ET.AES` | 加密 |

## 日志等级

Kconfig `EASYTIER_ESP_LOG_LEVEL`：

- `Closed`：全部裁剪；
- `Error`：仅错误；
- `Warning`：错误 + 警告；
- `Info`：默认；
- `Debug`：全部。

低于所选等级的日志在**编译期**被裁剪，不占固件体积。ESP-IDF 全局日志等级仍会叠加生效。

## 处理建议

### 构造失败

1. 看第一条 `ET.TOML` / `ET.CONFIG` Error；
2. 核对字段类型、范围、peer URI；
3. 确认至少 1 个入口、且配置了静态 IP 或 DHCP；
4. 确认 `network_name` 非空。

### 启动失败

1. 看 `ET.CONTEXT` 的分配失败日志；
2. 开 PSRAM；
3. 降低连接槽/队列深度；
4. 确认任务栈没有超过可用内存。

### 运行期错误

1. 看 `ET.PROTO`/`ET.IO` 的时间线；
2. 结合 `Status` 的 `state`、`direct_peer_count`、`reachable_route_count`、`dropped_packets`；
3. 记录 `last_error` 与日志时间线，必要时在 [常见问题 FAQ](/appendix/faq/) 中查找同类问题。

## 不要做的事

- 不要只打印 `last_error()` 而不看日志；
- 不要把 `last_error` 当成“当前是否可用”；
- 不要在事件回调里做长时间日志格式化/阻塞 IO；
- 不要用旧 ELF 解析崩溃回溯。
