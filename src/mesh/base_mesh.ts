export abstract class BaseMesh {
  vertices!: Float32Array;
  indices!: Uint32Array;
  vertexBuffer!: GPUBuffer;
  indexBuffer!: GPUBuffer;
  vertexBufferLayout!: GPUVertexBufferLayout;

  constructor(protected device: GPUDevice) {}
}
