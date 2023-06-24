import { BaseMesh } from "./base_mesh";
import { Texture } from "./texture";

export abstract class BaseRenderer {
  protected device!: GPUDevice;
  protected context!: GPUCanvasContext;
  protected format!: GPUTextureFormat;
  protected pipeline!: GPURenderPipeline;
  private animationFrameId?: number;
  private lastFrameTimestamp?: number;
  private totalTime: number = 0;

  protected mesh!: BaseMesh;
  protected texture?: Texture;

  constructor(protected readonly canvas: HTMLCanvasElement) {}

  protected abstract initAssets(): Promise<void> | void;
  protected abstract createRenderPipeline(): void;
  protected abstract render(dt: number, totalTime: number): void;

  public async initialize() {
    await this.initWebGPU();
    await this.initAssets();
    this.createRenderPipeline();
  }

  public startRendering = () => {
    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(this.renderFrame);
    }
  };

  public stopRendering = () => {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  };

  private renderFrame = (timestamp: number) => {
    const dt = this.calculateDeltaTime(timestamp);
    this.totalTime += dt;
    this.render(dt, this.totalTime);

    if (this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(this.renderFrame);
    }
  };

  private calculateDeltaTime(currentTimestamp: number): number {
    const lastTimestamp = this.lastFrameTimestamp || currentTimestamp;
    const dt = (currentTimestamp - lastTimestamp) / 1000;
    this.lastFrameTimestamp = currentTimestamp;
    return dt;
  }

  protected async initWebGPU() {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter?.requestDevice();
    const context = this.canvas.getContext("webgpu")!;
    const format = navigator.gpu.getPreferredCanvasFormat();

    if (!adapter || !device || !context) {
      throw Error("WebGPU not supported.");
    }

    context.configure({ device, format });
    this.device = device;
    this.context = context;
    this.format = format;
  }
}
