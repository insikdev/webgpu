import { Circle } from "@mesh/circle";
import { AnimationRenderer } from "@shared/animation_renderer";
import { mat4 } from "gl-matrix";
import shader from "./shader.wgsl?raw";

export class Renderer extends AnimationRenderer {
  private constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  public static async create(canvas: HTMLCanvasElement) {
    const renderer = new Renderer(canvas);
    if (!(await renderer.initializeWebGPU())) {
      return null;
    }
    return renderer;
  }

  protected initAssets(): void {
    this.mesh = new Circle(this.device, 0.125);
  }

  protected override createRenderPipeline() {
    const module = this.device.createShaderModule({ code: shader });

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [this.mesh.vertexBufferLayout]
      },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [{ format: this.format }]
      }
    });
  }

  protected override render() {
    const sunMatrix = mat4.create();
    const earthMatrix = mat4.create();
    const moonMatrix = mat4.create();

    const distanceSunEarth = 0.6;
    const distanceEarthMoon = 0.2;

    {
      // EARTH : rotate -> translate
      mat4.rotateZ(earthMatrix, earthMatrix, this.time);
      mat4.translate(earthMatrix, earthMatrix, [distanceSunEarth, 0, 0]);
    }
    {
      // MOON : rotate -> translate -> earth
      mat4.rotateZ(moonMatrix, moonMatrix, this.time * 3);
      mat4.translate(moonMatrix, moonMatrix, [distanceEarthMoon, 0, 0]);
      // 원점에서 달의 움직임 구현 후 원점을 지구로 이동시킨다
      mat4.multiply(moonMatrix, earthMatrix, moonMatrix);
    }
    {
      // scale
      mat4.scale(sunMatrix, sunMatrix, [2, 2, 1]);
      mat4.scale(earthMatrix, earthMatrix, [0.5, 0.5, 1]);
      mat4.scale(moonMatrix, moonMatrix, [0.25, 0.25, 1]);
    }

    const uniformBufferData = new Float32Array(4 * 4 * 3);

    uniformBufferData.set(sunMatrix, 0);
    uniformBufferData.set(earthMatrix, 4 * 4);
    uniformBufferData.set(moonMatrix, 4 * 4 * 2);

    const uniformBuffer = this.device.createBuffer({
      size: uniformBufferData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    this.device.queue.writeBuffer(uniformBuffer, 0, uniformBufferData);

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: [0.3, 0.3, 0.3, 1],
          view: this.context.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store"
        }
      ]
    });

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
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
