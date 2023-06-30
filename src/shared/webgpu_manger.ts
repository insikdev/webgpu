import { BaseMesh } from "../mesh/base_mesh";
import { Texture } from "./texture";

export abstract class WebGPUManager {
  protected device!: GPUDevice;
  protected context!: GPUCanvasContext;
  protected format!: GPUTextureFormat;
  protected pipeline!: GPURenderPipeline;

  protected mesh!: BaseMesh;
  protected texture?: Texture;

  constructor(protected readonly canvas: HTMLCanvasElement) {}

  protected abstract initAssets(): Promise<void> | void;
  protected abstract createRenderPipeline(): void;
  protected abstract render(): void;

  protected async initializeWebGPU(): Promise<boolean> {
    if (!("gpu" in navigator)) {
      console.error("User agent doesn't support WebGPU.");
      return false;
    }

    const gpuAdapter = await navigator.gpu.requestAdapter();

    if (!gpuAdapter) {
      console.error("No WebGPU adapters found.");
      return false;
    }

    this.device = await gpuAdapter.requestDevice();
    this.context = this.canvas.getContext("webgpu")!;
    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({ device: this.device, format: this.format });

    await this.onWebGPUInitialized();
    return true;
  }

  private async onWebGPUInitialized() {
    await this.initAssets();
    this.createRenderPipeline();
  }
}
