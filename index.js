import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
import * as dat from 'dat.gui';
import vertexShader from './shaders/vert-shader.glsl';
import fragmentShader from './shaders/frag-shader.glsl';
import fb_vShader from "./shaders/vert-shader-fbo.glsl"
import fb_fShader from "./shaders/frag-shader-fbo.glsl"
import img_tex from "./textures/texture.jpeg"
import tri_frag from "./shaders/frag_triangle.glsl"
import tri_vert from "./shaders/vert_triangle.glsl"
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js"
import CSG from './modules/CSGMesh.js';
import SVG from 'svg.js'
import {Projector} from "three/examples/jsm/renderers/Projector.js"

var meshA, meshB;
var bspA, bspB;
var bspResult, meshResult;

var mesh_positives = [];
var mesh_negatives = [];


var scene, camera;
var orbitcontrols;

var global_clock = new THREE.Clock();
var global_time = 0;

var renderer;

var boxes = [];
var lines = [];

var num_positive = 2;
var num_negative = 1;
var grid

//var svg_draw = SVG('svg_drawing').size(300, 300)
var mult =2.5;
var positive_size = 5;

var box, sphere, cylinder, mat, results;



function init()
{
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60,window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 10;
  renderer = new SVGRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor({color:0xffff00, alpha:0.1});
	//renderer.setQuality( 'low' );
  renderer.domElement.id = "renderer";
	document.body.appendChild( renderer.domElement );
  orbitcontrols = new THREE.OrbitControls(camera, renderer.domElement);

  //------------------------------------------------------------------
  box = new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial({color:0x00ff00}));
  //scene.add(box)
  sphere = new THREE.Mesh(new THREE.SphereGeometry(2,8,8),new THREE.MeshBasicMaterial({color:0x0000ff}));
  //scene.add(sphere);
  cylinder = new THREE.Mesh( new THREE.CylinderGeometry( 1, 1, 4, 16 ), new THREE.MeshBasicMaterial({color:0xffff00}) );
  //scene.add( cylinder );

  mat = new THREE.MeshBasicMaterial({color:0, wireframe:true});
  results = [];

  //------------------------------------------------------------------
  for(var i=0; i < num_positive; i++)
  {
    mesh_positives[i] = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshBasicMaterial({color:0x00ff00, wireframe:true}));
    mesh_positives[i].position.add( new THREE.Vector3(i*3,0,4));
    //scene.add(mesh_positives[i]);
  }

  for(var i=0; i < num_negative; i++)
  {
    mesh_negatives[i] = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshBasicMaterial({color:0x0000ff}));
    //scene.add(mesh_negatives[i]);
  }
}

function render()
{
  global_time += global_clock.getDelta();
  requestAnimationFrame(render);

  cylinder.rotation.y += 0.01;
  sphere.position.x=Math.sin(global_time)*2;
  sphere.position.z=Math.cos(global_time)*0.5;
  sphere.position.t=Math.sin(global_time*-0.12)*0.5;

  for(var i=0;i<mesh_negatives.length;i++)
  {
    mesh_negatives[i].rotation.z = Math.sin(global_time)*2.*(i+1);
    mesh_negatives[i].rotation.y = Math.sin(global_time)*2.*(i+1);
  }

  recompute();

  renderer.render(scene,camera);
}

function doCSG(a,b,op,mat)
{
    var bspA = CSG.fromMesh( a );
    var bspB = CSG.fromMesh( b );
    var bspC = bspA[op]( bspB );
    var result = CSG.toMesh( bspC, a.matrix );
    result.material = mat;
    result.castShadow  = result.receiveShadow = true;
    return result;
}

function recompute(){
    for(var i=0;i<results.length;i++)
    {
        var m = results[i]
        m.parent.remove(m)
        m.geometry.dispose();
    }
    results = [];

    for(var i=0;i<num_positive.length;i++)
    {
      mesh_positives[i].updateMatrix();
    }

    for(var i=0;i<num_negative.length;i++)
    {
      mesh_negatives[i].updateMatrix();
    }

    for(var i=0;i<mesh_positives.length;i++)
    {
      var r = mesh_positives[i];

      for(var j=0;j<mesh_negatives.length;j++)
      {
          r.updateMatrix();
          mesh_negatives[j].updateMatrix();

          r = doCSG(r, mesh_negatives[j],'subtract', mat)
      }

      results.push(r)
    }


    // box.updateMatrix();
    // sphere.updateMatrix();
    // cylinder.updateMatrix();
    //
    // var c = doCSG(cylinder, sphere,'subtract',mat);
    //
    // results.push(doCSG(c,box,'subtract',mat))
    //
    // results.push(doCSG(box,sphere,'intersect',mat))
    // results.push(doCSG(box,sphere,'union',mat))
    //
    // results.push(doCSG(sphere,box,'subtract',mat))
    // results.push(doCSG(sphere,box,'intersect',mat))
    // results.push(doCSG(sphere,box,'union',mat))

    for(var i=0;i<results.length;i++){
        var r = results[i];
        scene.add(r)

        // r.position.z += -5 + ((i%3)*5)
        // r.position.x += -5 + (((i/3)|0)*10)
    }
}

init();



render();
