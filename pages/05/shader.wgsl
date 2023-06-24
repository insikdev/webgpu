struct VSInput {
    @location(0) position: vec3f,
    @location(1) uv: vec2f,
}

struct FSInput {
    @builtin(position) position: vec4f,
    @location(0) TexCoord : vec2f
}

@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var myTexture: texture_2d<f32>;

@vertex
fn vs(input: VSInput) -> FSInput { 
    var output: FSInput;
    output.position = vec4f(input.position, 1.0);
    output.TexCoord = input.uv;
    
    return output;
}

@fragment
fn fs(@location(0) TexCoord : vec2<f32>) -> @location(0) vec4f {
    return textureSample(myTexture, mySampler, TexCoord);
}
