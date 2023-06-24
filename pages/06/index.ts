import * as dat from "dat.gui";
import { GuiVar, Renderer } from "./renderer";

try {
  const guiVar: GuiVar = { cullmode: "back" };

  const canvas = document.querySelector("canvas")!;
  const renderer = new Renderer(canvas, guiVar);
  await renderer.initialize();

  const gui = new dat.GUI({ autoPlace: false });
  const customContainer = document.getElementById("container")!;
  customContainer.appendChild(gui.domElement);

  const cube = gui.addFolder("cube");
  cube
    .add(guiVar, "cullmode", ["back", "front", "none"])
    .onChange(renderer.restart);

  cube.open();

  renderer.startRendering();
} catch (error) {
  const h1 = document.querySelector("h1")!;
  h1.innerText = error as string;
}
