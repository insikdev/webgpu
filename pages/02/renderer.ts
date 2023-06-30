import { Circle } from "@mesh/circle";
import { AnimationRenderer } from "@shared/animation_renderer";
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

  protected override initAssets(): void {
    this.mesh = new Circle(this.device);
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
    pass.drawIndexed(this.mesh.indices.length);
    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }
}
