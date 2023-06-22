struct VSInput {
    @location(0) position: vec2f,
    @builtin(vertex_index) index: u32,
}

struct FSInput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

@vertex
fn vs(input: VSInput) -> FSInput { 
    var colors = array<vec4f, 3>(vec4f(1.0, 0.0, 0.0, 1.0), vec4f(0.0, 1.0, 0.0, 1.0), vec4f(0.0, 0.0, 1.0, 1.0));

    var output: FSInput;
    output.position = vec4f(input.position, 0.0, 1.0);
    output.color = colors[input.index];
    
    return output;
}

@fragment
fn fs(input: FSInput) -> @location(0) vec4f {
    return input.color;
}
