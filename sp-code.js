export function spCode() {
  return ` 
      let audioLow = input();
      let audioMid = input();
      let audioHigh = input();
      let bassFrequency = input();
      let LFAttenuation = input();
      let MFAttenuation = input();
      let HFAttenuation = input();
      let distortion = input();

      setMaxIterations(5);
      let s = getSpace();
      let r = getRayDirection();


      let n1 = noise(r * 4 + vec3(0, audioLow * LFAttenuation, audioLow) * 0.1);
      let n = noise(s + vec3(0, 0, audioLow + time * .6) + n1);

      metal(n * .2 + .2);
      shine(n * .3 + .2);

      color(normal * (audioHigh/ 2  * HFAttenuation) + vec3(0, 0, 3));
      boxFrame(vec3(1), abs(n) * audioMid * MFAttenuation * .1 + .04);
      mixGeo(audioLow * LFAttenuation);
      sphere(n * distortion *  .5 + .8);
    `;
}

