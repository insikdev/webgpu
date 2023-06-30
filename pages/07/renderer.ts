import { Cube } from "@mesh/cube";
import { AnimationRenderer } from "@shared/animation_renderer";
import { Camera } from "@shared/camera";
import { random } from "@shared/util";
import { mat4 } from "gl-matrix";
import shader from "./shader.wgsl?raw";

export class Renderer extends AnimationRenderer {
  private readonly numCubes = 500;
  private randomTranslateArray: mat4[];
  private depthTexture!: GPUTexture;

  private constructor(canvas: HTMLCanvasElement, public camera: Camera) {
    super(canvas);
    this.randomTranslateArray = this.createRandomModelMatrix();
  }

  public static async create(canvas: HTMLCanvasElement, camera: Camera) {
    const renderer = new Renderer(canvas, camera);
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
      primitive: { cullMode: "back", frontFace: "cw" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less-equal"
      }
    });

    this.depthTexture = this.device.createTexture({
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      size: [this.canvas.width, this.canvas.height, 1]
    });
  }

  protected override async render() {
    const mvpMatrixData = new Float32Array(4 * 4 * this.numCubes);

    const mvpBuffer = this.device.createBuffer({
      size: mvpMatrixData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    for (let i = 0; i < this.numCubes; i++) {
      const mvpMatrix = mat4.create();

      const modelMatrix = this.randomTranslateArray[i];
      const viewMatrix = this.camera.getViewMatrix();
      const projectionMatrix = this.camera.getProjectionMatrix();

      mat4.multiply(projectionMatrix, projectionMatrix, viewMatrix);
      mat4.multiply(mvpMatrix, projectionMatrix, modelMatrix);

      mvpMatrixData.set(mvpMatrix, 16 * i);
    }

    this.device.queue.writeBuffer(mvpBuffer, 0, mvpMatrixData as Float32Array);

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
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView({ aspect: "depth-only" }),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store"
      }
    });

    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, this.mesh.vertexBuffer);
    pass.setIndexBuffer(this.mesh.indexBuffer, "uint32");
    pass.setBindGroup(0, uniformBufferGroup);

    pass.drawIndexed(this.mesh.indices.length, this.numCubes);

    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  private createRandomModelMatrix() {
    const result: mat4[] = [];

    for (let i = 0; i < this.numCubes; i++) {
      const modelMatrix = mat4.create();
      mat4.translate(modelMatrix, modelMatrix, [random(-5, 5), random(-5, 5), random(-5, 5)]);
      result.push(modelMatrix);
    }

    return result;
  }
}
