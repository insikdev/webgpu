import { initWebGPU } from "@shared/gpu";
import { triangle } from "@shared/vertex";
import fs from "./fragment.wgsl?raw";
import vs from "./vertex.wgsl?raw";

async function main() {
  const canvas = document.querySelector("canvas")!;
  const { device, format, context } = await initWebGPU(canvas);

  const vsModule = device.createShaderModule({ code: vs });
  const fsModule = device.createShaderModule({ code: fs });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: vsModule,
      entryPoint: "vs",
      buffers: [
        {
          arrayStride: 4 * 2,
          attributes: [{ shaderLocation: 0, format: "float32x2", offset: 0 }],
        },
      ],
    },
    fragment: { module: fsModule, entryPoint: "fs", targets: [{ format }] },
  });

  const { indices, vertices } = triangle;

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertices);
  device.queue.writeBuffer(indexBuffer, 0, indices);

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        clearValue: [0.3, 0.3, 0.3, 1],
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });

  pass.setPipeline(pipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, "uint32");
  pass.drawIndexed(indices.length);
  pass.end();

  device.queue.submit([encoder.finish()]);
}

try {
  await main();
} catch (error) {
  const h1 = document.querySelector("h1")!;
  h1.innerText = "Web GPU NOT SUPPORT";
}
