---
title: 配置模型
---

## 配置说明

EasyTier 拥有丰富的选项，其使用 TOML 作为配置格式，本项目也使用同样的配置文本，并且将其作为构造 `et::Inst` 时的必填项，力求在可用参数中对齐上游的 TOML 参数，并且忽略未支持的参数，因此，理论上你可以无痛移植 EasyTier 的配置文件文本到本项目。

## 构造时发生什么

```text
读取 TOML
  → 解析支持的字段（类型/取值严格校验，不支持的字段忽略）
  → 补齐身份（hostname / instance_name / UUID）
  → 结构校验（入口、地址、MTU、网络名）
  → 准备运行所需资源
```

任何一步失败都会让构造失败（`valid() == false`），具体原因输出到日志。

## 缺省值 + 覆盖

未给出的字段保留缺省值：

```toml
# 只写网络身份和入口
[network_identity]
network_name = "esp-demo"

[[peer]]
uri = "tcp://192.0.2.10:11010"

ipv4 = "10.144.144.10/24"
```

等价于：

```toml
instance_name = "Espressif"   # 实际由 hostname 推导
hostname = "Espressif"
dhcp = false
ipv4 = "10.144.144.10/24"
mtu = 1380
enable_encryption = true
network_name = "esp-demo"
network_secret = ""
```

## 优先级

| 场景 | 结果 |
| --- | --- |
| `ipv4` 与 `dhcp` 同时出现 | 静态地址优先，`dhcp` 被关闭 |
| `network_identity` 表存在但缺 `network_name` | 构造失败 |
| `flags.enable_encryption` 与 `enableEncryption` 同时出现 | 按表内顺序，后写覆盖先写（不建议） |
| 未知根键 / 未知表键 | 忽略，不报错 |
| 支持的字段类型/取值错误 | 构造失败 |

## 修改配置

运行期不能改配置。需要改网络名、入口、MTU 等，重建实例：

```cpp
std::optional<et::Inst> g_inst;
// ······
g_inst.reset();                 // 析构旧实例
g_inst.emplace(new_toml, opt);  // 用新 TOML 构造
```

连接开关是例外：用 `connect()` / `disconnect()` 控制，不需要重建。

## 读取生效配置

```cpp
et::Settings cfg = inst.get_config_info();
ESP_LOGI(TAG, "network=%s mtu=%u encryption=%d peers=%u",
         cfg.network_name.c_str(), cfg.mtu, cfg.enable_encryption,
         static_cast<unsigned>(cfg.peers.size()));
```

注意：

- `network_secret` 恒为空，可安全打印；
- `instance_name` / `hostname` / `instance_id` 是**补齐后**的值；
- `peers` 是解析后的 host/port，不含 `tcp://` 前缀；
- 构造失败时返回缺省 `Settings`，先用 `valid()` 判断。

## 配置与运行期状态

| 配置项 | 运行期是否可变 |
| --- | --- |
| 网络名 / 密钥 | 否，重建实例 |
| 入口列表 | 否，重建实例 |
| MTU | 否，重建实例 |
| 加密开关 | 否，重建实例 |
| 连接开关 | 是，`connect()` / `disconnect()` |
| 虚拟地址 | DHCP 可能运行期变化；静态地址固定 |

下一步：[TOML 字段参考](/guide/config/toml-reference/)。
