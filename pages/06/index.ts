import * as dat from "dat.gui";
import { GuiVar, Renderer } from "./renderer";

async function main() {
  const guiVar: GuiVar = { cullMode: "back" };
  const modes: GPUCullMode[] = ["back", "front", "none"];

  const canvas = document.querySelector("canvas")!;
  const renderer = await Renderer.create(canvas, guiVar);
  if (!renderer) {
    const h1 = document.querySelector("h1")!;
    h1.innerText = "WebGPU Not Support";
    return;
  }

  const gui = new dat.GUI({ autoPlace: false });
  const customContainer = document.getElementById("container")!;
  customContainer.appendChild(gui.domElement);

  const cube = gui.addFolder("cube");
  cube.open();
  cube.add(guiVar, "cullMode", modes).onChange(renderer.restart);

  renderer.startRendering();
}

main();
