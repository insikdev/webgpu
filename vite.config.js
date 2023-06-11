import { resolve } from "path";
import { defineConfig } from "vite";
import fs from "node:fs/promises";

async function generateHTML() {
  const pages = await fs.readdir("pages");
  const input = { main: resolve(__dirname, "index.html") };
  pages.forEach((page) => {
    input[page] = resolve(__dirname, `pages/${page}/index.html`);
  });
  return input;
}

export default defineConfig({
  base: "/webgpu/",
  build: { rollupOptions: { input: await generateHTML() } },
});
