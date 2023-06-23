import { initWebGPU } from "@shared/gpu";
import { createCircle } from "@shared/mesh";
import * as dat from "dat.gui";
import { mat4 } from "gl-matrix";
import shader from "./shader.wgsl?raw";

const gui_translate = { x: 0, y: 0, z: 0 };

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
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less",
    },
  });

  return pipeline;
}

async function render(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  context: GPUCanvasContext
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

  const transform1 = mat4.create();
  const scale1 = mat4.fromScaling(mat4.create(), [5, 5, 1]);
  const translate1 = mat4.fromTranslation(mat4.create(), [
    gui_translate.x,
    gui_translate.y,
    gui_translate.z,
  ]);
  mat4.multiply(transform1, translate1, scale1);

  const transform2 = mat4.create();
  const scale2 = mat4.fromScaling(mat4.create(), [7, 7, 1]);
  const translate2 = mat4.fromTranslation(mat4.create(), [0.25, 0.25, 0.5]);
  mat4.multiply(transform2, translate2, scale2);

  const transform3 = mat4.create();
  const scale3 = mat4.fromScaling(mat4.create(), [9, 9, 1]);
  const translate3 = mat4.fromTranslation(mat4.create(), [-0.25, -0.25, 0.75]);
  mat4.multiply(transform3, translate3, scale3);

  const uniformBuffer = device.createBuffer({
    size: 64 * 3,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const uniformBufferData = new Float32Array(4 * 4 * 3);
  uniformBufferData.set(transform1, 0);
  uniformBufferData.set(transform2, 4 * 4);
  uniformBufferData.set(transform3, 4 * 4 * 2);

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
    depthStencilAttachment: {
      view: device
        .createTexture({
          format: "depth24plus",
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
          size: [720, 720, 1],
        })
        .createView(),
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
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
}

try {
  const gui = new dat.GUI({ autoPlace: false });
  const customContainer = document.getElementById("container")!;
  customContainer.appendChild(gui.domElement);

  const redCircle = gui.addFolder("red circle");
  redCircle.open();

  redCircle
    .add(gui_translate, "x", -1, 1, 0.1)
    .onChange(() => render(device, pipeline, context));
  redCircle
    .add(gui_translate, "y", -1, 1, 0.1)
    .onChange(() => render(device, pipeline, context));
  redCircle
    .add(gui_translate, "z", 0, 0.9, 0.1)
    .onChange(() => render(device, pipeline, context));

  const canvas = document.querySelector("canvas")!;
  const { device, format, context } = await initWebGPU(canvas);
  const pipeline = createPipeline(device, format);

  await render(device, pipeline, context);
} catch (error) {
  const h1 = document.querySelector("h1")!;
  h1.innerText = "Web GPU NOT SUPPORT";
}
