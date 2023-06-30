import { Cube } from "@mesh/cube";
import { AnimationRenderer } from "@shared/animation_renderer";
import { random } from "@shared/util";
import { mat4 } from "gl-matrix";
import light from "./light.wgsl?raw";
import shader from "./shader.wgsl?raw";

export type GuiVar = { light: { pos: XYZ }; camera: XYZ };

export class Renderer extends AnimationRenderer {
  private lightPipeline!: GPURenderPipeline;
  private readonly numCubes = 5;
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
    this.mesh = new Cube(this.device);
  }

  protected override createRenderPipeline() {
    const transformGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0, // model
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        },
        {
          binding: 1, // view
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        },
        {
          binding: 2, // projection
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        },
        {
          binding: 3, // normal
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        }
      ]
    });

    const lightGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0, // light pos
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {}
        }
      ]
    });

    const cameraGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0, // camera pos
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {}
        }
      ]
    });

    const lightPipelineGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0, // model
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        },
        {
          binding: 1, // view
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        },
        {
          binding: 2, // projection
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        }
      ]
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [transformGroupLayout, lightGroupLayout, cameraGroupLayout]
    });

    const lightPipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [lightPipelineGroupLayout]
    });

    const module = this.device.createShaderModule({ code: shader });
    const lightShaderModule = this.device.createShaderModule({ code: light });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
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
      primitive: { cullMode: "back", frontFace: "cw" }
    });

    this.lightPipeline = this.device.createRenderPipeline({
      layout: lightPipelineLayout,
      vertex: {
        module: lightShaderModule,
        entryPoint: "vs",
        buffers: [this.mesh.vertexBufferLayout]
      },
      fragment: {
        module: lightShaderModule,
        entryPoint: "fs",
        targets: [{ format: this.format }]
      },
      primitive: { cullMode: "back", frontFace: "cw" }
    });
  }

  protected override async render() {
    const modelMatrixData = new Float32Array(4 * 4 * this.numCubes);
    const normalMatrixData = new Float32Array(4 * 4 * this.numCubes);

    for (let i = 0; i < this.numCubes; i++) {
      const modelMatrix = mat4.create();
      const normalMatrix = mat4.create();

      mat4.rotateX(modelMatrix, this.randomTranslateArray[i], 1);
      mat4.rotateY(modelMatrix, modelMatrix, 1);
      mat4.rotateZ(modelMatrix, modelMatrix, 1);
      mat4.scale(modelMatrix, modelMatrix, [1, 1, 1]);

      mat4.invert(normalMatrix, modelMatrix);
      mat4.transpose(normalMatrix, normalMatrix);

      modelMatrixData.set(modelMatrix, 16 * i);
      normalMatrixData.set(normalMatrix, 16 * i);
    }

    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();

    const lightModelMatrix = mat4.create();

    // mat4.rotateX(modelMatrix, modelMatrix, this.time);
    // mat4.rotateY(modelMatrix, modelMatrix, this.time);
    // mat4.rotateZ(modelMatrix, modelMatrix, this.time);
    // mat4.scale(modelMatrix, modelMatrix, [0.5, 0.5, 0.5]);

    mat4.translate(lightModelMatrix, lightModelMatrix, [
      this.guiVar.light.pos.x,
      this.guiVar.light.pos.y,
      this.guiVar.light.pos.z
    ]);
    mat4.scale(lightModelMatrix, lightModelMatrix, [0.1, 0.1, 0.1]);

    mat4.lookAt(viewMatrix, [this.guiVar.camera.x, this.guiVar.camera.y, this.guiVar.camera.z], [0, 0, 0], [0, 1, 0]);
    mat4.perspective(projectionMatrix, Math.PI / 4, this.canvas.width / this.canvas.height, 0, 100);

    const modelBuffer = this.device.createBuffer({
      size: 4 * 4 * 4 * this.numCubes,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const viewBuffer = this.device.createBuffer({
      size: 4 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const projectionBuffer = this.device.createBuffer({
      size: 4 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const normalBuffer = this.device.createBuffer({
      size: 4 * 4 * 4 * this.numCubes,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const lightPosBuffer = this.device.createBuffer({
      size: 4 * 3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const lightModelBuffer = this.device.createBuffer({
      size: 4 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const cameraBuffer = this.device.createBuffer({
      size: 4 * 3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const transformBufferGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: modelBuffer } },
        { binding: 1, resource: { buffer: viewBuffer } },
        { binding: 2, resource: { buffer: projectionBuffer } },
        { binding: 3, resource: { buffer: normalBuffer } }
      ]
    });

    const lightBufferGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [{ binding: 0, resource: { buffer: lightPosBuffer } }]
    });

    const cameraBufferGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(2),
      entries: [{ binding: 0, resource: { buffer: cameraBuffer } }]
    });

    const light_pipeline_group = this.device.createBindGroup({
      layout: this.lightPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: lightModelBuffer } },
        { binding: 1, resource: { buffer: viewBuffer } },
        { binding: 2, resource: { buffer: projectionBuffer } }
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

    this.device.queue.writeBuffer(modelBuffer, 0, modelMatrixData as Float32Array);
    this.device.queue.writeBuffer(viewBuffer, 0, viewMatrix as Float32Array);
    this.device.queue.writeBuffer(projectionBuffer, 0, projectionMatrix as Float32Array);
    this.device.queue.writeBuffer(normalBuffer, 0, normalMatrixData as Float32Array);

    this.device.queue.writeBuffer(
      lightPosBuffer,
      0,
      new Float32Array([this.guiVar.light.pos.x, this.guiVar.light.pos.y, this.guiVar.light.pos.z])
    );
    this.device.queue.writeBuffer(lightModelBuffer, 0, lightModelMatrix as Float32Array);

    this.device.queue.writeBuffer(
      cameraBuffer,
      0,
      new Float32Array([this.guiVar.camera.x, this.guiVar.camera.y, this.guiVar.camera.z])
    );

    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, this.mesh.vertexBuffer);
    pass.setIndexBuffer(this.mesh.indexBuffer, "uint32");
    pass.setBindGroup(0, transformBufferGroup);
    pass.setBindGroup(1, lightBufferGroup);
    pass.setBindGroup(2, cameraBufferGroup);

    pass.drawIndexed(this.mesh.indices.length, this.numCubes);

    pass.setPipeline(this.lightPipeline);
    pass.setVertexBuffer(0, this.mesh.vertexBuffer);
    pass.setIndexBuffer(this.mesh.indexBuffer, "uint32");
    pass.setBindGroup(0, light_pipeline_group);

    pass.drawIndexed(this.mesh.indices.length);

    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  private createRandomModelMatrix() {
    const result: mat4[] = [];

    for (let i = 0; i < this.numCubes; i++) {
      const modelMatrix = mat4.create();

      mat4.translate(modelMatrix, modelMatrix, [random(-2, 2), random(-2, 2), random(-2, 2)]);

      result.push(modelMatrix);
    }

    return result;
  }
}
