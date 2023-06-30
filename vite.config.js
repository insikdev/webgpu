import fs from "node:fs/promises";
import path from "path";
import { defineConfig } from "vite";

async function createInputOptions() {
  const input = { main: path.resolve(__dirname, "index.html") };
  const pages = await fs.readdir("pages");

  pages.forEach((page) => {
    input[page] = path.resolve(__dirname, `pages/${page}/index.html`);
  });

  return input;
}

export default defineConfig({
  base: "/webgpu/",
  build: {
    rollupOptions: { input: await createInputOptions() },
    target: "esnext"
  },
  resolve: {
    alias: { "@shared": path.resolve(__dirname, "src/shared"), "@mesh": path.resolve(__dirname, "src/mesh") }
  }
});
