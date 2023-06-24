import { BaseMesh } from "./base_mesh";

export class CubeMesh extends BaseMesh {
  constructor(device: GPUDevice) {
    super(device);

    this.vertices = new Float32Array([
      -0.5, -0.5, 0.5,

      0.5, -0.5, 0.5,

      0.5, -0.5, -0.5,

      -0.5, -0.5, -0.5,

      -0.5, 0.5, 0.5,

      0.5, 0.5, 0.5,

      0.5, 0.5, -0.5,

      -0.5, 0.5, -0.5,
    ]);

    this.indices = new Uint32Array([
      // front
      4, 1, 0, 4, 5, 1,
      // right
      5, 2, 1, 5, 6, 2,
      // left
      7, 0, 3, 7, 4, 0,
      // back
      6, 3, 2, 6, 7, 3,
      // top
      7, 5, 4, 7, 6, 5,
      // bottom
      0, 2, 3, 0, 1, 2,
    ]);

    this.vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.indexBuffer = this.device.createBuffer({
      size: this.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    this.vertexBufferLayout = {
      arrayStride: 4 * 3,
      attributes: [{ shaderLocation: 0, format: "float32x3", offset: 0 }],
    };

    this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
    this.device.queue.writeBuffer(this.indexBuffer, 0, this.indices);
  }
}
