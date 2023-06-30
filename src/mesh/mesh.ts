export function createSquare() {
  const vertices = new Float32Array([
    -0.5, -0.5,
    //
    -0.5, 0.5,
    //
    0.5, 0.5,
    //
    0.5, -0.5
  ]);
  const indices = new Uint32Array([1, 3, 0, 1, 2, 3]);

  return { vertices, indices };
}
