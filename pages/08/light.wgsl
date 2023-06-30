struct VSInput {
    @location(0) position: vec3f,
}

struct FSInput {
    @builtin(position) position: vec4f,
}

@group(0) @binding(0) var<uniform> modelMatrix: mat4x4f;
@group(0) @binding(1) var<uniform> viewMatrix: mat4x4f;
@group(0) @binding(2) var<uniform> projectionMatrix: mat4x4f;

@vertex
fn vs(input: VSInput) -> FSInput { 
    var output: FSInput;

    output.position = projectionMatrix * viewMatrix * modelMatrix * vec4f(input.position, 1.0);

    return output;
}

@fragment
fn fs(input: FSInput) -> @location(0) vec4f {
    return vec4f(1,1,1,1);
}
