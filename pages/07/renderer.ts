import { BaseRenderer } from "@shared/base_renderer";
import { CubeMesh } from "@shared/cube_mesh";
import { mat4 } from "gl-matrix";
import shader from "./shader.wgsl?raw";

export type GuiVar = { camera: XYZ };

export class Renderer extends BaseRenderer {
  private readonly numCubes = 500;
  private randomTranslateArray: mat4[];

  private constructor(canvas: HTMLCanvasElement, private guiVar: GuiVar) {
    super(canvas);
    this.randomTranslateArray = this.createRandomModelMatrix();
  }

  public static async create(canvas: HTMLCanvasElement, guiVar: GuiVar) {
    const renderer = new Renderer(canvas, guiVar);
    if (!(await renderer.initializeWebGPU())) {
      return null;
    }
    return renderer;
  }

  protected override initAssets() {
    this.mesh = new CubeMesh(this.device);
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
      primitive: { cullMode: "back", frontFace: "cw" },
    });
  }

  protected override async render() {
    const mvpMatrixData = new Float32Array(4 * 4 * this.numCubes);

    const mvpBuffer = this.device.createBuffer({
      size: mvpMatrixData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    for (let i = 0; i < this.numCubes; i++) {
      const mvpMatrix = mat4.create();

      const modelMatrix = mat4.create();
      const viewMatrix = mat4.create();
      const projectionMatrix = mat4.create();

      mat4.rotateX(modelMatrix, this.randomTranslateArray[i], this.time);
      mat4.rotateY(modelMatrix, modelMatrix, this.time);
      mat4.rotateZ(modelMatrix, modelMatrix, this.time);
      mat4.scale(modelMatrix, modelMatrix, [0.3, 0.3, 0.3]);

      mat4.lookAt(
        viewMatrix,
        [this.guiVar.camera.x, this.guiVar.camera.y, this.guiVar.camera.z],
        [0, 0, 0],
        [0, 1, 0]
      );
      mat4.perspective(
        projectionMatrix,
        Math.PI / 4,
        this.canvas.width / this.canvas.height,
        0,
        100
      );
      mat4.multiply(projectionMatrix, projectionMatrix, viewMatrix);
      mat4.multiply(mvpMatrix, projectionMatrix, modelMatrix);

      mvpMatrixData.set(mvpMatrix, 16 * i);
    }

    this.device.queue.writeBuffer(mvpBuffer, 0, mvpMatrixData as Float32Array);

    const uniformBufferGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: mvpBuffer } }],
    });

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

      mat4.translate(modelMatrix, modelMatrix, [
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ]);

      result.push(modelMatrix);
    }

    return result;
  }
}
