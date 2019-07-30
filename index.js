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
import Simplex from 'simplex-noise';

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

var num_positive = 10;
var num_negative = 10;
var grid

//var svg_draw = SVG('svg_drawing').size(300, 300)
var mult =2.5;
var positive_size = 5;

var box, sphere, cylinder, mat, results;
var generate = false;
var newDom = false;

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

  mat = new THREE.MeshBasicMaterial({color:0, wireframe:true});
  results = [];

  document.onkeydown = function (e)
  {
    switch(e.keyCode)
    {
      case 71:
        generate = true;
        break;
      case 84:
        newDom = true;
        break;
      default:
        break;
    }
  }
}

function render()
{
  global_time += global_clock.getDelta();
  requestAnimationFrame(render);

  //------------------------------------------------------------------

  if(generate)
  {
    generate = false;
    gen_geometry();
    recompute();
  }

  renderer.render(scene,camera);

  if(newDom)
  {
    newDom = false;
    console.log(renderer.domElement);
  }
}

function intersecting(obj1, obj2)
{
  // This function avoids artifacts
  // in the face rendering
  obj1.geometry.computeBoundingBox();
  obj2.geometry.computeBoundingBox();

  var bb1 = new THREE.Box3();
  bb1.copy(obj1.geometry.boundingBox);
  var bb2 = new THREE.Box3();
  bb2.copy(obj2.geometry.boundingBox);

  obj1.updateMatrixWorld(true);
  bb1.applyMatrix4(obj1.matrixWorld);

  obj2.updateMatrixWorld(true);
  bb2.applyMatrix4(obj2.matrixWorld);

  if (bb1.intersectsBox(bb2))
  {
    return true;
  }

  return false;
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

function recompute()
{
    for(var i=0;i<results.length;i++)
    {
        var m = results[i]
        m.parent.remove(m)
        m.geometry.dispose();
    }
    results = [];

    for(var i=0;i<mesh_positives.length;i++)
    {
      var r = mesh_positives[i];

      for(var j=0;j<mesh_negatives.length;j++)
      {
          r.updateMatrix();
          mesh_negatives[j].updateMatrix();

          if(intersecting(r,mesh_negatives[j]))
          {
            r = doCSG(r, mesh_negatives[j],'subtract', mat)
          }
      }

      results.push(r)
    }

    for(var i=0;i<results.length;i++){
        var r = results[i];
        scene.add(r)
    }
}

function gen_geometry()
{
  //------------------------------------------------------------------
  mesh_positives = [];
  mesh_negatives = [];
  for(var i=0; i < num_positive; i++)
  {
    //Boxes
    let xLoc = (Math.random()+1)*(i*3)%10 - 8;
    let yLoc = (Math.random()+1)*i*2%10 - 5;
    let zLoc = (Math.random()+1)*i*3%10 - 8;

    let xRot = (Math.random()+1)*(i*3)%10 - 8;
    let yRot = (Math.random()+1)*(i*3)%10 - 8;
    let zRot = (Math.random()+1)*(i*3)%10 - 8;

    mesh_positives[i] = new THREE.Mesh(new THREE.BoxGeometry(3*(Math.random()+1),5,1), new THREE.MeshBasicMaterial({color:0xffffff*Math.random(), wireframe:true}));
    mesh_positives[i].position.add( new THREE.Vector3(xLoc, yLoc, zLoc));
    mesh_positives[i].rotation.x += xRot;//( new THREE.Vector3(xRot, yRot, zRot));
    mesh_positives[i].rotation.y += yRot;
    mesh_positives[i].rotation.z += zRot;

    //scene.add(mesh_positives[i]);
  }

  for(var i=0; i < num_negative; i++)
  {
    let xLoc = (Math.random()+1)*(i*3)%10 - 8;
    let yLoc = (Math.random()+1)*i*2%10 - 5;
    let zLoc = (Math.random()+1)*i*3%10 - 8;
    mesh_negatives[i] = new THREE.Mesh(new THREE.BoxGeometry(4,4,4), new THREE.MeshBasicMaterial({color:0xffffff*Math.random()}));
    mesh_negatives[i].position.add( new THREE.Vector3(xLoc, yLoc, zLoc));
    //scene.add(mesh_negatives[i]);
  }

}

init();
render();
