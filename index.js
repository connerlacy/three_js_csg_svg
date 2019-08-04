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
import Snap from 'snapsvg/dist/snap.svg-min.js'

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

var num_positive = 5;
var num_negative = 5;
var grid

//var svg_draw = SVG('svg_drawing').size(300, 300)
var mult =2.5;
var positive_size = 5;

var box, sphere, cylinder, mat, results;
var generate = false;
var newDom = false;

var paths = [];

var svg_draw = SVG('svg_drawing').size(300, 300)

var snap = Snap(500,500);
// Lets create big circle in the middle:
var bigCircle = snap.circle(150, 150, 100);
// By default its black, lets change its attributes

function init()
{
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = 10;
  renderer = new SVGRenderer();
	renderer.setSize( 300, 300 );
  renderer.setClearColor({color:0xffff00, alpha:0.1});
	//renderer.setQuality( 'low' );
  //renderer.domElement.id = "renderer";
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
    //console.log(renderer.domElement);
    //console.log(document.getElementsByTagName('path'));
    paths = [];

    var ps = document.getElementsByTagName('path');
    //var path = svg_draw.svg(renderer.domElement.innerHTML);
    //path.move(500,0);
    //path.fill('black').move(20, 20)
    //svg_draw.svg(renderer.domElement.innerHTML);
    //console.log(renderer.domElement.innerHTML)
    //console.log(ps);
    var p_str_abs = [];

    //console.log();
    for(var i =0;i<ps.length;i++)
    {

        var p_str = ps[i].getAttribute("d");
        p_str_abs.push(Snap.path.toAbsolute(p_str));
        console.log(p_str);
        var temp = "";
        for(var j=0; j < p_str.length; j++)
        {
          switch(p_str[j])
          {
            case 'z':
              temp += ' z';
              paths.push(temp);
              temp = "";
              break;
            case ',':
              temp += ' ';
              break;
            case 'L':
              temp += ' L ';
              break;
            case 'M':
              temp += 'M ';
              break;
            default:
              temp += p_str[j];
              break;
          }
        }
    }

    // console.log("paths_stored");
    //
    for(var i=0;i<paths.length;i++)
    {
      console.log(i + " " + paths[i]);
      var p = snap.path(paths[i]);
      //p.fill('blue').move(20, 20)
      var r = Math.floor(Math.random()*999).toString();
      console.log(r);
      p.attr({ fill: "#"+r , stroke: 'black', strokeWidth: 1 });
    }
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
