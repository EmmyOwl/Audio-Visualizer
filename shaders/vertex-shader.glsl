attribute vec3 Colours;

varying vec2 vUv;
varying vec3 vColour;

void main() {	
  vec4 localPosition = vec4(position, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * localPosition;

  vUv = uv;
  vColour = Colours;
}