uniform float time;

uniform float progX;
uniform float progY;

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
float sphereSize = 0.2;
float cursorSize = 0.05;
float moonSize = 0.05;
float smoothingValue = 0.2;

float sdf(vec3 p) {
  vec3 p1 = rotate(p, vec3(1.0,1.0,1.0), time/5.0);

  // shape at origin
  float box = smin(sdBox(p1, vec3(boxSize)),sdSphere(p,0.02), smoothingValue);
  // sphere at origin
  float sphere = sdSphere(p1, sphereSize);
  
  // shape at cursor
  float cursorSphere = sdSphere(p - vec3(mouse*resolution.zw*2.0,0.0), cursorSize);

  // final shape
  float finalShape = box;

  // // create a moon
  // float moonX = sdSphere(p, 0.1);
  // float moonY = sdSphere(p, 0.1);

  float rotateSpeed = time / 20.0;

  // // rotate the moons around the centre object
  // vec3 pX = rotate(p, vec3(0.0,1.0,0.0), rotateSpeed);
  // vec3 pY = rotate(p, vec3(1.0,0.0,0.0), rotateSpeed);

  // // offset the moon
  // moonX = sdSphere(pX - vec3(progX,0.0,0.0), 0.1);
  // moonY = sdSphere(pY - vec3(0.0,progY,0.0), 0.1);

  // // for loop to add moons
  // for (int i = 0; i < 10; i++) {
  //   // rotate the moons around the centre object
  //   pX = rotate(pX, vec3(0.0,1.0,0.0), rotateSpeed);
  //   pY = rotate(pY, vec3(1.0,0.0,0.0), rotateSpeed);

  //   // offset the moon
  //   moonX = smin(moonX, sdSphere(pX - vec3(progX,0.0,0.0), 0.1), smoothingValue);
  //   moonY = smin(moonY, sdSphere(pY - vec3(0.0,progY,0.0), 0.1), smoothingValue);
  // }

  // //add moon to final shape
  // finalShape = smin(finalShape, moonX, smoothingValue);
  // finalShape = smin(finalShape, moonY, smoothingValue);

  // array to hold moons
  float moons[10];
  float counter = 0.0;
  // for loop to add moons
  for (int i = 0; i < 10; i+=1) {
    // create a moon
    float moon = sdSphere(p, moonSize);

    // rotate the moons around the centre object
    p = rotate(p, vec3(0.0,progX,progY), rotateSpeed);
    // p = rotate(p, vec3(1.0,0.0,0.0), time/10.0);
    // p = rotate(p, vec3(0.0,0.0,1.0), time/10.0);

    // offset the moon
    moon = smin(moon, sdSphere(p - vec3(0.5,0.0,0.0), moonSize), smoothingValue);
    moon = smin(moon, sdSphere(p - vec3(0.0,0.2,0.0), moonSize), smoothingValue);
    // moon = smin(moon, sdSphere(p - vec3(0.0,0.0,0.2), moonSize), smoothingValue);

    // add moon to array
    moons[i] = moon;

    // add moon array to final shape
    finalShape = smin(finalShape, moons[i], smoothingValue);
    counter += 0.07;
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
    // colour = normal;
    float diff = dot(vec3(1.0),normal);
    vec2 matcapUV = getMatcap(rayDirection, normal);
    // colour = vec3(diff);
    colour = texture2D(matcap, matcapUV).rgb;
  }

  gl_FragColor = vec4(colour,1.0);
}