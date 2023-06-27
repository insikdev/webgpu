import * as dat from "dat.gui";
import { GuiVar, Renderer } from "./renderer";

async function main() {
  const guiVar: GuiVar = { x: 0, y: 0, z: 0 };
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

  const redCircle = gui.addFolder("red circle");
  redCircle.open();

  redCircle.add(guiVar, "x", -1, 1, 0.1).onChange(renderer.startRendering);
  redCircle.add(guiVar, "y", -1, 1, 0.1).onChange(renderer.startRendering);
  redCircle.add(guiVar, "z", 0, 0.9, 0.1).onChange(renderer.startRendering);

  renderer.startRendering();
}

main();
