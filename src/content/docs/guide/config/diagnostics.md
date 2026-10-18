---
title: 配置诊断
description: 常见 TOML 错误日志、结构校验失败与修复方法。
---

组件不缓存解析诊断，失败原因只出现在串口 **Error 日志**里。本页按日志关键字给出对照。

## 先做三件事

1. 打开 `EASYTIER_ESP_LOG_LEVEL=Error`（或 `Info`）；
2. 抓取构造前后的完整日志；
3. 找到第一条 `ET.TOML` / `ET.CONFIG` 的 Error，而不是最后一条。

## TOML 解析错误

| 日志关键字 | 原因 | 修复 |
| --- | --- | --- |
| `config field 'instance_name' must be a string` | 类型不是字符串 | 加引号 |
| `config field 'hostname' must be a string` | 类型错误 | 加引号 |
| `config field 'instance_id' must be a UUID string` | UUID 格式不对 | 32 个十六进制位，可带连字符 |
| `config field 'network_identity' must be a table` | 写成了字符串/数组 | 使用 `[network_identity]` |
| `network_identity.network_name must be a string` | 类型错误 | 加引号 |
| `network_identity.network_name must not be empty` | 空字符串 | 填网络名 |
| `network_identity.network_name is required` | 表存在但缺字段 | 补 `network_name` |
| `peer must be an array of tables` | `peer` 不是数组 | 用 `[[peer]]` |
| `peer[0] must be a table` | 元素不是表 | 每个入口一个 `[[peer]]` |
| `peer[0].uri is missing or not a supported tcp:// endpoint` | 缺 `uri`、协议错误、IPv6、端口非法 | 改为 `tcp://host:port` |
| `config field 'flags' must be a table` | `flags` 类型错误 | 使用 `[flags]` |
| `flags.mtu must be an integer in [576,1380]` | MTU 越界/不是整数 | 改到 576..1380 |
| `flags.enable_encryption must be a boolean` | 不是布尔 | `true` / `false` |
| `config field 'dhcp' must be a boolean or an IPv4 CIDR string` | 类型/格式错误 | `true` 或 `"10.126.126.0/24"` |
| `config field 'dhcp' prefix must be in [0,30]` | 前缀太大 | 改到 0..30 |

## 结构校验错误

这些错误发生在 TOML 解析成功之后：

| 日志关键字 | 原因 | 修复 |
| --- | --- | --- |
| `no usable entry peer configured` | `[[peer]]` 为空 | 至少加一个入口 |
| `neither ipv4 nor dhcp is configured` | 没写地址，或 `ipv4` 内容非法被忽略 | 写 `ipv4` 或 `dhcp` |
| `mtu ... out of range` | MTU 越界 | 576..1380 |
| `network_name must not be empty` | 网络名为空 | 填非空值 |
| `entry peer 0 is incomplete` | host 为空或 port 为 0 | 检查 URI |

## 内存/运行错误

| 日志关键字 | 原因 | 修复 |
| --- | --- | --- |
| `context allocation failed (…)` | 堆不足 | 开 PSRAM、降低队列/连接槽 |
| `queue/semaphore allocation failed` | 队列分配失败 | 降低深度、开 PSRAM |
| `TcpConn slot N allocation failed` | 连接槽分配失败 | 降低 `MAX_CONNECTED_PEERS` |
| `control-plane AEAD init failed` | PSA/mbedTLS 问题 | 检查配置与组件依赖 |
| `cannot create et_io task` | 任务创建失败 | 降低栈或开 PSRAM |

## 运行期不兼容

| 日志关键字 | 原因 | 修复 |
| --- | --- | --- |
| `compressed data-plane flags are not supported` | 对端压缩数据面 | 关闭对端压缩 |
| `peer used zstd compression, which this profile does not support` | RPC 使用 Zstd | 上游关闭 `data_compress_algo` |
| `virtual subnet overlaps the physical LAN` | 虚拟网段与 Wi-Fi STA 冲突 | 换虚拟网段 |

## 核对生效配置

```cpp
et::Settings cfg = inst.get_config_info();
ESP_LOGI(TAG, "network=%s secret_len=%u mtu=%u enc=%d dhcp=%d ipv4=%08x peers=%u",
         cfg.network_name.c_str(),
         static_cast<unsigned>(cfg.network_secret.size()),  // 恒为 0
         cfg.mtu, cfg.enable_encryption, cfg.dhcp,
         cfg.static_ipv4, static_cast<unsigned>(cfg.peers.size()));
```

如果 `get_config_info()` 的值和 TOML 预期不一致，优先怀疑：

- 字段名拼错，被当作未知键忽略；
- `ipv4` 内容非法被静默忽略；
- 同时写了 `ipv4` 与 `dhcp`，静态优先。

## 打开 Debug

```ini
CONFIG_EASYTIER_ESP_LOG_DEBUG=y
```

Debug 会输出解析阶段与逐槽连接细节，但增加日志量与固件体积。生产固件建议 `Info` 或 `Warning`。

## 不要做的事

- 不要只打印 `last_error()` 而不看日志；
- 不要把所有错误都归因于“内存不够”；
- 不要用旧 ELF 解析回溯；
- 不要在事件回调里做阻塞式诊断。
