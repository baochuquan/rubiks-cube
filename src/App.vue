<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  let scene, camera, renderer, controller;
  let cubes;
  let raycaster = new THREE.Raycaster();
  let isRotating = false;
  let intersect, normalize;
  let startPoint;
  let mouse = new THREE.Vector2();

  // 魔方转动的六个方向
  var xLine = new THREE.Vector3( 1, 0, 0 );     // X轴正方向
  var xLineAd = new THREE.Vector3( -1, 0, 0 );  // X轴负方向
  var yLine = new THREE.Vector3( 0, 1, 0 );     // Y轴正方向
  var yLineAd = new THREE.Vector3( 0, -1, 0 );  // Y轴负方向
  var zLine = new THREE.Vector3( 0, 0, 1 );     // Z轴正方向
  var zLineAd = new THREE.Vector3( 0, 0, -1 );  // Z轴负方向

  setup();
  animate();

  function setup() {
    setupScene();
    setupCamera();
    setupAxesHelper();
    setupLights();
    setupRubiksCube();
    setupFackCube();
    setupRenderer();
    setupControls();
  }

  function setupScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x5DB7FF, 10, 100 );
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

  function setupRubiksCube() {
    cubes = createCube(0, 0, 0, 3, 1);
    for (var i = 0; i < cubes.length; i++) {
      var cube = cubes[i];
      scene.add(cube);
    }
  }

  function setupFackCube() {
    // 透明正方体
    // let box = new THREE.BoxGeometry(3, 3, 3);
    // for (var i = 0; i < box.faces.length; i++) {
    //   box.faces[i].color.setHex(0x000000);
    // }
    // let mesh = new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors, opacity: 0, transparent: true});
    // let cube = new THREE.Mesh(box, mesh);
    // cube.cubeType = 'coverCube';
    // scene.add(cube);
  }

  function setupRenderer() {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // 色调映射
    renderer.toneMapping = THREE.NoToneMapping;//THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
  }

  function setupControls() {
    // 初始化控制器
    controller = new OrbitControls(camera, renderer.domElement);
    controller.enableDamping = true;
  }

  function setupEvents() {
    window.addEventListener('mousedown', startCube);
    window.addEventListener('mousemove', moveCube);
    window.addEventListener('mouseup', stopCube);
    window.addEventListener('touchstart', startCube);
    window.addEventListener('touchmove', moveCube);
    window.addEventListener('touchend', stopCube);
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
      loader.load("./img/orange.png"),
      loader.load("./img/red.png"),
      loader.load("./img/white.png"),
      loader.load("./img/yellow.png"),
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
    // const delta = clock.getDelta();
    // if (figurine !== undefined) {
    //   figurine.rotation.z += delta * 0.2;
    // }
    // for (let i = 0; i < spirals.length; i++) {
    //   const spiral = spirals[i];
    //   spiral.rotation.y += delta * 0.3;
    // }
    renderer.render(scene, camera);
  }

  /**
   * 魔方控制方法
   */
  function startCube(window, event) {
    getIntersects(event);
    // 魔方没有处于转动过程中且存在碰撞物体
    if (!isRotating && intersect) {
      startPoint = intersect.point; // 开始转动，设置起始点
      controller.enabled = false;   // 当刚开始的接触点在魔方上时操作为转动魔方，屏蔽控制器转动
    } else {
      controller.enabled = true;    // 当刚开始的接触点没有在魔方上或者在魔方上，但是魔方正在转动时操作转动控制器
    }
  }

  function moveCube(window, event) {

  }

  function stopCube(window, event) {

  }

  // 获取操作焦点以及该焦点所在平面的法向量
  function getIntersects(event) {
    // 触摸事件和鼠标事件获得坐标的方式有点区别
    if (event.touches) {
      var touch = event.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    } else {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    raycaster.setFromCamera(mouse, camera);
    // Raycaster方式定位选取元素，可能会选取多个，以第一个为准
    var intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length) {
      try {
        if (intersects[0].object.cubeType === 'coverCube') {
          intersect = intersects[1];
          normalize = intersects[0].face.normal;
        } else {
          // 理论上不会进入
          intersect = intersects[0];
          normalize = intersects[1].face.normal;
        }
      } catch(err) {
        //nothing
      }
    }
  }

  // 获得旋转方向
  function getDirection(vector3){
    var direction;
    // 判断差向量和x、y、z轴的夹角
    var xAngle = vector3.angleTo(xLine);
    var xAngleAd = vector3.angleTo(xLineAd);
    var yAngle = vector3.angleTo(yLine);
    var yAngleAd = vector3.angleTo(yLineAd);
    var zAngle = vector3.angleTo(zLine);
    var zAngleAd = vector3.angleTo(zLineAd);
    var minAngle = min([xAngle, xAngleAd, yAngle, yAngleAd, zAngle, zAngleAd]);  // 最小夹角
    switch(minAngle){
      case xAngle:
        direction = 0;  // 向x轴正方向旋转90度（还要区分是绕z轴还是绕y轴）
        if (normalize.equals(yLine)) {
          direction = direction + 0.1;  // 绕z轴顺时针
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 0.2;  // 绕z轴逆时针
        } else if (normalize.equals(zLine)) {
          direction = direction + 0.3;  // 绕y轴逆时针
        } else {
          direction = direction + 0.4;  // 绕y轴顺时针
        }
        break;
      case xAngleAd:
        direction = 1;  // 向x轴反方向旋转90度
        //...
        break;
      case yAngle:
        direction = 2;  // 向y轴正方向旋转90度
        //...
        break;
      case yAngleAd:
        direction = 3;  // 向y轴反方向旋转90度
        //...
        break;
      case zAngle:
        direction = 4;  // 向z轴正方向旋转90度
        //...
        break;
      case zAngleAd:
        direction = 5;  // 向z轴反方向旋转90度
        //...
        break;
      default:
        break;
    }
    return direction;
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