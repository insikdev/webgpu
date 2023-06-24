import { BaseMesh } from "@shared/base_mesh";

export class TriangleMesh extends BaseMesh {
  constructor(device: GPUDevice) {
    super(device);

    this.vertices = new Float32Array([
      // x y z u v
      -0.5, -0.5, 0.0, 0.5, 0.0,
      //
      0.0, 0.5, 0.0, 0.0, 1.0,
      //
      0.5, -0.5, 0.0, 1.0, 1.0,
    ]);

    this.indices = new Uint32Array([0, 1, 2]);

    this.vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.indexBuffer = this.device.createBuffer({
      size: this.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    this.vertexBufferLayout = {
      arrayStride: 4 * 5,
      attributes: [
        { shaderLocation: 0, format: "float32x3", offset: 0 },
        { shaderLocation: 1, format: "float32x2", offset: 12 },
      ],
    };

    this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
    this.device.queue.writeBuffer(this.indexBuffer, 0, this.indices);
  }
}
