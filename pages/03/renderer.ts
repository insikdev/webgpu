import { BaseRenderer } from "@shared/base_renderer";
import { CircleMesh } from "@shared/circle_mesh";
import { mat4 } from "gl-matrix";
import shader from "./shader.wgsl?raw";

export class Renderer extends BaseRenderer {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  protected initAssets(): void {
    this.mesh = new CircleMesh(this.device, 0.125);
  }

  protected override createRenderPipeline() {
    const module = this.device.createShaderModule({ code: shader });

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [this.mesh.vertexBufferLayout],
      },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [{ format: this.format }],
      },
    });
  }

  protected override render(_: number, totalTime: number) {
    const sunMatrix = mat4.create();
    const earthMatrix = mat4.create();
    const moonMatrix = mat4.create();

    const scaleMatrix = mat4.create();
    const rotateMatrix = mat4.create();
    const translateMatrix = mat4.create();

    {
      // sun
      mat4.multiply(sunMatrix, scaleMatrix, sunMatrix);
    }
    {
      // earth
      mat4.fromZRotation(rotateMatrix, totalTime);
      mat4.fromTranslation(translateMatrix, [0.6, 0, 0]);

      mat4.multiply(earthMatrix, rotateMatrix, translateMatrix);
      mat4.multiply(earthMatrix, earthMatrix, scaleMatrix);
    }
    {
      // moon
      mat4.fromZRotation(rotateMatrix, totalTime * 3);
      mat4.fromTranslation(translateMatrix, [0.2, 0, 0]);

      mat4.multiply(moonMatrix, rotateMatrix, translateMatrix);
      mat4.multiply(moonMatrix, moonMatrix, scaleMatrix);
      // 원점에서 달의 움직임 구현 후 원점을 지구로 이동시킨다
      mat4.multiply(moonMatrix, earthMatrix, moonMatrix);
    }
    {
      mat4.fromScaling(scaleMatrix, [0.25, 0.25, 1]);
      mat4.multiply(moonMatrix, moonMatrix, scaleMatrix);

      mat4.fromScaling(scaleMatrix, [0.5, 0.5, 1]);
      mat4.multiply(earthMatrix, earthMatrix, scaleMatrix);
    }

    const uniformBuffer = this.device.createBuffer({
      size: 64 * 3,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const uniformBufferData = new Float32Array(4 * 4 * 3);
    uniformBufferData.set(sunMatrix, 0);
    uniformBufferData.set(earthMatrix, 4 * 4);
    uniformBufferData.set(moonMatrix, 4 * 4 * 2);

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
    pass.setVertexBuffer(0, this.mesh.vertexBuffer);
    pass.setIndexBuffer(this.mesh.indexBuffer, "uint32");
    pass.setBindGroup(0, bindGroup);
    pass.drawIndexed(this.mesh.indices.length, 3);

    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }
}
