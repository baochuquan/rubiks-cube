<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  let scene, camera, renderer, controller;
  let rubiks;             // 魔方的整体
  let cubes;              // 魔方的组成，即立方体列表。

  setup();
  animate();

  function setup() {
    setupScene();
    setupCamera();
    // setupAxesHelper();
    setupLights();
    setupRubiks();
    setupCubes();
    setupRenderer();
    setupControls();
  }

  function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);
  }

  function setupCamera() {
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1, 
      1000
    );
    camera.position.set(10, 12, 10);
    camera.lookAt(0, 3, 0);
    camera.fov = 45
    camera.updateProjectionMatrix();
  }

  function setupAxesHelper() {
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
  }

  function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xFFFFFF);
    scene.add(ambientLight);
  }

  function setupRubiks() {
    // 透明正方体
    let box = new THREE.BoxGeometry(3, 3, 3);
    let mesh = new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors, opacity: 0, transparent: true});
    rubiks = new THREE.Mesh(box, mesh);
    rubiks.cubeType = 'coverCube';
    scene.add(rubiks);
  }

  function setupCubes() {
    cubes = createCube(0, 0, 0, 3, 1);
    for (var i = 0; i < cubes.length; i++) {
      var cube = cubes[i];
      scene.add(cube);
    }
  }

  function setupRenderer() {
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
  }

  function setupControls() {
    // 初始化控制器
    controller = new OrbitControls(camera, renderer.domElement);
    controller.enableDamping = true;
  }


  /**
   * x, y, z: 魔方中心坐标
   * num: 魔方阶数
   * len: 小方块的宽高
   * colors: 魔方六面体的颜色
   */
  function createCube(x, y, z, num, len) {
    // 魔方左上角坐标
    var leftUpX = x - num / 2 * len;
    var leftUpY = y + num / 2 * len;
    var leftUpZ = z + num / 2 * len;
    // 根据颜色生成材质
    const loader = new THREE.TextureLoader();
    const textures = [
      loader.load("./img/blue.png"),
      loader.load("./img/green.png"),
      loader.load("./img/yellow.png"),
      loader.load("./img/white.png"),
      loader.load("./img/orange.png"),
      loader.load("./img/red.png"),
    ];
    const materials = textures.map(texture => new THREE.MeshBasicMaterial({ map: texture }));
    // 生成小方块
    var cubes = [];
    for (var i = 0; i < num; i++) {
      for (var j = 0; j < num * num; j++) {
        var box = new THREE.BoxGeometry(len, len, len);
        var mesh = new THREE.Mesh(box, materials);
        // 依次计算各个小方块中心点坐标
        mesh.position.x = (leftUpX + len / 2) + (j % num) * len;
        mesh.position.y = (leftUpY - len / 2) - parseInt(j / num) * len;
        mesh.position.z = (leftUpZ - len / 2) - i * len;
        mesh.tag = i * 9 + j;
        cubes.push(mesh);
      }
    }
    return cubes;
  }

  // 动画方法
  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  // 渲染方法
  function render() {
    renderer.render(scene, camera);
  }

</script>


<template>
  <div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
}

canvas {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
}
</style>