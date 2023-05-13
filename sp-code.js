export function spCode() {
  return ` 
      let audioLow = input();
      let audioMid = input();
      let audioHigh = input();
      let LFAttenuation = input();
      let MFAttenuation = input();
      let HFAttenuation = input();
      let treble = input();

      setMaxIterations(3);
      let s = getSpace();
      let r = getRayDirection();


      let n1 = noise(r * 4 + vec3(0, audioLow, audioLow) * 0.1);
      let n = noise(s + vec3(0, 0, time * .1) + n1);

      metal(n * .5 + .5);
      shine(n * .5 + .5);

      color(normal * (audioHigh/100 * HFAttenuation) + vec3(0, 0, 6));
      //displace(mouse.x * 4, mouse.y * 4, 0);
      boxFrame(vec3(1), abs(n) * audioMid * MFAttenuation * .1 + .04);
      mixGeo(audioLow * LFAttenuation);
      sphere(n * treble *  .5 + .8);
    `;
}

