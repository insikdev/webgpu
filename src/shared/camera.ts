import { glMatrix, mat4, vec3 } from "gl-matrix";
import { Direction } from "./enum";

export class Camera {
  private static readonly keyboardSensitivity = 0.5;
  private static readonly mouseSensitivity = 0.1;
  private static readonly fov = Math.PI / 2;
  private static readonly up = vec3.fromValues(0, 1, 0);

  private yaw = 0;
  private pitch = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    public position = vec3.fromValues(0, 0, 3),
    public target = vec3.fromValues(0, 0, 2)
  ) {
    this.canvas.addEventListener("keydown", this.handleKeypress);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
  }

  public getInfo() {
    //prettier-ignore
    return `position : ${this.position[0].toFixed(1)} ${this.position[1].toFixed(1)} ${this.position[2].toFixed(1)}<br/>target : ${this.target[0].toFixed(1)} ${this.target[1].toFixed(1)} ${this.target[2].toFixed(1)}`;
  }

  public getViewMatrix(): mat4 {
    const rotationY = mat4.create();
    mat4.rotate(rotationY, rotationY, glMatrix.toRadian(this.yaw), vec3.fromValues(0.0, 1.0, 0.0));

    const rotationX = mat4.create();
    mat4.rotate(rotationX, rotationX, glMatrix.toRadian(this.pitch), vec3.fromValues(1.0, 0.0, 0.0));

    const initialVector = vec3.fromValues(0.0, 0.0, -1.0);
    const result = vec3.create();
    vec3.transformMat4(result, initialVector, rotationY);
    vec3.transformMat4(result, result, rotationX);

    vec3.add(this.target, this.position, result);
    return mat4.lookAt(mat4.create(), this.position, this.target, Camera.up);
  }

  public getProjectionMatrix() {
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Camera.fov, this.canvas.width / this.canvas.height, 0, 10);
    return projectionMatrix;
  }

  public getViewProjectionMatrix() {
    const mat = mat4.create();
    mat4.multiply(mat, this.getProjectionMatrix(), this.getViewMatrix());
    return mat;
  }

  private handleKeypress = (e: KeyboardEvent) => {
    switch (e.key) {
      case "w":
        this.movePosition(Direction.FORWARD);
        break;
      case "s":
        this.movePosition(Direction.BACKWARD);
        break;
      case "a":
        this.movePosition(Direction.LEFT);
        break;
      case "d":
        this.movePosition(Direction.RIGHT);
        break;
      case "r":
        this.resetPosition();
        break;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (e.buttons != 1) {
      return;
    }

    this.yaw -= e.movementX * Camera.mouseSensitivity;
    // this.pitch -= e.movementY * Camera.mouseSensitivity;
  };

  private resetPosition(): void {
    this.position = vec3.fromValues(0, 0, 3);
    this.target = vec3.fromValues(0, 0, 2);
    this.yaw = 0;
    this.pitch = 0;
  }

  private getFrontUnitVector() {
    const vec = vec3.create();
    vec3.subtract(vec, this.target, this.position);
    vec3.normalize(vec, vec);
    return vec;
  }

  private getRightUnitVector() {
    const vec = vec3.create();
    vec3.cross(vec, this.getFrontUnitVector(), Camera.up);
    vec3.normalize(vec, vec);
    return vec;
  }

  private movePosition(direction: Direction) {
    const frontVector = this.getFrontUnitVector();
    const rightVector = this.getRightUnitVector();
    const distance = vec3.create();

    if (direction == Direction.FORWARD) {
      vec3.scale(distance, frontVector, Camera.keyboardSensitivity);
    } else if (direction == Direction.BACKWARD) {
      vec3.scale(distance, frontVector, -Camera.keyboardSensitivity);
    } else if (direction == Direction.LEFT) {
      vec3.scale(distance, rightVector, -Camera.keyboardSensitivity);
    } else if (direction == Direction.RIGHT) {
      vec3.scale(distance, rightVector, Camera.keyboardSensitivity);
    }

    vec3.add(this.position, this.position, distance);
  }
}
