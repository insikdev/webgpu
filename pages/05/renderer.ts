import { Triangle } from "@mesh/triangle";
import { AnimationRenderer } from "@shared/animation_renderer";
import { Texture } from "@shared/texture";
import shader from "./shader.wgsl?raw";
import imgUrl from "/sample.jpg";

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

  protected override async initAssets(): Promise<void> {
    this.mesh = new Triangle(this.device);

    this.texture = new Texture(this.device);
    await this.texture.loadImage(imgUrl);
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

  protected override async render() {
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.texture!.sampler },
        { binding: 1, resource: this.texture!.view }
      ]
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

    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, this.mesh.vertexBuffer);
    pass.setIndexBuffer(this.mesh.indexBuffer, "uint32");
    pass.setBindGroup(0, bindGroup);

    pass.drawIndexed(this.mesh.indices.length);

    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }
}
