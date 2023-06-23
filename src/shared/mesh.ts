export function createTriangle() {
  const vertices = new Float32Array([
    -0.5, -0.5,
    //
    0.0, 0.5,
    //
    0.5, -0.5,
  ]);
  const indices = new Uint32Array([0, 1, 2]);

  return { vertices, indices };
}

export function createSquare() {
  const vertices = new Float32Array([
    -0.5, -0.5,
    //
    -0.5, 0.5,
    //
    0.5, 0.5,
    //
    0.5, -0.5,
  ]);
  const indices = new Uint32Array([1, 3, 0, 1, 2, 3]);

  return { vertices, indices };
}

export function createCircle(radius: number = 0.5, segments: number = 50) {
  const vertices = new Float32Array((segments + 1) * 2);
  const indices = new Uint32Array(segments * 3);

  vertices.set([0, 0]);

  for (let i = 0; i < segments; i++) {
    const radian = (Math.PI * 2 * i) / segments;
    const vertex = [Math.cos(radian) * radius, Math.sin(radian) * radius];
    vertices.set(vertex, 2 + 2 * i);
    indices.set([0, i + 1, i == segments - 1 ? 1 : i + 2], i * 3);
  }

  return { vertices, indices };
}
