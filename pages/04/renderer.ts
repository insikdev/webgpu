import { Circle } from "@mesh/circle";
import { AnimationRenderer } from "@shared/animation_renderer";
import { mat4 } from "gl-matrix";
import shader from "./shader.wgsl?raw";

export type GuiVar = { pos: XYZ };

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

  protected override initAssets(): void {
    this.mesh = new Circle(this.device, 0.05);
  }

  protected createRenderPipeline() {
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
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less"
      }
    });
  }

  protected override render() {
    const viewMatrix = mat4.create();
    const perspectiveMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0, 0, 3], [0, 0, 0], [0, 1, 0]);
    mat4.perspective(perspectiveMatrix, Math.PI * 0.3, 1, 0.001, 10);

    const transform1 = mat4.create();
    const scale1 = mat4.fromScaling(mat4.create(), [7, 7, 1]);
    const translate1 = mat4.fromTranslation(mat4.create(), [this.guiVar.pos.x, this.guiVar.pos.y, this.guiVar.pos.z]);
    mat4.multiply(transform1, translate1, scale1);

    mat4.multiply(transform1, viewMatrix, transform1);
    mat4.multiply(transform1, perspectiveMatrix, transform1);

    const transform2 = mat4.create();
    const scale2 = mat4.fromScaling(mat4.create(), [7, 7, 1]);
    const translate2 = mat4.fromTranslation(mat4.create(), [0.25, 0.25, 0.5]);
    mat4.multiply(transform2, translate2, scale2);
    mat4.multiply(transform2, viewMatrix, transform2);
    mat4.multiply(transform2, perspectiveMatrix, transform2);

    const transform3 = mat4.create();
    const scale3 = mat4.fromScaling(mat4.create(), [9, 9, 1]);
    const translate3 = mat4.fromTranslation(mat4.create(), [-0.25, -0.25, 0.75]);
    mat4.multiply(transform3, translate3, scale3);
    mat4.multiply(transform3, viewMatrix, transform3);
    mat4.multiply(transform3, perspectiveMatrix, transform3);

    const uniformBuffer = this.device.createBuffer({
      size: 64 * 3,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
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
          storeOp: "store"
        }
      ],
      depthStencilAttachment: {
        view: this.device
          .createTexture({
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            size: [this.canvas.width, this.canvas.height, 1]
          })
          .createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store"
      }
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
