import { BaseMesh } from "./base_mesh";

export class Cube extends BaseMesh {
  constructor(device: GPUDevice) {
    super(device);

    // prettier-ignore
    this.vertices = new Float32Array([
        // Front face
        -0.5, 0.5, 0.5, 0, 0, 1, 0, 0, 
        0.5, 0.5, 0.5, 0, 0, 1, 1, 0, 
        0.5, -0.5, 0.5, 0, 0, 1, 1, 1, 
        -0.5, -0.5, 0.5, 0, 0, 1, 0, 1, 

        // Back face
        0.5, 0.5, -0.5, 0, 0, -1, 0, 0, 
        -0.5, 0.5, -0.5, 0, 0, -1, 1, 0, 
        -0.5, -0.5, -0.5, 0, 0, -1, 1, 1, 
        0.5, -0.5, -0.5, 0, 0, -1, 0, 1, 

        // Top face
        -0.5, 0.5, -0.5, 0, 1, 0, 0, 0, 
        0.5, 0.5, -0.5, 0, 1, 0, 1, 0, 
        0.5, 0.5, 0.5, 0, 1, 0, 1, 1, 
        -0.5, 0.5, 0.5, 0, 1, 0, 0, 1, 

        // Bottom face
        -0.5, -0.5, 0.5, 0, -1, 0, 0, 0, 
        0.5, -0.5, 0.5, 0, -1, 0, 1, 0, 
        0.5, -0.5, -0.5, 0, -1, 0, 1, 1, 
        -0.5, -0.5, -0.5, 0, -1, 0, 0, 1, 

        // Right face
        0.5, 0.5, 0.5, 1, 0, 0, 0, 0, 
        0.5, 0.5, -0.5, 1, 0, 0, 1, 0, 
        0.5, -0.5, -0.5, 1, 0, 0, 1, 1, 
        0.5, -0.5, 0.5, 1, 0, 0, 0, 1, 

        // Left face
        -0.5, 0.5, -0.5, -1, 0, 0, 0, 0, 
        -0.5, 0.5, 0.5, -1, 0, 0, 1, 0, 
        -0.5, -0.5, 0.5, -1, 0, 0, 1, 1, 
        -0.5, -0.5, -0.5, -1, 0, 0, 0, 1
    ]);

    // prettier-ignore
    this.indices = new Uint32Array([
        0, 2, 3, 0, 1, 2, // Front face
        4, 6, 7, 4, 5, 6, // Back face
        8, 10, 11, 8, 9, 10, // Top face
        12, 14, 15, 12, 13, 14, // Bottom face
        16, 18, 19, 16, 17, 18, // Right face
        20, 22, 23, 20, 21, 22 // Left face
    ]);

    this.vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    this.indexBuffer = this.device.createBuffer({
      size: this.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });

    this.vertexBuffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    this.indexBuffer = this.device.createBuffer({
      size: this.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });

    this.vertexBufferLayout = {
      arrayStride: 4 * 8,
      attributes: [
        { shaderLocation: 0, format: "float32x3", offset: 0 },
        { shaderLocation: 1, format: "float32x3", offset: 12 },
        { shaderLocation: 2, format: "float32x2", offset: 24 }
      ]
    };

    this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
    this.device.queue.writeBuffer(this.indexBuffer, 0, this.indices);
  }
}
