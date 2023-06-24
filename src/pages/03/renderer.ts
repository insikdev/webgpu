import { BaseRenderer } from "@shared/base_renderer";
import { createCircle } from "@shared/mesh";
import { mat4 } from "gl-matrix";
import shader from "./shader.wgsl?raw";

export class Renderer extends BaseRenderer {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  protected override createRenderPipeline() {
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
    });
  }

  protected override render(_: number, totalTime: number) {
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
    mat4.fromZRotation(earthRotate, totalTime);
    mat4.fromTranslation(earthTranslate, [0.5, 0, 0]);

    mat4.multiply(earthTransform, earthRotate, earthTranslate);

    mat4.fromScaling(moonScale, [0.5, 0.5, 1]);
    mat4.fromZRotation(moonRotate, totalTime * 5);
    mat4.fromTranslation(moonTranslate, [0.25, 0, 0]);
    // 원점에서 달의 움직임 구현 후 원점을 지구로 이동시킨다
    mat4.multiply(moonTransform, moonScale, moonRotate);
    mat4.multiply(moonTransform, moonTransform, moonTranslate);
    mat4.multiply(moonTransform, earthTransform, moonTransform);

    const uniformBuffer = this.device.createBuffer({
      size: 64 * 3,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const uniformBufferData = new Float32Array(4 * 4 * 3);
    uniformBufferData.set(sunTransform, 0);
    uniformBufferData.set(earthTransform, 4 * 4);
    uniformBufferData.set(moonTransform, 4 * 4 * 2);

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
