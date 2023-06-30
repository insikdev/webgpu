import { WebGPUManager } from "./webgpu_manger";

export abstract class AnimationRenderer extends WebGPUManager {
  protected time: number = 0;
  private animationFrameId?: number;
  private lastFrameTimestamp?: number;

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

  public restart = async () => {
    this.stopRendering();
    await this.initializeWebGPU();
    this.startRendering();
  };

  private renderFrame = (timestamp: number) => {
    this.time += this.calculateDeltaTime(timestamp);
    this.render();

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
}
