struct VSInput {
    @location(0) position: vec3f,
}

struct FSInput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

@binding(0) @group(0) var<uniform> mvpMatrix : mat4x4<f32>;

@vertex
fn vs(input: VSInput) -> FSInput { 
    var output: FSInput;
    output.position = mvpMatrix * vec4f(input.position, 1.0);
    output.color = vec4f(input.position, 1.0) + vec4f(0.5);
    return output;
}

@fragment
fn fs(input: FSInput) -> @location(0) vec4f {
    return input.color;
}
