import { BaseMesh } from "./base_mesh";

export class Circle extends BaseMesh {
  constructor(device: GPUDevice, public readonly radius = 0.5, public readonly segments = 50) {
    super(device);

    this.calculate();

    this.vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    this.indexBuffer = this.device.createBuffer({
      size: this.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });

    this.vertexBufferLayout = {
      arrayStride: 4 * 2,
      attributes: [{ shaderLocation: 0, format: "float32x2", offset: 0 }]
    };

    this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
    this.device.queue.writeBuffer(this.indexBuffer, 0, this.indices);
  }

  private calculate() {
    this.vertices = new Float32Array((this.segments + 1) * 2);
    this.indices = new Uint32Array(this.segments * 3);

    this.vertices.set([0, 0]);

    for (let i = 0; i < this.segments; i++) {
      const radian = (Math.PI * 2 * i) / this.segments;
      const vertex = [Math.cos(radian) * this.radius, Math.sin(radian) * this.radius];
      this.vertices.set(vertex, 2 + 2 * i);
      this.indices.set([0, i + 1, i == this.segments - 1 ? 1 : i + 2], i * 3);
    }
  }
}
