---
title: TOML 字段参考
description: 根级字段、network_identity、peer、flags、dhcp 的类型、缺省值、校验规则与错误行为。
---

## 字段总表

| 字段 | 类型 | 缺省 | 必填 | 校验 |
| --- | --- | --- | --- | --- |
| `instance_name` | string | 取 hostname | 否 | 任意字符串 |
| `hostname` | string | `Espressif` | 否 | 去控制字符，最多 32 码点 |
| `instance_id` | string | 生成 UUID v4 | 否 | 忽略连字符，恰好 32 个十六进制位 |
| `ipv4` | string | 未配置 | 否 | `a.b.c.d` 或 `a.b.c.d/prefix`；内容非法则忽略 |
| `dhcp` | bool / string | `false` | 否 | bool，或带前缀的 IPv4 CIDR；前缀 0..30 |
| `[network_identity].network_name` | string | `default` | 表存在时必填 | 非空 |
| `[network_identity].network_secret` | string | 空串 | 否 | 任意字符串 |
| `[[peer]].uri` | string | 无 | 是 | `tcp://host:port`，IPv4/DNS，不支持 IPv6 |
| `[flags].mtu` | integer | `1380` | 否 | 576..1380 |
| `[flags].enable_encryption` | bool | `true` | 否 | 布尔；别名 `enableEncryption` |

## 根级字段

**1. `instance_name`**

实例名，用于标识。缺省时**取 hostname**。显式给出后不会再被 hostname 覆盖。

```toml
instance_name = "esp32-s3"
```

**2. `hostname`**

主机名。缺省 `Espressif`。规范化规则：

- 去除控制字符；
- 最多保留 32 个 Unicode 码点；
- 全是控制字符时视为无效，回退缺省。

```toml
hostname = "esp32-s3"
```

**3. `instance_id`**

实例 UUID。缺省时构造生成 UUID v4；显式给出时**保留原值**（包括全零 UUID）。

```toml
instance_id = "550e8400-e29b-41d4-a716-446655440000"
```

解析规则：忽略任意位置的连字符，要求恰好 32 个十六进制位。

**4. `ipv4`**

静态虚拟 IPv4，可带前缀：

```toml
ipv4 = "10.144.144.10/24"
ipv4 = "10.144.144.10"      # 无前缀时按 /24
```

**唯一例外**：字符串类型正确但内容无法解析时，静默忽略，按未配置处理。不会让构造失败。

## `[network_identity]`

```toml
[network_identity]
network_name = "esp-demo"
network_secret = "<YOUR_NETWORK_SECRET>"
```

- 表一旦出现，`network_name` 必填且非空；缺失即构造失败；
- `network_secret` 可选，缺省空串；
- 表内其它键忽略；
- 所有节点必须使用相同的网络名与密钥。

## `[[peer]]`

```toml
[[peer]]
uri = "tcp://192.0.2.10:11010"

[[peer]]
uri = "tcp://backup.example.com:11010"
```

- 数组元素必须是表，`uri` 必须是字符串；
- 只接受 `tcp://host:port`；
- host 支持点分 IPv4 与 DNS；
- 不支持 IPv6、UDP、KCP、QUIC、WebSocket；
- 条目数量无上限；
- **任意一个入口非法，整个配置失败**。

## `[flags]`

```toml
[flags]
mtu = 1380
enable_encryption = true
```

- `mtu`：整数，576..1380；越界失败；
- `enable_encryption`：布尔，缺省 true；`enableEncryption` 是别名；
- 其它 flags（`disable_p2p`、`encryption_algorithm`、`data_compress_algo` 等）忽略。

## `dhcp`

```toml
dhcp = true
dhcp = false
dhcp = "10.126.126.0/24"
```

- bool：启用/关闭；
- string：必须是带前缀的 IPv4 CIDR，前缀 0..30；
- 与 `ipv4` 同时出现时静态地址优先；
- 不写 `ipv4` 也不写 `dhcp` 会让结构校验失败。

## 完整示例

```toml
instance_name = "esp32-s3"
hostname = "esp32-s3"
dhcp = true

[network_identity]
network_name = "esp-demo"
network_secret = "<YOUR_NETWORK_SECRET>"

[[peer]]
uri = "tcp://192.0.2.10:11010"

[[peer]]
uri = "tcp://198.51.100.20:11010"

[flags]
mtu = 1380
enable_encryption = true
```

## 不支持的字段

以下字段会被**忽略且不报错**：

- 根级：`listeners`、`routes`、`proxy_network`、`vpn_portal_config`、`file_logger` 等；
- `[flags]`：`disable_p2p`、`encryption_algorithm`、`data_compress_algo`、`latency_first` 等；
- `[[peer]]` 内的其它键；
- `[network_identity]` 内的其它键。

这不是“兼容上游全部配置”，而是“避免复制上游配置时整体失败”。不要根据字段存在推断功能可用。

## 错误行为速查

| 写法 | 结果 |
| --- | --- |
| `mtu = 2000` | 构造失败 |
| `network_name = ""` | 构造失败 |
| `network_identity` 无 `network_name` | 构造失败 |
| `peer.uri = "udp://..."` | 构造失败 |
| `peer.uri = "tcp://[::1]:11010"` | 构造失败（IPv6） |
| `ipv4 = "abc"` | 静默忽略 |
| `dhcp = "10.0.0.0/31"` | 构造失败（前缀 > 30） |
| `listeners = [...]` | 忽略 |

完整错误日志对照见 [配置诊断](/guide/config/diagnostics/)。
