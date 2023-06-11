# WebGPU

## Fundamentals

### WebGPU가 수행하는 2가지 작업

1. Draw triangles/points/lines to textures
2. Run computations on the GPU

### GPU에서 함수를 실행하기 위한 조건

- GPU에서 실행되는 함수 : vertex shader, fragment shader, compute shader
- 필요한 데이터를 buffer, texture 형태로 bind 하고 해당 데이터를 GPU에 전달해야 함
- 인코더에 GPU에서 실행할 명령들을 인코딩해서 GPU에 전달
