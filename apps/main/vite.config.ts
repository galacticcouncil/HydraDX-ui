/* eslint-disable no-restricted-imports */
import fs from "node:fs"

import mdx from "@mdx-js/rollup"
import babel from "@rolldown/plugin-babel"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import remarkGfm from "remark-gfm"
import { defineConfig, loadEnv, type Plugin } from "vite"
import { createHtmlPlugin } from "vite-plugin-html"
import { VitePWA } from "vite-plugin-pwa"
import svgr from "vite-plugin-svgr"
import wasm from "vite-plugin-wasm"

import { PROVIDERS } from "./src/config/rpc"
import { SEO_CONFIG } from "./src/config/seo"

const headInlineScript = fs.readFileSync("./src/utils/head.js", "utf-8")

const rpcPingScript = fs.readFileSync("./src/utils/rpc-ping.js", "utf-8")

const loaderHtml = fs.readFileSync(
  "./src/components/Loader/loader.html",
  "utf-8",
)

const headCriticalCss = fs.readFileSync("./src/styles/critical.css", "utf-8")

const PRELOADED_FONTS = /^(GeistRegular|GazpachoMedium)-[\w-]+\.woff2$/

const fontPreload = (): Plugin => {
  let base = "/"
  return {
    name: "font-preload",
    apply: "build",
    configResolved: (config) => {
      base = config.base
    },
    transformIndexHtml: {
      order: "post",
      handler: (_html, { bundle }) =>
        Object.keys(bundle ?? {})
          .filter((file) => PRELOADED_FONTS.test(file.split("/").pop() ?? ""))
          .map((file) => ({
            tag: "link",
            injectTo: "head-prepend" as const,
            attrs: {
              rel: "preload",
              as: "font",
              type: "font/woff2",
              crossorigin: "",
              href: base + file,
            },
          })),
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const rpcUrls = PROVIDERS.filter((provider) =>
    provider.env.includes(env.VITE_ENV ?? ""),
  ).map(({ url }) => url)
  const rpcPingInlineScript = rpcPingScript.replace(
    "__RPC_URLS__",
    JSON.stringify(rpcUrls),
  )

  return {
    server: {
      host: "0.0.0.0",
    },
    resolve: {
      tsconfigPaths: true,
    },
    build: {
      target: "es2022",
      outDir: "build",
      rolldownOptions: {
        output: {
          chunkFileNames: "chunk-[hash].js",
        },
      },
    },
    plugins: [
      ...(mode !== "production" ? [devtools()] : []),
      mdx({
        remarkPlugins: [remarkGfm],
        providerImportSource: "@mdx-js/react",
      }),
      tanstackRouter({
        autoCodeSplitting: true,
      }),
      react({
        jsxImportSource: "@galacticcouncil/ui/jsx",
      }),
      babel({
        include: /\.[jt]sx?$/,
        exclude: /node_modules/,
        plugins: ["@emotion/babel-plugin"],
      }),
      wasm(),
      svgr({
        svgrOptions: {
          svgo: true,
        },
      }),
      createHtmlPlugin({
        minify: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          decodeEntities: true,
          minifyCSS: true,
          minifyJS: true,
          removeComments: true,
        },
        inject: {
          tags: [
            {
              injectTo: "head-prepend",
              tag: "script",
              children: headInlineScript,
            },
            {
              injectTo: "head-prepend",
              tag: "script",
              children: rpcPingInlineScript,
            },
            {
              injectTo: "head-prepend",
              tag: "style",
              children: headCriticalCss,
            },
            {
              injectTo: "body-prepend",
              tag: "div",
              children: loaderHtml,
            },
            ...SEO_CONFIG,
          ],
        },
      }),
      fontPreload(),
      VitePWA({
        strategies: "injectManifest",
        registerType: "autoUpdate",
        srcDir: "src",
        filename: "sw.ts",
        injectRegister: null,
        manifest: false,
        injectManifest: {
          globPatterns: ["**/*.js"],
          maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  }
})
