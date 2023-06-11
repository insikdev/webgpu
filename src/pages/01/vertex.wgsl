struct VSInput {
    @location(0) position: vec2f,
}

struct VSOutput {
    @builtin(position) position: vec4f,
}

@vertex
fn vs(input: VSInput) -> VSOutput { 
    var output: VSOutput;

    output.position = vec4f(input.position, 0.0, 1.0);
    return output;
}
