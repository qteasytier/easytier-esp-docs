# EasyTier-ESP 文档站

本仓库是 [EasyTier-ESP](https://cnb.cool/myqfeng/qteasytier/easytier-esp) 的官方文档网站源码，站点地址：

**https://esp.qtet.cn**

EasyTier-ESP 是一个使用 C++20 编写的 ESP-IDF 组件，用于把 ESP32 接入既有的 EasyTier 虚拟网络。当前适配 ESP-IDF 6.1.x，已在 ESP32-S3-N16R8 上验证。

## 相关链接

| 项目 | 地址 |
| --- | --- |
| 文档站 | https://esp.qtet.cn |
| 主仓库（CNB） | https://cnb.cool/myqfeng/qteasytier/easytier-esp |
| 主仓库（GitHub 镜像） | https://github.com/easytier/easytier-esp |
| ESP 组件注册表 | https://components.espressif.com/components/myqfeng/easytier-esp |
| 上游 EasyTier | https://github.com/EasyTier/EasyTier |

## 技术栈

- [Astro](https://astro.build/) 5
- [Starlight](https://starlight.astro.build/) 文档主题
- Mermaid：网络拓扑与流程示意
- Pagefind：站内搜索（Starlight 默认集成）
- 包管理器：pnpm

## 本地开发

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # 输出到 dist/
pnpm preview    # 预览构建结果
```

## 目录结构

```text
easytier-esp-docs/
├── astro.config.mjs          # 站点信息、侧边栏、搜索、社交链接
├── src/
│   ├── assets/logo.png       # 站点 logo（紫色）
│   ├── components/override/
│   │   └── Head.astro        # 粒子背景 + Mermaid + 侧栏滚动保持
│   ├── content/docs/         # 文档正文
│   │   ├── index.mdx         # 官网首页
│   │   ├── guide/            # 开始使用、生命周期、配置、网络、调优
│   │   ├── api/              # API 参考
│   │   └── appendix/         # 术语、常见问题、速查、链接
│   └── styles/global.css     # 紫色主题与全局样式
├── public/                   # favicon、OG 图等静态资源
└── README.md
```

## 内容定位

- **首页**：官网定位，介绍组件特点、适用场景、兼容性与文档入口，不直接写使用步骤。
- **开始使用**：组件定位、能力、兼容性与示例项目。
- **生命周期与配置**：如何把组件接进自己的应用。
- **API 与常见问题**：查接口、看高频问题。
- 不展开内部协议、任务模型、源码地图等实现细节。

## 写作约定

- 中文为主，技术名词保留英文原文（peer、TOML、Kconfig、lwIP 等）。
- 每篇文档使用 Starlight frontmatter：`title`、`description`。
- 正文从 `##` 开始，页面标题由 frontmatter 渲染。
- 配置示例统一使用占位符，例如 `<YOUR_NETWORK_SECRET>`、`192.0.2.10`，**不要写入真实密钥、入口地址或 Wi-Fi 密码**。
- 结论要标注验证状态：`已在 ESP32-S3-N16R8 验证`、`代码审查`、`未支持`。
- 不把未验证的芯片、ESP-IDF 版本或未实现的功能写成“已支持”。

## 主题

- 主色：紫色（`#8b5cf6` / `#7c3aed`），取自项目 logo。
- 深色模式为默认视觉基准，浅色模式同步适配。
- favicon、logo、OG 图均由项目 logo 生成，保持统一。

## 部署

`pnpm build` 生成静态文件到 `dist/`，可部署到任意静态托管（CNB Pages、GitHub Pages、Nginx 等）。站点 canonical 地址在 `astro.config.mjs` 的 `site` 字段配置。

## 许可证

文档内容与主项目保持一致，采用 **LGPL-3.0**。详见 [LICENSE](./LICENSE)。
