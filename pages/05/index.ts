import { Renderer } from "./renderer";

try {
  const canvas = document.querySelector("canvas")!;
  const renderer = new Renderer(canvas);
  await renderer.initialize();

  renderer.startRendering();
} catch (error) {
  const h1 = document.querySelector("h1")!;
  h1.innerText = error as string;
}
