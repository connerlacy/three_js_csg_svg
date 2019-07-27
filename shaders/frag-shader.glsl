const float PI = 3.1415926535897932384626433832795;

uniform   float amplitude;
uniform   float time;
uniform   float freq;
uniform   float samples;
uniform   float wavelength;

// xy, radial
uniform float radial_am_freq1;
uniform float radial_am_freq2;
uniform float radial_am_freq3;
uniform float radial_depth;

// z, axial
uniform float axial_am_freq1;
uniform float axial_am_freq2;
uniform float axial_am_freq3;
uniform float axial_depth;
uniform float axial_scale;

varying   float vert_index_norm;
varying   float inst_index_norm;
varying   float noise;
void main() {
  // gl_FragColor = vec4(
  //   abs(cos(inst_index_norm*5. + 0.5 + time*2.0))*0.3 ,
  //   abs(sin(inst_index_norm*3. + time))*0.4 + abs(sin(inst_index_norm + time*2.))*.6,
  //   abs(sin(inst_index_norm*7. + time*3.)*0.5+0.5)*0.8 + abs(sin(inst_index_norm + time*7.))*.2,
  //   0.25
  // )*noise;

  //gl_FragColor = vec4(noise*1., noise*0.1, 0.1 - noise*0.9, 1.0);
  gl_FragColor = vec4(1.);
}

// #pragma glslify: noise = require('glsl-noise/simplex/3d')
//
// precision mediump float;
// varying vec3 vpos;
// void main () {
//   gl_FragColor = vec4(noise(vpos*25.0),1);
// }
