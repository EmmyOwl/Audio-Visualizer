const fShader = `
uniform float time;


uniform float planetRotation;
uniform float orbitDistance;
uniform float orbitSpeed;
uniform float orbitOffset;
uniform float moonSize;

uniform vec2 mouse;
uniform sampler2D matcap;
uniform vec4 resolution;

varying vec2 vUv;
varying vec3 vColour;

float PI = 3.141592653589793238;

// Function to apply matcap to a surface
// Source: https://github.com/hughsk/matcap/blob/master/matcap.glsl
vec2 getMatcap(vec3 eye, vec3 normal) {
  vec3 reflected = reflect(eye, normal);
  float m = 2.8284271247461903 * sqrt( reflected.z+1.0 );
  return reflected.xy / m + 0.5;
}

// Function to rotate a vector around an axis
// Source: https://gist.github.com/yiwenl/3f804e80d0930e34a0b33359259b556c
mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

// function to applying the rotation matrix to a vector
// Source: https://gist.github.com/yiwenl/3f804e80d0930e34a0b33359259b556c
vec3 rotate(vec3 v, vec3 axis, float angle) {
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

// function to orbit a point around an axis
// Source: https://gist.github.com/yiwenl/3f804e80d0930e34a0b33359259b556c
vec3 orbit(vec3 v, vec3 axis, float angle) {
  mat4 m = rotationMatrix(axis, angle);
  return (inverse(m) * vec4(v, 1.0)).xyz;
}

// function to smooth the surfaces between objects
// Source: https://iquilezles.org/articles/smin/
float smin( float a, float b, float k ) {
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

// function to calculate the signed distance of a point to a sphere
// Source: https://iquilezles.org/articles/distfunctions/
float sdSphere( vec3 p, float r ) {
  return length(p)-r;
}

// function to calculate the signed distance of a point to a box
// Source: https://iquilezles.org/articles/distfunctions/
float sdBox( vec3 p, vec3 b ) {
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// function to return a random number between 0 and 1
// Source: https://www.shadertoy.com/view/4djSRW
float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// Signed distance function to create the shapes
float boxSize = 0.1;
float sphereSize = 0.0001;
float cursorSize = 0.05;
float smoothingValue = 0.2;
// float planetRotation = 0.1;

float sdf(vec3 p) {
  vec3 p1 = rotate(p, vec3(1.0,1.0,1.0), time * planetRotation);

  // shape at origin
  float box = smin(sdBox(p1, vec3(boxSize)),sdSphere(p1,sphereSize), smoothingValue);
  // sphere at origin
  
  // shape at cursor
  float cursorSphere = sdSphere(p - vec3(mouse*resolution.zw*2.0,0.0), cursorSize);

  // add box to final shape
  float finalShape = box;

  // for loop to add moons
  for (float i = 0.0; i < 6.0; i+= 1.0) {
    // rotate the moons around the centre object
    float yAxis = 1.0 - (i / 6.0);
    float minSpeed = i + 0.2;

    vec3 p_Orbit = rotate(p, vec3(0.0,yAxis,0.0), time*orbitSpeed * minSpeed);

    // create a moon
    float moon = sdSphere(p_Orbit - vec3(orbitDistance,0.0,0.0), moonSize);

    // add moon to final shape
    finalShape = smin(finalShape, moon, smoothingValue);
  }

  return smin(finalShape,cursorSphere,smoothingValue);
}

// Function to calculate the normal of a point
// Source: https://iquilezles.org/articles/normalsSDF/
vec3 calcNormal(vec3 p ) {
    const float eps = 0.0001;
    const vec2 h = vec2(eps,0);
    return normalize( vec3(sdf(p+h.xyy) - sdf(p-h.xyy),
                           sdf(p+h.yxy) - sdf(p-h.yxy),
                           sdf(p+h.yyx) - sdf(p-h.yyx) ) );
}

void main() {
  vec3 cameraPosition = vec3(0.0, 0.0, 2.0);
  vec3 rayDirection = normalize(vec3((vUv - vec2(0.5))*resolution.zw, -1.0));
  vec3 rayPosition = cameraPosition;
  
  float t = 0.0;
  float tMax = 5.0;
  
  for(int i = 0; i < 256; i++) {
    vec3 position = cameraPosition + rayDirection * t;
    float h = sdf(position);
    
    if (h < 0.0001 || t > tMax) break;

    if (h < 0.0001) break;
    
    t += h;
  }

  vec3 colour = vec3(0.0, 0.0, 0.0);

  if (t < tMax) {
    vec3 position = cameraPosition + rayDirection * t;
    vec3 normal = calcNormal(position);
    colour = normal;
    // float diff = dot(vec3(1.0),normal);
    vec2 matcapUV = getMatcap(rayDirection, normal);


    // colour = vec3(diff);
    colour = texture2D(matcap, matcapUV).rgb;
  }

  gl_FragColor = vec4(colour,1.0);
}
`;

const vShader = `
  attribute vec3 Colours;

varying vec2 vUv;
varying vec3 vColour;

void main() {	
  vec4 localPosition = vec4(position, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * localPosition;

  vUv = uv;
  vColour = Colours;
}
`;

var material;
var settings = {
  planetRotation: 0.1,
  orbitDistance: 0.4,
  orbitSpeed: 0.1,
  orbitOffset: 0,
  moonSize: 0.3,
  sensitivity: 0.3,
};

let rayMarchingScene, rayMarchingCamera, rayMarchingRenderer, microphone, gui;

function initRayMarchingVisualizer(mic) {
  microphone = mic;

  rayMarchingScene = new THREE.Scene();

  // raymarching camera
  var frustumSize = 1;
  var aspectRatio = window.innerWidth / window.innerHeight;
  rayMarchingCamera = new THREE.OrthographicCamera(
    frustumSize / -2,
    frustumSize / 2,
    frustumSize / 2,
    frustumSize / -2,
    -1000,
    1000
  );
  rayMarchingCamera.position.set(0, 0, 2);

  // raymarching renderer
  rayMarchingRenderer = new THREE.WebGLRenderer();
  rayMarchingRenderer.setPixelRatio(window.devicePixelRatio);
  //document.body.appendChild(rayMarchingRenderer.domElement);
  document.getElementById('visualizerContainer').appendChild(rayMarchingRenderer.domElement);
  document.body.style.cursor = "none";

  setup_RayMarching();
  onWindowResize_RayMarching();
  mouseEvents_RayMarching();
  raf_RayMarching();
  settings_RayMarching();

  return {
    stop: function () {
      console.log("Stopping raymarching visualizer");
      window.cancelAnimationFrame(rayMarchingAnimationId);
      gui.destroy();
      if (gui && gui.domElement.parentNode) {
        gui.domElement.parentNode.removeChild(gui.domElement);
      }
      //rayMarchingRenderer.domElement.remove();
      document.getElementById('visualizerContainer').removeChild(rayMarchingRenderer.domElement);
      document.body.style.cursor = "default";
    },
  };
}

function setup_RayMarching() {
  material = new THREE.ShaderMaterial({
    uniforms: {
      mouse: { value: new THREE.Vector2(0, 0) },
      time: { value: 0 },
      planetRotation: { value: 0 },
      orbitDistance: { value: 0 },
      orbitSpeed: { value: 0 },
      orbitOffset: { value: 0 },
      moonSize: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      matcap: {
        value: new THREE.TextureLoader().load("./assets/candy_matcap.png"),
      },
    },
    vertexShader: vShader,
    fragmentShader: fShader,
    side: THREE.DoubleSide,
  });

  const geometry = new THREE.PlaneGeometry(1, 1);

  const plane = new THREE.Mesh(geometry, material);
  plane.position.set(0.0, 0.0, 0.0);
  rayMarchingScene.add(plane);
}

function settings_RayMarching() {
  gui = new dat.GUI({ autoPlace: false });
  document.getElementById('guiContainer').appendChild(gui.domElement);
  gui.add(settings, "planetRotation", -0.5, 0.5, 0.01);
  gui.add(settings, "orbitDistance", -0.4, 0.4, 0.01);
  gui.add(settings, "orbitSpeed", -0.2, 0.2, 0.01);
  gui.add(settings, "orbitOffset", -0.4, 0.4, 0.01);
  gui.add(settings, "moonSize", 0.06, 0.1, 0.001);
  gui.add(settings, "sensitivity", 0.0, 1.0, 0.01);
}

function mouseEvents_RayMarching() {
  var mouse = new THREE.Vector2();
  document.addEventListener("mousemove", (e) => {
    //normalise mouse position
    mouse.x = e.pageX / window.innerWidth - 0.5;
    mouse.y = -e.pageY / window.innerHeight + 0.5;

    //pass mouse position to shader
    material.uniforms.mouse.value.x = mouse.x;
    material.uniforms.mouse.value.y = mouse.y + 0.15;
  });
}

function onWindowResize_RayMarching() {
  // adjust render based on window size
  rayMarchingRenderer.setSize(window.innerWidth, window.innerHeight);

  // adjust uniforms based on window size
  const imageAspect = 1;
  let a1, a2;
  if (window.innerHeight / window.innerWidth > imageAspect) {
    a1 = (window.innerWidth / window.innerHeight) * imageAspect;
    a2 = 1;
  } else {
    a1 = 1;
    a2 = window.innerHeight / window.innerWidth / imageAspect;
  }
  material.uniforms.resolution.value.x = window.innerWidth;
  material.uniforms.resolution.value.y = window.innerHeight;
  material.uniforms.resolution.value.z = a1;
  material.uniforms.resolution.value.w = a2;
}

let rayMarchingAnimationId;

//function to clamp a value between a min and max
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

//function to normalise values between a min and max
function normalise(value, min, max) {
  return (value - min) / (max - min);
}

function raf_RayMarching() {
  rayMarchingAnimationId = window.requestAnimationFrame(raf_RayMarching);
  // console.log(rayMarchingAnimationId);
  updateTime_();
  updateSettings_();
  if (microphone.initialized) {
    const bands = microphone.getFrequencyBands();
    const lowFrequency = bands.low / 255;
    const midFrequency = bands.mid / 255;
    const highFrequency = bands.high / 255;

    var lowFrequencyNormalised = normalise(lowFrequency, 0, 1);
    var midFrequencyNormalised = normalise(midFrequency, 0, 1);
    var highFrequencyNormalised = normalise(highFrequency, 0, 1);

    // material.uniforms.planetRotation.value = 0.3;
    // material.uniforms.orbitDistance.value = 0.4;
    // material.uniforms.orbitSpeed.value = 0.15;
    // material.uniforms.orbitOffset.value = 0.0;
    material.uniforms.moonSize.value =
      highFrequencyNormalised * settings.sensitivity;
  }

  rayMarchingRenderer.render(rayMarchingScene, rayMarchingCamera);
}

//function to update time
function updateTime_() {
  material.uniforms.time.value += 0.05;
}

function updateSettings_() {
  // check if settings.progress is different from material.uniforms.progress.value
  if (
    settings.planetRotation === material.uniforms.planetRotation.value &&
    settings.orbitDistance === material.uniforms.orbitDistance.value &&
    settings.orbitSpeed === material.uniforms.orbitSpeed.value &&
    settings.orbitOffset === material.uniforms.orbitOffset.value
    // settings.moonSize === material.uniforms.moonSize.value
  )
    return;
  // otherwise, update material.uniforms.progress.value
  material.uniforms.planetRotation.value = settings.planetRotation;
  material.uniforms.orbitDistance.value = settings.orbitDistance;
  material.uniforms.orbitSpeed.value = settings.orbitSpeed;
  material.uniforms.orbitOffset.value = settings.orbitOffset;
  material.uniforms.moonSize.value = settings.moonSize;
}

export { initRayMarchingVisualizer };
