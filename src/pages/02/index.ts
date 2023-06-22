import { initWebGPU } from "@shared/gpu";
import { createCircle } from "@shared/mesh";
import shader from "./shader.wgsl?raw";

function createPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const module = device.createShaderModule({ code: shader });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vs",
      buffers: [
        {
          arrayStride: 4 * 2,
          attributes: [{ shaderLocation: 0, format: "float32x2", offset: 0 }],
        },
      ],
    },
    fragment: { module, entryPoint: "fs", targets: [{ format }] },
  });

  return pipeline;
}

async function render(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  context: GPUCanvasContext
) {
  const { indices, vertices } = createCircle();

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
  const canvas = document.querySelector("canvas")!;
  const { device, format, context } = await initWebGPU(canvas);
  const pipeline = createPipeline(device, format);

  await render(device, pipeline, context);
} catch (error) {
  const h1 = document.querySelector("h1")!;
  h1.innerText = "Web GPU NOT SUPPORT";
}
