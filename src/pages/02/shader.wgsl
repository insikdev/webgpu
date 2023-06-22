struct VSInput {
    @location(0) position: vec2f,
}

struct FSInput {
    @builtin(position) position: vec4f,
}

@vertex
fn vs(input: VSInput) -> FSInput { 
    var output: FSInput;
    output.position = vec4f(input.position, 0.0, 1.0);
    
    return output;
}

@fragment
fn fs(input: FSInput) -> @location(0) vec4f {
    return vec4f(1.0, 0.0, 0.0, 1.0);
}
