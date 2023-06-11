import path from "path";
import { defineConfig } from "vite";
import fs from "node:fs/promises";

async function generateHTML() {
  const pages = await fs.readdir("src/pages");
  const input = { main: path.resolve(__dirname, "src/pages/index.html") };
  pages
    .filter((page) => !page.includes("html"))
    .forEach((page) => {
      input[page] = path.resolve(__dirname, `src/pages/${page}/index.html`);
    });
  return input;
}

export default defineConfig({
  base: "/webgpu/",
  root: path.resolve(__dirname, "src/pages"),
  build: {
    rollupOptions: { input: await generateHTML() },
    outDir: path.resolve(__dirname, "dist"),
    target: "esnext",
  },
  resolve: { alias: { "@shared": path.resolve(__dirname, "src/shared") } },
});
