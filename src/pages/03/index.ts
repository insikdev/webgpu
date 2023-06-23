import { initWebGPU } from "@shared/gpu";
import { createCircle } from "@shared/mesh";
import { mat4 } from "gl-matrix";
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
  context: GPUCanvasContext,
  dt: number
) {
  const { indices, vertices } = createCircle(0.05);
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, indices);

  const sunTransform = mat4.create();
  const sunScale = mat4.create();

  const earthTransform = mat4.create();
  const earthRotate = mat4.create();
  const earthTranslate = mat4.create();

  const moonTransform = mat4.create();
  const moonScale = mat4.create();
  const moonRotate = mat4.create();
  const moonTranslate = mat4.create();

  mat4.fromScaling(sunScale, [2, 2, 1]);
  mat4.multiply(sunTransform, sunScale, sunTransform);

  // Scale x Rotate x Trasnlate 순서 (SRT)
  mat4.fromZRotation(earthRotate, dt);
  mat4.fromTranslation(earthTranslate, [0.5, 0, 0]);

  mat4.multiply(earthTransform, earthRotate, earthTranslate);

  mat4.fromScaling(moonScale, [0.5, 0.5, 1]);
  mat4.fromZRotation(moonRotate, dt * 5);
  mat4.fromTranslation(moonTranslate, [0.25, 0, 0]);
  // 원점에서 달의 움직임 구현 후 원점을 지구로 이동시킨다
  mat4.multiply(moonTransform, moonScale, moonRotate);
  mat4.multiply(moonTransform, moonTransform, moonTranslate);
  mat4.multiply(moonTransform, earthTransform, moonTransform);

  const uniformBuffer = device.createBuffer({
    size: 64 * 3,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const uniformBufferData = new Float32Array(4 * 4 * 3);
  uniformBufferData.set(sunTransform, 0);
  uniformBufferData.set(earthTransform, 4 * 4);
  uniformBufferData.set(moonTransform, 4 * 4 * 2);

  device.queue.writeBuffer(uniformBuffer, 0, uniformBufferData);

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

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  pass.setPipeline(pipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, "uint32");
  pass.setBindGroup(0, bindGroup);
  pass.drawIndexed(indices.length, 3);

  pass.end();

  device.queue.submit([encoder.finish()]);
  requestAnimationFrame(() => render(device, pipeline, context, dt + 0.01));
}

try {
  const canvas = document.querySelector("canvas")!;
  const { device, format, context } = await initWebGPU(canvas);
  const pipeline = createPipeline(device, format);

  await render(device, pipeline, context, 0);
} catch (error) {
  const h1 = document.querySelector("h1")!;
  h1.innerText = "Web GPU NOT SUPPORT";
}
