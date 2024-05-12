<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class Cube {
  constructor(position, index) {
    this.position = position
    this.index = index
  }
}
  let scene, camera, renderer, controller;
  let rubiks;             // 魔方的整体
  let cubes;              // 魔方的组成，即立方体列表。
  let rotate;
  let origin;             // 原始的索引
  let staticState;        // 静态的索引。即使索引和位置相对于世界坐标不变。

  let isRotating = false; // 是否在旋转
  let startCube;          // 焦点立方体 
  let normalize;          // 焦点立方体表面的法线
  let startPoint;         // 鼠标焦点的起始位置

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
    setupRubiks();
    setupCubes();
    setupRenderer();
    setupControls();
    setupEvents();
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
    window.addEventListener('mousedown', startMouse);
    window.addEventListener('mousemove', moveMouse);
    window.addEventListener('mouseup', stopMouse);
    window.addEventListener('touchstart', startMouse);
    window.addEventListener('touchmove', moveMouse);
    window.addEventListener('touchend', stopMouse);
  }

  /**
   * 设置各个立方体的位置索引
   */
  function updateCubeIndex() {
    // 遍历所有立方体
    for (let i = 0; i < cubes.lenght; i++) {
      let cube = cubes[i];
      
    }
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
    console.log("create cubes");
    for (var i = 0; i < num; i++) {
      for (var j = 0; j < num * num; j++) {
        var box = new THREE.BoxGeometry(len, len, len);
        var mesh = new THREE.Mesh(box, materials);
        // 依次计算各个小方块中心点坐标
        mesh.position.x = (leftUpX + len / 2) + (j % num) * len;
        mesh.position.y = (leftUpY - len / 2) - parseInt(j / num) * len;
        mesh.position.z = (leftUpZ - len / 2) - i * len;
        console.log(mesh.position);
        cubes.push(mesh);
      }
    }
    console.log("finish cubes");
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

  /**
   * 魔方控制方法
   */
  function startMouse(event) {
    // 找到
    const value = getIntersectAndNormalize(event);
    normalize = value.normalize; 
    // 魔方没有处于转动过程中且存在碰撞物体
    if (!isRotating && value.intersect) {
      controller.enabled = false;   // 当刚开始的接触点在魔方上时操作为转动魔方，屏蔽控制器转动
      startCube = value.intersect.object;
      startPoint = value.intersect.point; // 开始转动，设置起始点
    } else {
      controller.enabled = true;    // 当刚开始的接触点没有在魔方上或者在魔方上，但是魔方正在转动时操作转动控制器
    }
  }

  function moveMouse(event) {
    const value = getIntersectAndNormalize(event);
    if (!isRotating && value.intersect && startPoint) {
      const movePoint = value.intersect.point;
      if (!movePoint.equals(startPoint)) {
        isRotating = true;
        let vector = movePoint.sub(startPoint);
        let direction = getDirection(vector);
        let cubes = getPlaneCubes(startCube, direction);
        console.log("direction: " + direction);
        for (let i = 0; i < cubes.length; i++) {
          console.log(cubes[i]);
        }
        // const startTime = Date.now();
        // requestAnimationFrame((timestamp) => {
        //   rotateAnimation(cubes, direction, startTime);
        // });
      }
    };
  }

  function stopMouse(event) {
    startCube = null;
    startPoint = null;
    // TODO: @baocq
    isRotating = false;
    controller.enabled = true;
  }

  /**
   * 获取操作焦点以及该焦点所在平面的法向量 
   * */ 
  function getIntersectAndNormalize(event) {
    let mouse = new THREE.Vector2();
    if (event.touches) {
      // 触摸事件
      var touch = event.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    } else {
      // 鼠标事件
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    // Raycaster方式定位选取元素，可能会选取多个，以第一个为准
    var intersects = raycaster.intersectObjects(scene.children);
    var intersect, normalize;
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
    return {intersect: intersect, normalize: normalize};
  }

  // 获取世界坐标
  function getWorldPosition(event) {
    let x = (event.clientX / window.innerWidth) * 2 - 1;
    let y = -(event.clientY / window.innerHeight) * 2 + 1;

    let vector = new THREE.Vector3(x, y, 0.5); // 假设在一定深度创建，确保在摄像机前方
    vector.unproject(camera);
    let dir = vector.sub(camera.position).normalize();
    let distance = -camera.position.z / dir.z; // 根据需要调整，确保物体在摄像机前方可见
    let pos = camera.position.clone().add(dir.multiplyScalar(distance));
    return pos;
  }

  /**
   * 根据立方体和旋转方向，找到同一平面上的所有立方体
   */
  function getPlaneCubes(cube, direction) {
    let results = [];
    let orientation = direction % 10;
    let radians = (orientation % 2 == 1) ? 90 : -90;
    console.log("orientation => " + orientation);
    switch (orientation) {
      case 1:
      case 2:
        // 绕x轴
        for (let i = 0; i < cubes.length; i++) {
          let curr = cubes[i];
          if (curr.position.x == cube.position.x) {
            results.push(curr);
          }
        }
        break;
      case 3:
      case 4:
        // 绕y轴
        for (let i = 0; i < cubes.length; i++) {
          let curr = cubes[i];
          if (curr.position.y == cube.position.y) {
            results.push(curr);
          }
        }
        break;
      case 5:
      case 6:
        // 绕z轴
        for (let i = 0; i < cubes.length; i++) {
          let curr = cubes[i];
          if (curr.position.z == cube.position.z) {
            results.push(curr);
          }
        }
        break;
    }
    return results;
  }
  // 
  /**
   * 获得旋转方向
   * vector3: 鼠标滑动的方向
   */
  function getDirection(vector3) {
    var direction;
    // 判断差向量和 x、y、z 轴的夹角
    var xAngle = vector3.angleTo(xLine);
    var xAngleAd = vector3.angleTo(xLineAd);
    var yAngle = vector3.angleTo(yLine);
    var yAngleAd = vector3.angleTo(yLineAd);
    var zAngle = vector3.angleTo(zLine);
    var zAngleAd = vector3.angleTo(zLineAd);
    var minAngle = Math.min(...[xAngle, xAngleAd, yAngle, yAngleAd, zAngle, zAngleAd]);  // 最小夹角
    console.log("vector: ");
    console.log(vector3);
    switch(minAngle){
      case xAngle:
        direction = 0;  // 向x轴正方向旋转90度（还要区分是绕z轴还是绕y轴）
        if (normalize.equals(yLine)) {
          direction = direction + 5;  // 绕z轴顺时针
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 6;  // 绕z轴逆时针
        } else if (normalize.equals(zLine)) {
          direction = direction + 4;  // 绕y轴逆时针
        } else if (normalize.equals(zLineAd)) {
          direction = direction + 3;  // 绕y轴顺时针
        }
        break;
      case xAngleAd:
        direction = 10;  // 向x轴反方向旋转90度
        if (normalize.equals(yLine)) {
          direction = direction + 6;  // 绕z轴逆时针
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 5;  // 绕z轴顺时针
        } else if (normalize.equals(zLine)) {
          direction = direction + 3;  // 绕y轴顺时针
        } else if (normalize.equals(zLineAd)) {
          direction = direction + 4;  // 绕y轴逆时针
        }
        break;
      case yAngle:
        direction = 20;  // 向y轴正方向旋转90度
        if (normalize.equals(zLine)) {
          direction = direction + 2;  // 绕x轴逆时针
        } else if (normalize.equals(zLineAd)) {
          direction = direction + 1;  // 绕x轴顺时针
        } else if (normalize.equals(xLine)) {
          direction = direction + 6;  // 绕z轴逆时针
        } else {
          direction = direction + 5;  // 绕z轴顺时针
        }
        break;
      case yAngleAd:
        direction = 30;  // 向y轴反方向旋转90度
        if (normalize.equals(zLine)) {
          direction = direction + 1;  // 绕x轴顺时针
        } else if (normalize.equals(zLineAd)) {
          direction = direction + 2;  // 绕x轴逆时针
        } else if (normalize.equals(xLine)) {
          direction = direction + 5;  // 绕z轴顺时针
        } else {
          direction = direction + 6;  // 绕z轴逆时针
        }
        break;
      case zAngle:
        direction = 40;  // 向z轴正方向旋转90度
        if (normalize.equals(yLine)) {
          direction = direction + 1;  // 绕x轴顺时针
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 2;  // 绕x轴逆时针
        } else if (normalize.equals(xLine)) {
          direction = direction + 3;  // 绕y轴顺时针
        } else if (normalize.equals(xLineAd)) {
          direction = direction + 4;  // 绕y轴逆时针
        }
        break;
      case zAngleAd:
        direction = 50;  // 向z轴反方向旋转90度
        if (normalize.equals(yLine)) {
          direction = direction + 2;  // 绕x轴逆时针
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 1;  // 绕x轴顺时针
        } else if (normalize.equals(xLine)) {
          direction = direction + 4;  // 绕y轴逆时针
        } else if (normalize.equals(xLineAd)) {
          direction = direction + 3;  // 绕y轴顺时针
        }
        break;
      default:
        break;
    }
    return direction;
  }

  function rotateAroundX(cube, radians, progress) {
    let xAxis = new THREE.Vector3(x, 1, 0);
    let targetRotation = THREE.MathUtils.degToRad(radians);
    if (progress >= 1) {
      cube.rotation.x = targetRotation;
      return true;
    }
    let currentRotation = targetRotation * progress;
    cube.rotation.x = currentRotation;
    cube.rotateOnWorldAxis(xAxis, currentRotation - cube.rotation.x);
    return false;
  }

  function rotateAroundY(cube, radians, progress) {
    let yAxis = new THREE.Vector3(0, 1, 0);
    let targetRotation = THREE.MathUtils.degToRad(radians);

    if (progress >= 1) {
      cube.rotation.y = targetRotation;
      return true;
    }
    let currentRotation = targetRotation * progress;
    cube.rotation.y = currentRotation;
    cube.rotateOnWorldAxis(yAxis, currentRotation - cube.rotation.y);
    return false;
  }

  function rotateAroundZ(cube, radians, progress) {
    let zAxis = new THREE.Vector3(0, 0, 1);
    let targetRotation = THREE.MathUtils.degToRad(radians);

    if (progress >= 1) {
      // 动画完成，退出
      cube.rotation.z = targetRotation;
      return true;
    }
    
    // 每次调用旋转的角度是目标角度乘以时间的分数表示
    let currentRotation = targetRotation * progress;
    cube.rotation.y = currentRotation;
    cube.rotateOnWorldAxis(zAxis, currentRotation - cube.rotation.y);
    return false;
  }

  function rotateAnimation(cubes, direction, startTime) {
    const duration = 500;

    const elapsedTime = Date.now() - startTime;     // 已过时间
    const progress = elapsedTime / duration;        // 已过时间的比例
    let complete = false;
    if (progress > 1) {
      return;
    }
    let orientation = direction % 10;
    let radians = (orientation % 2 == 1) ? 90 : -90;
    console.log("rotateAnimation");
    console.log("orientation -> " + orientation);
    switch (orientation) {
      case 1:
      case 2:
        for (let i = 0; i < cubes.length; i++) {
          const result = rotateAroundX(cubes[i], radians, progress);
          complete = complete && result;
        }
        break;
      case 3:
      case 4:
        for (let i = 0; i < cubes.length; i++) {
          const result = rotateAroundY(cubes[i], radians, progress);
          complete = complete && result;
        }
        break;
      case 5:
      case 6:
        for (let i = 0; i < cubes.length; i++) {
          const result = rotateAroundZ(cubes[i], radians, progress);
          complete = complete && result;
        }
        break;
    }
    requestAnimationFrame((time) => {
      rotateAnimation(cubes, direction, startTime);
    });
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