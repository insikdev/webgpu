import { Cube } from "@mesh/cube";
import { AnimationRenderer } from "@shared/animation_renderer";
import { mat4 } from "gl-matrix";
import shader from "./shader.wgsl?raw";

export type GuiVar = Pick<Required<GPUPrimitiveState>, "cullMode">;

export class Renderer extends AnimationRenderer {
  private constructor(canvas: HTMLCanvasElement, private guiVar: GuiVar) {
    super(canvas);
  }

  public static async create(canvas: HTMLCanvasElement, guiVar: GuiVar) {
    const renderer = new Renderer(canvas, guiVar);
    if (!(await renderer.initializeWebGPU())) {
      return null;
    }
    return renderer;
  }

  protected override initAssets() {
    this.mesh = new Cube(this.device);
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
      },
      primitive: { cullMode: this.guiVar.cullMode, frontFace: "cw" }
    });
  }

  protected override async render() {
    const mvpMatrix = mat4.create();

    const modelMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();

    mat4.rotateX(modelMatrix, modelMatrix, this.time);
    mat4.rotateY(modelMatrix, modelMatrix, this.time);
    mat4.rotateZ(modelMatrix, modelMatrix, this.time);
    mat4.scale(modelMatrix, modelMatrix, [0.5, 0.5, 0.5]);

    mat4.lookAt(viewMatrix, [0, 0, 2], [0, 0, 0], [0, 1, 0]);
    mat4.perspective(projectionMatrix, Math.PI / 4, 1, 0, 100);
    mat4.multiply(projectionMatrix, projectionMatrix, viewMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, modelMatrix);

    const mvpBuffer = this.device.createBuffer({
      size: 4 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const uniformBufferGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: mvpBuffer } }]
    });

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

    this.device.queue.writeBuffer(mvpBuffer, 0, mvpMatrix as Float32Array);

    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, this.mesh.vertexBuffer);
    pass.setIndexBuffer(this.mesh.indexBuffer, "uint32");
    pass.setBindGroup(0, uniformBufferGroup);

    pass.drawIndexed(this.mesh.indices.length);

    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }
}
