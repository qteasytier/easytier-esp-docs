import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

// EasyTier-ESP 文档站
// 站点地址：https://esp.qtet.cn
// 内容目录：src/content/docs
export default defineConfig({
  site: "https://esp.qtet.cn",
  // 悬停预取文档页，侧栏导航更快
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  image: {
    // 组件截图与示意图保持原图，避免二次压缩
    service: {
      entrypoint: "astro/assets/services/noop",
    },
  },
  integrations: [
    react(),
    starlight({
      title: "EasyTier-ESP",
      description:
        "把 ESP32 接入 EasyTier 虚拟网络的 ESP-IDF 组件文档：项目介绍、TOML 配置、API 与常见问题。",
      defaultLocale: "root",
      locales: {
        root: {
          label: "简体中文",
          lang: "zh-CN",
        },
      },
      favicon: "/favicon.png",
      customCss: ["./src/styles/global.css"],
      logo: {
        src: "./src/assets/logo.png",
        alt: "EasyTier-ESP",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/easytier/easytier-esp",
        },
      ],
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://esp.qtet.cn/og-image.png",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:card",
            content: "summary_large_image",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "theme-color",
            content: "#7c3aed",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "apple-touch-icon",
            href: "/apple-touch-icon.png",
          },
        },
      ],
      // 自定义 Head：粒子背景 + Mermaid 客户端渲染
      components: {
        Head: "./src/components/override/Head.astro",
      },
      sidebar: [
        {
          label: "开始使用",
          items: [
            { slug: "guide" },
            { slug: "guide/getting-started/capabilities" },
            { slug: "guide/getting-started/requirements" },
            { slug: "guide/getting-started/example-project" },
            { slug: "guide/getting-started/network-model" },
          ],
        },
        {
          label: "生命周期与集成",
          items: [
            { slug: "guide/lifecycle/overview" },
            { slug: "guide/lifecycle/underlay" },
            { slug: "guide/lifecycle/state-events" },
            { slug: "guide/lifecycle/errors" },
            { slug: "guide/lifecycle/concurrency" },
          ],
        },
        {
          label: "配置参考",
          items: [
            { slug: "guide/config/model" },
            { slug: "guide/config/toml-reference" },
            { slug: "guide/config/addressing" },
            { slug: "guide/config/identity" },
            { slug: "guide/config/diagnostics" },
          ],
        },
        {
          label: "资源与设置",
          items: [
            { slug: "guide/resource/memory" },
            { slug: "guide/resource/kconfig" },
          ],
        },
        {
          label: "API 参考",
          items: [
            { slug: "api" },
            { slug: "api/inst" },
            { slug: "api/types" },
            { slug: "api/snippets" },
          ],
        },
        {
          label: "附录",
          items: [
            { slug: "appendix/glossary" },
            { slug: "appendix/faq" },
            { slug: "appendix/cheatsheet" },
            { slug: "appendix/links" },
          ],
        },
      ],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});
