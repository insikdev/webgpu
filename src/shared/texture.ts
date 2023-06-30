export class Texture {
  public texture!: GPUTexture;
  public view!: GPUTextureView;
  public sampler!: GPUSampler;

  constructor(private device: GPUDevice) {}

  public async loadImage(url: string) {
    const imageBitmap = await createImageBitmap(await (await fetch(url)).blob());
    this.createTexture(imageBitmap);
  }

  private createTexture(imageData: ImageBitmap) {
    const size = { width: imageData.width, height: imageData.height };

    this.texture = this.device.createTexture({
      size,
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.view = this.texture.createView({
      format: "rgba8unorm",
      dimension: "2d",
      aspect: "all",
      baseMipLevel: 0,
      mipLevelCount: 1,
      baseArrayLayer: 0,
      arrayLayerCount: 1
    });

    this.sampler = this.device.createSampler({
      addressModeU: "repeat",
      addressModeV: "repeat",
      addressModeW: "repeat",
      magFilter: "linear",
      minFilter: "linear"
    });

    this.device.queue.copyExternalImageToTexture({ source: imageData }, { texture: this.texture }, size);
  }
}
