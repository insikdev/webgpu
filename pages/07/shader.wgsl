struct VSInput {
    @location(0) position: vec3f,
    @builtin(instance_index) instanceIndex: u32,
}

struct FSInput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

@group(0) @binding(0) var<storage, read> mvpMatrices: array<mat4x4f>;

@vertex
fn vs(input: VSInput) -> FSInput { 
    var output: FSInput;
    output.position = mvpMatrices[input.instanceIndex] * vec4f(input.position, 1.0);
    output.color = vec4f(input.position, 1.0) + vec4f(0.5);
    return output;
}

@fragment
fn fs(input: FSInput) -> @location(0) vec4f {
    return input.color;
}
