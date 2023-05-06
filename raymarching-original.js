// import * as THREE from "https://cdn.skypack.dev/three@0.136";
// import { GUI } from "./libs/lil-gui.module.min.js";

var material = new THREE.ShaderMaterial();
var settings = {
  progX: 0,
  progY: 0,
};

class Sketch {
  constructor() {}

  async initRaymarchingVisualizer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
    // document.body.style.cursor = "none";

    window.addEventListener(
      "resize",
      () => {
        this.onWindowResize_();
      },
      false
    );

    this.scene_ = new THREE.Scene();

    var frustumSize = 1;
    var aspectRatio = window.innerWidth / window.innerHeight;

    this.camera_ = new THREE.OrthographicCamera(
      frustumSize / -2,
      frustumSize / 2,
      frustumSize / 2,
      frustumSize / -2,
      -1000,
      1000
    );
    this.camera_.position.set(0, 0, 2);

    // this.controls_ = new OrbitControls(this.camera_, this.renderer.domElement);

    await this.setupProject_();

    this.onWindowResize_();
    this.mouseEvents_();
    this.raf_();
    this.settings_();
  }

  async setupProject_() {
    const vsh = await fetch("./shaders/vertex-shader.glsl");
    const fsh = await fetch("./shaders/fragment-shader.glsl");

    material = new THREE.ShaderMaterial({
      uniforms: {
        mouse: { value: new THREE.Vector2(0, 0) },
        time: { value: 0 },
        progX: { value: 0 },
        progY: { value: 0 },
        resolution: { value: new THREE.Vector4() },
        matcap: {
          value: new THREE.TextureLoader().load("./assets/candy_matcap.png"),
        },
      },
      vertexShader: await vsh.text(),
      fragmentShader: await fsh.text(),
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.PlaneGeometry(1, 1);

    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0.0, 0.0, 0.0);
    this.scene_.add(plane);
  }

  settings_() {
    this.gui_ = new dat.GUI();
    this.gui_.add(settings, "progX", -0.4, 0.4, 0.01);
    this.gui_.add(settings, "progY", -0.4, 0.4, 0.01);
  }

  mouseEvents_() {
    this.mouse = new THREE.Vector2();
    document.addEventListener("mousemove", (e) => {
      //normalise mouse position
      this.mouse.x = e.pageX / window.innerWidth - 0.5;
      this.mouse.y = -e.pageY / window.innerHeight + 0.5;

      //pass mouse position to shader
      material.uniforms.mouse.value.x = this.mouse.x;
      material.uniforms.mouse.value.y = this.mouse.y;
    });
  }

  onWindowResize_() {
    // adjust render based on window size
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // adjust uniforms based on window size
    this.imageAspect = 1;
    let a1, a2;
    if (window.innerHeight / window.innerWidth > this.imageAspect) {
      a1 = (window.innerWidth / window.innerHeight) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = window.innerHeight / window.innerWidth / this.imageAspect;
    }
    material.uniforms.resolution.value.x = window.innerWidth;
    material.uniforms.resolution.value.y = window.innerHeight;
    material.uniforms.resolution.value.z = a1;
    material.uniforms.resolution.value.w = a2;
  }

  raf_() {
    requestAnimationFrame((t) => {
      this.renderer.render(this.scene_, this.camera_);
      this.raf_();
      this.updateTime_();
      this.updateProgress_();
    });
  }

  //function to update time
  updateTime_() {
    material.uniforms.time.value += 0.05;
  }

  updateProgress_() {
    // check if settings.progress is different from material.uniforms.progress.value
    if (
      settings.progX === material.uniforms.progX.value &&
      settings.progY === material.uniforms.progY.value
    )
      return;
    // otherwise, update material.uniforms.progress.value
    material.uniforms.progX.value = settings.progX;
    material.uniforms.progY.value = settings.progY;
  }
}

let APP_ = null;

window.addEventListener("DOMContentLoaded", async () => {
  APP_ = new Sketch();
  await APP_.initRaymarchingVisualizer();
});
