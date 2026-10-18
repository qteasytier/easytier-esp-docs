# AGENTS.md

EasyTier-ESP 文档站上下文指南，供后续 AI 代理快速理解本项目。

## 项目概述

本项目是 **EasyTier-ESP** 的官方文档网站，不是 QtEasyTier 文档站。站点使用 Astro + Starlight 构建，中文为主，地址为 **https://esp.qtet.cn**。

- 框架：Astro 5
- 主题：`@astrojs/starlight`
- 包管理器：pnpm
- 内容目录：`src/content/docs/`
- 主题色：紫色（`#8b5cf6` / `#7c3aed`），不要改回蓝色
- favicon：`public/favicon.png`，与 `src/assets/logo.png` 同源
- 路由：`ClientRouter`，侧栏滚动位置由 `Head.astro` 保持

## 常用命令

```bash
pnpm install
pnpm dev       # 本地开发，默认 4321 端口
pnpm build     # 构建到 dist/
pnpm preview   # 预览构建结果
```

## 内容结构

```text
src/content/docs/
├── index.mdx                 # 官网首页（splash）
├── 404.md
├── guide/
│   ├── index.md              # 文档导览
│   ├── getting-started/      # 能力矩阵、兼容性与硬件、示例项目
│   ├── lifecycle/            # 构造/启动/连接/停止、事件、错误、并发
│   ├── config/               # 配置模型、TOML 参考、地址、身份、诊断
│   ├── network/              # 网络模型
│   ├── tuning/               # 内存、Kconfig
│   └── porting/              # 支持范围
├── api/                      # API 总览、Inst、类型、片段
└── appendix/                 # 术语、常见问题、速查、链接
```

## 内容定位

- **首页是官网首页**：介绍特点、适用场景、兼容性与文档入口，**不要**在首页放使用步骤或大段代码。
- 文档以“如何使用组件”为主，不展开内部协议、任务模型、源码地图等实现细节。
- 新增页面要在 `astro.config.mjs` 的 `sidebar` 中登记。
- 已删除的实现细节页面（internals/testing 等）不要恢复，除非用户明确要求。

## 写作规范

- 每篇文档必须有 frontmatter：

  ```yaml
  ---
  title: 页面标题
  description: 一句话说明本页解决什么问题
  ---
  ```

- 正文从 `##` 开始，不要写 H1。
- 使用中文解释；API、字段名、日志关键字保留英文。
- 配置示例必须是占位符，禁止出现真实网络密钥、入口地址、Wi-Fi 密码。
- 区分事实等级：`已在 ESP32-S3-N16R8 验证`、`代码审查/静态分析`、`未支持`。
- 不把未验证的芯片、ESP-IDF 版本、未实现功能写成“支持”。

## 关键事实（改文档前先核对）

- 公开 API 只有 `et::Inst`，RAII；构造接收 TOML 文本。
- TOML 是唯一配置入口；不支持的字段忽略，支持字段写错会让构造失败。
- 唯一例外：`ipv4` 字符串内容无法解析时静默忽略。
- `ipv4` 与 `dhcp` 同时出现时静态地址优先。
- 默认 MTU 1380，范围 576..1380。
- DHCP 回落子网 `10.126.126.0/24`。
- `instance_name` 默认取 hostname；hostname 默认 `Espressif`；UUID 缺省生成 v4。
- `get_config_info()` 返回副本，`network_secret` 恒为空。
- 连接槽默认 6，范围 1..8；拓扑上限 32 节点。
- 仅 TCP 客户端；无监听、Noise/KCP/QUIC、代理/子网路由、广播/组播。
- `PeerDown` 事件预留，当前不产生。

## 不要做

- 不要恢复 QtEasyTier 的旧内容、旧图片、旧链接、旧备案信息。
- 不要使用蓝色主题。
- 不要在首页写“快速开始”步骤或大段示例代码。
- 不要把 `listeners`、`routes`、`proxy_network` 等未实现字段写成可用。
- 不要承诺固定吞吐/内存数字；给测量方法。
- 不要在文档中写入真实密钥或用户本地配置。
- 不要只改配置不跑 `pnpm build`。

## 验证

提交前至少执行：

```bash
pnpm build
```

确认没有死链、没有 MDX 语法错误、侧边栏所有 slug 都能生成页面。
