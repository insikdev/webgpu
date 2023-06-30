import * as dat from "dat.gui";
import { GuiVar, Renderer } from "./renderer";

async function main() {
  const guiVar: GuiVar = {
    light: { pos: { x: 0, y: 0, z: 0 } },
    camera: { x: 0, y: 0, z: 3 }
  };

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

  const light = gui.addFolder("light");
  const lightPos = light.addFolder("position");
  light.open();
  lightPos.open();
  lightPos.add(guiVar.light.pos, "x", -5, 5, 0.1).onChange(renderer.startRendering);
  lightPos.add(guiVar.light.pos, "y", -5, 5, 0.1).onChange(renderer.startRendering);
  lightPos.add(guiVar.light.pos, "z", -5, 5, 0.1).onChange(renderer.startRendering);

  const camera = gui.addFolder("camera");

  camera.open();

  camera.add(guiVar.camera, "x", -10, 10, 0.1).onChange(renderer.startRendering);
  camera.add(guiVar.camera, "y", -10, 10, 0.1).onChange(renderer.startRendering);
  camera.add(guiVar.camera, "z", -10, 10, 0.1).onChange(renderer.startRendering);

  renderer.startRendering();
}

main();
