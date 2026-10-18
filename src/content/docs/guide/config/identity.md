---
title: 身份与实例名
description: hostname、instance_name、instance_id 的缺省规则与 UUID 行为。
---

## 三个字段

| 字段 | 作用 | 缺省 |
| --- | --- | --- |
| `hostname` | 主机名，出现在节点信息里 | `Espressif` |
| `instance_name` | 实例名，用于标识/日志 | 取 hostname |
| `instance_id` | 实例 UUID | 构造时生成 UUID v4 |

## hostname

```toml
hostname = "esp32-s3"
```

规范化规则（对齐上游）：

1. 去除控制字符；
2. 最多保留 **32 个 Unicode 码点**；
3. 如果全是控制字符，视为无效，回退 `Espressif`。

因此结果不会超过 128 字节。

## instance_name

```toml
instance_name = "esp32-s3-living-room"
```

- 显式给出后优先使用；
- 未给出时**取补齐后的 hostname**；
- 不是网络名，不影响握手；
- 每个实例独立。

`Settings::instance_name_explicit` 记录它是否显式配置，属于内部状态，一般不需要关心。

## instance_id

```toml
instance_id = "550e8400-e29b-41d4-a716-446655440000"
```

- 未给出：构造时生成 UUID v4 并缓存；
- 显式给出：保留原值，包括全零 UUID；
- 解析时忽略任意位置的连字符，要求恰好 32 个十六进制位。

### 为什么通常不用写

- 每次构造都会重新生成（如果未显式配置）；
- 实例重启后 UUID 会变化，这是预期行为；
- 只有需要稳定标识（例如对端按 UUID 识别）时才显式配置。

### 打印 UUID

`Settings::instance_id` 是 16 字节数组，不是字符串。示例代码：

```cpp
char buf[37];
snprintf(buf, sizeof(buf),
         "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
         id[0], id[1], id[2], id[3], id[4], id[5], id[6], id[7],
         id[8], id[9], id[10], id[11], id[12], id[13], id[14], id[15]);
```

## 读取生效值

```cpp
et::Settings cfg = inst.get_config_info();
ESP_LOGI(TAG, "instance=%s hostname=%s",
         cfg.instance_name.c_str(), cfg.hostname.c_str());
```

即使你没有写 `instance_name` / `hostname` / `instance_id`，这里也会看到补齐后的值。

## 常见问题


**1. 能不能用中文 hostname**

可以，但会被截断到 32 个 Unicode 码点，并去除控制字符。建议使用 ASCII，便于对端日志与工具处理。

**2. 全零 UUID 会被覆盖吗**

不会。显式给出的 UUID（包括全零）会被保留。
