import { Renderer } from "./renderer";

async function main() {
  const canvas = document.querySelector("canvas")!;
  const renderer = await Renderer.create(canvas);
  if (!renderer) {
    const h1 = document.querySelector("h1")!;
    h1.innerText = "WebGPU Not Support";
    return;
  }

  renderer.startRendering();
}

main();
