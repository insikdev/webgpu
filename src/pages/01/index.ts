import { initWebGPU } from "@shared/gpu";
import vs from "./vertex.wgsl?raw";
import fs from "./fragment.wgsl?raw";

async function main() {
  const canvas = document.querySelector("canvas")!;
  const { device, format, context } = await initWebGPU(canvas);

  const vsModule = device.createShaderModule({ code: vs });
  const fsModule = device.createShaderModule({ code: fs });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: vsModule, entryPoint: "vs" },
    fragment: { module: fsModule, entryPoint: "fs", targets: [{ format }] },
  });

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });

  pass.setPipeline(pipeline);
  pass.draw(3);
  pass.end();

  device.queue.submit([encoder.finish()]);
}

try {
  await main();
} catch (error) {
  const h1 = document.querySelector("h1")!;
  h1.innerText = "Web GPU NOT SUPPORT";
}
