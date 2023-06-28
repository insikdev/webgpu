# WebGPU

### WebGPU 추상화 계층

- GPU driver는 OS와 GPU 간의 통신을 담당하는 인터페이스다.
- Graphics API는 application과 GPU driver 간의 통신을 담당하는 인터페이스다.
- WebGPU Adpater는 browser와 graphics API 간의 통신을 담당하는 인터페이스다.
- WebGPU Device는 WebGPU Adapter를 통해 제공되는 logical device이며 web app에서 GPU를 사용할 수 있도록 하는 인터페이스다.
