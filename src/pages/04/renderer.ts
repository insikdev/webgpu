import { BaseRenderer } from "@shared/base_renderer";
import { createCircle } from "@shared/mesh";
import { mat4 } from "gl-matrix";
import shader from "./shader.wgsl?raw";

type GuiVar = {
  x: number;
  y: number;
  z: number;
};

export class Renderer extends BaseRenderer {
  constructor(canvas: HTMLCanvasElement, public guiVar: GuiVar) {
    super(canvas);
  }

  protected createRenderPipeline() {
    const module = this.device.createShaderModule({ code: shader });

    this.pipeline = this.device.createRenderPipeline({
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
      fragment: {
        module,
        entryPoint: "fs",
        targets: [{ format: this.format }],
      },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });
  }

  protected override render() {
    const { indices, vertices } = createCircle(0.05);
    const vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(vertexBuffer, 0, vertices);

    const indexBuffer = this.device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(indexBuffer, 0, indices);

    const transform1 = mat4.create();
    const scale1 = mat4.fromScaling(mat4.create(), [5, 5, 1]);
    const translate1 = mat4.fromTranslation(mat4.create(), [
      this.guiVar.x,
      this.guiVar.y,
      this.guiVar.z,
    ]);
    mat4.multiply(transform1, translate1, scale1);

    const transform2 = mat4.create();
    const scale2 = mat4.fromScaling(mat4.create(), [7, 7, 1]);
    const translate2 = mat4.fromTranslation(mat4.create(), [0.25, 0.25, 0.5]);
    mat4.multiply(transform2, translate2, scale2);

    const transform3 = mat4.create();
    const scale3 = mat4.fromScaling(mat4.create(), [9, 9, 1]);
    const translate3 = mat4.fromTranslation(
      mat4.create(),
      [-0.25, -0.25, 0.75]
    );
    mat4.multiply(transform3, translate3, scale3);

    const uniformBuffer = this.device.createBuffer({
      size: 64 * 3,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const uniformBufferData = new Float32Array(4 * 4 * 3);
    uniformBufferData.set(transform1, 0);
    uniformBufferData.set(transform2, 4 * 4);
    uniformBufferData.set(transform3, 4 * 4 * 2);

    this.device.queue.writeBuffer(uniformBuffer, 0, uniformBufferData);

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: [0.3, 0.3, 0.3, 1],
          view: this.context.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.device
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

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, "uint32");
    pass.setBindGroup(0, bindGroup);
    pass.drawIndexed(indices.length, 3);

    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }
}
