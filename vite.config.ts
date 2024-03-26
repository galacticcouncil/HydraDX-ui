import { defineConfig, splitVendorChunkPlugin, Plugin } from "vite"
import react from "@vitejs/plugin-react"
import wasm from "vite-plugin-wasm"
import svgr from "vite-plugin-svgr"
import tsconfigPaths from "vite-tsconfig-paths"
import fs from "fs/promises"
import { resolve } from "node:path"
import { exec } from "child_process"
import Unfonts from "unplugin-fonts/vite"

import { SEO_METADATA } from "./src/seo.ts"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    build: {
      target: "esnext",
      outDir: "build",
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("src/assets")) {
              return "assets"
            }
          },
        },
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "esnext",
      },
    },
    esbuild: {
      logOverride: { "this-is-undefined-in-esm": "silent" },
    },
    plugins: [
      splitVendorChunkPlugin(),
      tsconfigPaths(),
      react({
        jsxImportSource: "@basilisk/jsx",
        babel: {
          plugins: ["@emotion/babel-plugin"],
        },
      }),
      wasm(),
      svgr(),
      Unfonts({
        custom: {
          display: "auto",
          preload: true,
          injectTo: "head-prepend",
          families: [
            {
              name: "ChakraPetch",
              local: "ChakraPetch",
              src: "./src/assets/fonts/ChakraPetch/*.ttf",
              transform(font) {
                font.name = font.basename
                font.local = font.basename
                return font
              },
            },
            {
              name: "FontOver",
              local: "FontOver",
              src: "./src/assets/fonts/FontOver/FontOver.ttf",
            },
          ],
        },
      }),
      transformIndexHtml(),
    ],
  }
})

function transformIndexHtml(
  options: {
    templatePath?: string
    indexFileName?: string
  } = {},
): Plugin {
  const { templatePath, indexFileName } = Object.assign(
    {
      indexFileName: "index.html",
      templatePath: "./index.template.html",
    },
    options,
  )

  return {
    name: "transform-index-html",
    apply: "build",
    config: async () => {
      const template = await fs.readFile(resolve(__dirname, templatePath))
      const { index, ...rest } = SEO_METADATA

      const processFiles = Object.keys(SEO_METADATA).map(async (path) => {
        const pageMeta = rest[path]
        const metadata = {
          ...index,
          ...pageMeta,
        }

        const pagePath = resolve(
          __dirname,
          `pages/${path.replace("index", "")}`,
        )
        const filePath = `${pagePath}/${indexFileName}`
        await fs.mkdir(pagePath, { recursive: true })

        return fs.writeFile(
          filePath,
          template
            .toString()
            .replace(/<%=\s*(\w+)\s*%>/gi, (_match, p1) => metadata[p1] || ""),
        )
      })

      await Promise.all(processFiles)
      return {
        build: {
          rollupOptions: {
            input: Object.fromEntries(
              Object.entries(SEO_METADATA).map(([path]) => {
                const entries = [
                  path,
                  resolve(
                    __dirname,
                    path === "index"
                      ? `pages/${indexFileName}`
                      : `pages/${path}/${indexFileName}`,
                  ),
                ]
                return entries
              }),
            ),
          },
        },
      }
    },
    closeBundle: () => {
      exec(`mv -f ./build/pages/* ./build && rm -rf ./pages`)
    },
  }
}
