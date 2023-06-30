struct VSInput {
    @builtin(instance_index) instanceIndex: u32,
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) uv: vec3f,
}

struct FSInput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) normal: vec3f,
    @location(2) uv: vec3f,
    @location(3) pos: vec3f,
}

@group(0) @binding(0) var<uniform> modelMatrix: array<mat4x4f, 5>;
@group(0) @binding(1) var<uniform> viewMatrix: mat4x4f;
@group(0) @binding(2) var<uniform> projectionMatrix: mat4x4f;
@group(0) @binding(3) var<uniform> normalMatrix: array<mat4x4f, 5>;

@group(1) @binding(0) var<uniform> lightPos: vec3f;

@group(2) @binding(0) var<uniform> cameraPos: vec3f;

@vertex
fn vs(input: VSInput) -> FSInput { 
    var output: FSInput;

    output.position = projectionMatrix * viewMatrix * modelMatrix[input.instanceIndex] * vec4f(input.position, 1.0);
    output.color = vec4f(input.position, 1.0) + vec4f(0.5);
    output.normal = (normalMatrix[input.instanceIndex] * vec4(input.normal, 0.0)).xyz;
    output.uv = input.uv;
    output.pos = (modelMatrix[input.instanceIndex] * vec4f(input.position ,1)).xyz;

    return output;
}

@fragment
fn fs(input: FSInput) -> @location(0) vec4f {
    let lightColor = vec3f(1,1,1);
    let ambientStrength = 0.1;
    let ambient = ambientStrength * lightColor;

	let lightDir = normalize(lightPos - input.pos);
    let pixelNorm = normalize(input.normal);
    let diffuse = max(dot(pixelNorm, lightDir), 0.0) * lightColor;

    let viewPos = vec3f(0,0,5);
	let viewDir = normalize(cameraPos - input.pos);
    let reflectDir = reflect(-lightDir, pixelNorm);
    let spec = pow(max(dot(viewDir, reflectDir), 0.0), 32);
    let specular = 1 * spec * lightColor;

    let result = (ambient + diffuse + specular) * input.color.xyz;
    return vec4f(result, 1);
}
