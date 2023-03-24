import './styles.css';

import THREE from 'three';
import CANNON from 'cannon';
import { DiceManager, DiceD20 } from 'threejs-dice/lib/dice';

// standard global variables
let container,
  scene,
  camera,
  renderer,
  controls,
  stats,
  world = [];
let dice;

init();

// FUNCTIONS
function init({ screenWidth = 500, screenHeight = 500 }) {
  // SCENE
  scene = new THREE.Scene();

  // CAMERA
  const SCREEN_WIDTH = screenWidth;
  const SCREEN_HEIGHT = screenHeight;
  const VIEW_ANGLE = 20;
  const ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
  const NEAR = 1;
  const FAR = SCREEN_HEIGHT * 1.3;

  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);

  camera.position.set(0, 100, 0);

  // RENDERER
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container = document.getElementById('ThreeJS');
  container.appendChild(renderer.domElement);

  let ambient = new THREE.AmbientLight('#ffffff', 0.3);
  scene.add(ambient);

  let directionalLight = new THREE.DirectionalLight('#ffffff', 0.5);
  directionalLight.position.x = -1000;
  directionalLight.position.y = 1000;
  directionalLight.position.z = 1000;
  scene.add(directionalLight);

  let light = new THREE.SpotLight(0xefdfd5, 1.3);
  light.position.y = 100;
  light.target.position.set(0, 0, 0);
  light.castShadow = true;
  light.shadow.camera.near = 50;
  light.shadow.camera.far = 110;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  scene.add(light);

  // FLOOR
  var floorMaterial = new THREE.MeshPhongMaterial({
    color: '#00aa00',
    side: THREE.DoubleSide,
  });
  var floorGeometry = new THREE.PlaneGeometry(30, 30, 10, 10);
  var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  floor.rotation.x = Math.PI / 2;
  scene.add(floor);

  // SKYBOX/FOG
  var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
  var skyBoxMaterial = new THREE.MeshPhongMaterial({
    color: 0x9999ff,
    side: THREE.BackSide,
  });
  var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
  scene.add(skyBox);
  scene.fog = new THREE.FogExp2(0x9999ff, 0.00025);

  ////////////
  // CUSTOM //
  ////////////
  world = new CANNON.World();

  world.gravity.set(0, -9.82 * 20, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 16;

  DiceManager.setWorld(world);

  //Floor
  let floorBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    material: DiceManager.floorBodyMaterial,
  });
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.add(floorBody);

  dice = die = new DiceD20({
    size: 1.5,
    backColor: '#000',
    fontColor: '#fff',
  });
  scene.add(dice.getObject());

  function randomDiceThrow() {
    let yRand = Math.random() * 20;
    dice.getObject().position.x = -15 - (1 % 3) * 1.5;
    dice.getObject().position.y = 2 + Math.floor(1 / 3) * 1.5;
    dice.getObject().position.z = -15 + (1 % 3) * 1.5;
    dice.getObject().quaternion.x = ((Math.random() * 90 - 45) * Math.PI) / 180;
    dice.getObject().quaternion.z = ((Math.random() * 90 - 45) * Math.PI) / 180;
    dice.updateBodyFromMesh();
    let rand = Math.random() * 5;
    dice.getObject().body.velocity.set(25 + rand, 40 + yRand, 15 + rand);
    dice
      .getObject()
      .body.angularVelocity.set(20 * Math.random() - 10, 20 * Math.random() - 10, 20 * Math.random() - 10);

    DiceManager.prepareValues([{ dice: dice, value: 1 }]);
  }

  document.querySelector('#ThreeJS').addEventListener('click', randomDiceThrow);

  window.requestAnimationFrame(animate);
}

function animate() {
  updatePhysics();
  render();

  window.requestAnimationFrame(animate);
}

function updatePhysics() {
  world.step(1.0 / 60.0);
  dice.updateMeshFromBody();
}

function render() {
  renderer.render(scene, camera);
}