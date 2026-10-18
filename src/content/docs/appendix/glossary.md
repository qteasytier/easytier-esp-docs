---
title: 术语表
description: EasyTier-ESP 文档中常见术语的中英文与含义。
---

| 术语 | 英文 | 含义 |
| --- | --- | --- |
| 覆盖网络 | overlay | 建立在物理网络之上的虚拟网络 |
| 底层网络 | underlay | 承载入口连接的物理网络（Wi-Fi/以太网） |
| 节点 | peer / node | 虚拟网络中的一个设备 |
| peer id | peer id | 32 位节点标识；0 非法 |
| 入口 | entry / peer endpoint | ESP32 主动连接的 EasyTier 节点地址 |
| 虚拟 IP | virtual IP | 节点在 overlay 中的 IPv4 地址 |
| 下一跳 | next hop | 到目的节点路径上的第一个中转节点 |
| 中继 | relay | 转发其他节点数据的节点 |
| 拓扑 | topology | 节点与邻接关系的集合 |
| 邻接表 | connection list | 每行声明某节点的直连邻居 |
| 邻接位图 | connection bitmap | 用位图表示邻接关系 |
| 路由快照 | route snapshot | 控制面按值发布给数据面的只读路由表 |
| 握手 | handshake | 建立 peer 会话并校验网络身份 |
| 摘要 | digest | 网络名 + 密钥的 32 字节 SipHash 结果 |
| RPC | remote procedure call | 控制面请求/响应，当前用于路由同步 |
| 分片 | fragment | 把大 RPC 消息拆成多个报文 |
| 重组 | reassembly | 按事务/代际把分片还原 |
| MTU | maximum transmission unit | 虚拟网卡最大传输单元，默认 1380 |
| DHCP | dynamic host configuration protocol | 这里的“自分配”仅指本机地址分配 |
| 虚拟网卡 | virtual netif | lwIP raw L3 网卡 |
| raw L3 | raw layer 3 | 直接处理 IP 报文，不模拟以太网/ARP |
| AEAD | authenticated encryption with associated data | AES-128-GCM |
| PSA | Platform Security Architecture | mbedTLS 的加密 API |
| Kconfig | Kconfig | ESP-IDF 的编译期配置系统 |
| TOML | TOML | 组件的唯一配置格式 |
| 代际 | generation | 连接会话的递增标识，用于丢弃旧帧 |
| 实例 | instance | 一个 `et::Inst` 对象及其资源 |
| 可达路由 | reachable route | 快照中能到达的目的节点条目 |
| 直连对端 | direct peer | 已完成握手的入口连接 |
| 非安全模式 | non-secure mode | 不使用 Noise 的握手模式 |
| Noise | Noise Protocol | 上游的一种安全握手协议，本组件不支持 |
| Zstd | Zstandard | 上游可选压缩算法，本组件不支持 |
