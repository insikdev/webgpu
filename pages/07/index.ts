import * as dat from "dat.gui";
import { GuiVar, Renderer } from "./renderer";

async function main() {
  const guiVar: GuiVar = { camera: { x: 0, y: 0, z: 3 } };

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

  const camera = gui.addFolder("camera");

  camera.open();

  camera.add(guiVar.camera, "x", -5, 5, 0.1).onChange(renderer.startRendering);
  camera.add(guiVar.camera, "y", -5, 5, 0.1).onChange(renderer.startRendering);
  camera
    .add(guiVar.camera, "z", -10, 10, 0.1)
    .onChange(renderer.startRendering);

  renderer.startRendering();
}

main();
