<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import ForkMeOnGitHub from './components/ForkMeOnGitHub.vue';
import { vec2 } from 'three/examples/jsm/nodes/Nodes.js';
import { step } from 'three/examples/jsm/nodes/Nodes.js';
import { cos } from 'three/examples/jsm/nodes/Nodes.js';

class CubePosition {
  constructor(x, y, z, index) {
    this.x = x;
    this.y = y;
    this.z = z;
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
  const xLine = new THREE.Vector3( 1, 0, 0 );     // X轴正方向
  const xLineAd = new THREE.Vector3( -1, 0, 0 );  // X轴负方向
  const yLine = new THREE.Vector3( 0, 1, 0 );     // Y轴正方向
  const yLineAd = new THREE.Vector3( 0, -1, 0 );  // Y轴负方向
  const zLine = new THREE.Vector3( 0, 0, 1 );     // Z轴正方向
  const zLineAd = new THREE.Vector3( 0, 0, -1 );  // Z轴负方向
    
  const width = window.innerWidth;
  const height = window.innerHeight;
  const rotateDuration = 500; // 转动的总运动时间
  const cubeLength = 1;

  let isAutoRecover = false;
  let topColor;
  let btmColor;
  let currentStep = 1;

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
    camera.position.set(6, 8, 6);
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
    // rubiks = new THREE.Mesh(box, materials);
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
        const x = (leftUpX + len / 2) + (j % num) * len;
        const y = (leftUpY - len / 2) - parseInt(j / num) * len;
        const z = (leftUpZ - len / 2) - i * len; 
        const index = i * 9 + j;
        const position = new CubePosition(x, y, z, index);
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.position.z = z;
        mesh.index = index;
        mesh.initPosition = position;
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
        const startstamp = Date.now();
        requestAnimationFrame((timestamp) => {
          rotateAnimation(cubes, direction, timestamp, 0);
        });
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
   * @param cube 焦点立方体
   * @param direction 旋转轴
   */
  function getPlaneCubes(cube, direction) {
    let results = [];
    let orientation = direction % 10;
    let radians = (orientation % 2 == 1) ? 90 : -90;
    switch (orientation) {
      case 1:
      case 2:
        // 绕x轴
        for (let i = 0; i < cubes.length; i++) {
          let curr = cubes[i];
          if (Math.abs(curr.position.x - cube.position.x) < cubeLength / 2) {
            results.push(curr);
          }
        }
        break;
      case 3:
      case 4:
        // 绕y轴
        for (let i = 0; i < cubes.length; i++) {
          let curr = cubes[i];
          if (Math.abs(curr.position.y - cube.position.y) < cubeLength / 2) {
            results.push(curr);
          }
        }
        break;
      case 5:
      case 6:
        // 绕z轴
        for (let i = 0; i < cubes.length; i++) {
          let curr = cubes[i];
          if (Math.abs(curr.position.z - cube.position.z) < cubeLength / 2) {
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
    switch(minAngle){
      case xAngle:
        direction = 10;  // 向x轴正方向旋转90度（还要区分是绕z轴还是绕y轴）
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
        direction = 20;  // 向x轴反方向旋转90度
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
        direction = 30;  // 向y轴正方向旋转90度
        if (normalize.equals(zLine)) {
          direction = direction + 1;  // 绕x轴顺时针
        } else if (normalize.equals(zLineAd)) {
          direction = direction + 2;  // 绕x轴逆时针
        } else if (normalize.equals(xLine)) {
          direction = direction + 6;  // 绕z轴逆时针
        } else {
          direction = direction + 5;  // 绕z轴顺时针
        }
        break;
      case yAngleAd:
        direction = 40;  // 向y轴反方向旋转90度
        if (normalize.equals(zLine)) {
          direction = direction + 2;  // 绕x轴逆时针
        } else if (normalize.equals(zLineAd)) {
          direction = direction + 1;  // 绕x轴顺时针
        } else if (normalize.equals(xLine)) {
          direction = direction + 5;  // 绕z轴顺时针
        } else {
          direction = direction + 6;  // 绕z轴逆时针
        }
        break;
      case zAngle:
        direction = 50;  // 向z轴正方向旋转90度
        if (normalize.equals(yLine)) {
          direction = direction + 2;  // 绕x轴逆时针
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 1;  // 绕x轴顺时针
        } else if (normalize.equals(xLine)) {
          direction = direction + 3;  // 绕y轴顺时针
        } else if (normalize.equals(xLineAd)) {
          direction = direction + 4;  // 绕y轴逆时针
        }
        break;
      case zAngleAd:
        direction = 60;  // 向z轴反方向旋转90度
        if (normalize.equals(yLine)) {
          direction = direction + 1;  // 绕x轴顺时针
        } else if (normalize.equals(yLineAd)) {
          direction = direction + 2;  // 绕x轴逆时针
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

  function rotateAnimation(cubes, direction, currentstamp, startstamp, laststamp, callback) {
    if(startstamp === 0){
        startstamp = currentstamp;
        laststamp = currentstamp;   
    }
    let isLastRotate = false;    // 是否是最后一次微旋转
    if(currentstamp - startstamp >= rotateDuration){
      currentstamp = startstamp + rotateDuration;
      isLastRotate = true;
    }
    let orientation = direction % 10;
    let radians = (orientation % 2 == 1) ? -90 : 90;
    switch (orientation) {
      case 1:
      case 2:
        for (let i = 0; i < cubes.length; i++) {
          rotateAroundWorldX(cubes[i], radians * Math.PI / 180 * (currentstamp - laststamp) / rotateDuration);
        }
        break;
      case 3:
      case 4:
        for (let i = 0; i < cubes.length; i++) {
          rotateAroundWorldY(cubes[i], radians * Math.PI / 180 * (currentstamp - laststamp) / rotateDuration);
        }
        break;
      case 5:
      case 6:
        for (let i = 0; i < cubes.length; i++) {
          rotateAroundWorldZ(cubes[i], radians * Math.PI / 180 * (currentstamp - laststamp) / rotateDuration);
        }
        break;
    }
    if(!isLastRotate){
      requestAnimationFrame((timestamp) => {
        rotateAnimation(cubes, direction, timestamp, startstamp, currentstamp, callback);
      });
    } else {
      isRotating = false;
      startPoint = null;
      // 旋转完成后更新索引
      updateCubeIndex();
      if (callback) {
        // 旋转完成，执行回调
        callback();
      } else {
        console.log("rotateAnimationEnd");
        if (isAutoRecover) {
          switch (currentStep) {
            case 1:
              step1();
              break;
            case 2:
              step2();
              break;
            default:
              break;
          }
        }
      }
    }
  }

  function rotateAroundWorldX(cube, rad){
    var y0 = cube.position.y;
    var z0 = cube.position.z;
    var q = new THREE.Quaternion(); 
    q.setFromAxisAngle(new THREE.Vector3( 1, 0, 0 ), rad);
    cube.quaternion.premultiply(q);
    cube.position.y = Math.cos(rad) * y0 - Math.sin(rad) * z0;
    cube.position.z = Math.cos(rad) * z0 + Math.sin(rad) * y0;
  }

  function rotateAroundWorldY(cube, rad){
    var x0 = cube.position.x;
    var z0 = cube.position.z;
    var q = new THREE.Quaternion(); 
    q.setFromAxisAngle(new THREE.Vector3( 0, 1, 0 ), rad);
    cube.quaternion.premultiply( q );
    cube.position.x = Math.cos(rad) * x0 + Math.sin(rad) * z0;
    cube.position.z = Math.cos(rad) * z0 - Math.sin(rad) * x0;
  }

  function rotateAroundWorldZ(cube, rad){
    var x0 = cube.position.x;
    var y0 = cube.position.y;
    var q = new THREE.Quaternion(); 
    q.setFromAxisAngle(new THREE.Vector3( 0, 0, 1 ), rad);
    cube.quaternion.premultiply( q );
    cube.position.x = Math.cos(rad) * x0 - Math.sin(rad) * y0;
    cube.position.y = Math.cos(rad) * y0 + Math.sin(rad) * x0;
  }

  function randomButtonClick() {
    if (!isRotating && !isAutoRecover) {
      randomRotate();
    }
  }

  function recoverButtonClick() {
      autoRecover();
  }

  /**
   * 更新立方体索引
   */
  function updateCubeIndex() {
    for (let i = 0; i < cubes.length; i++) {
      const cube = cubes[i];
      for (let j = 0; j < cubes.length; j++) {
        const temp = cubes[j];
        if (Math.abs(cube.position.x - temp.initPosition.x) <= cubeLength / 2 
          && Math.abs(cube.position.y - temp.initPosition.y) <= cubeLength / 2 
          && Math.abs(cube.position.z - temp.initPosition.z) <= cubeLength / 2) {
            cube.index = temp.initPosition.index;
            break;
          }
      }
    }
  }

  /**
   * 
   * @param cube 目标立方体
   * @param axis 目标轴方向
   */
  function getCubeFaceColor(cube, axis) {
    const positions = cube.geometry.attributes.position.array;
    const indexs = cube.geometry.index.array;
    const groups = cube.geometry.groups;
    let points = [];
    let normals = [];    
    for (let i = 0; i < positions.length; i += 3) {
      const point = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      points.push(point);
    }    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const index = group.start;
      const p1 = points[indexs[index]];
      const p2 = points[indexs[index+1]];
      const p3 = points[indexs[index+2]];
      let vectorAB = new THREE.Vector3().subVectors(p2, p1);
      let vectorAC = new THREE.Vector3().subVectors(p3, p1);
      // 计算法向量（N）：AB x AC
      let normal = new THREE.Vector3().crossVectors(vectorAB, vectorAC);
      // 可选：规范化法向量
      normal.normalize();
      normals.push(normal);
    }

    // 将 axis 从世界坐标系转换成视图坐标系
    var viewMatrix = new THREE.Matrix4();
    viewMatrix.lookAt(camera.position, new THREE.Vector3(0, 0, 0), camera.up);  // 设置为视图矩阵，对应于 camera 的视角
    viewMatrix.invert();  // 计算逆矩阵，用于将世界坐标系转换成视图坐标系
    var tempVector = axis.clone();
    tempVector.applyMatrix4(viewMatrix);    // 应用逆矩阵，将入参向量转换成视图坐标系

    // 将表面法向量，从模型坐标系转换成视图坐标系
    const normalMatrix = cube.normalMatrix;
    let materialIndex = 0;
    let minAngle = 0;
    let angles = []
    for (var i = 0; i < normals.length; i++) {
        var normal = normals[i].clone();
        normal.applyMatrix3(normalMatrix); // 对于表面法向量，将其从模型坐标系转换成视图坐标系。
        const angle = normal.angleTo(tempVector); // 两者之间的夹角
        angles.push(angle);
        if (i == 0) {
          materialIndex = 0;
          minAngle = angle;
        } else {
          if (angle < minAngle) {
            materialIndex = i;
            minAngle = angle;
          }
        }
    }
    return materialIndex;  // 找到夹角最小的索引值，返回对应索引值。
  }


  /**
   * 根据固定索引获取目标方块
   * @param index 固定索引，相对世界坐标不变
   * @param rotateYCount 绕 Y 轴逆时针旋转的次数
   */
  function getCubeByIndex(index, rotateYCount) {
    const delta1 = [2, 18, -2, -18];
    const delta2 = [10, 8, -10, -8];
    const map1 = {  // cube index : delta start index
       0: 0,  3: 0,  6: 0,
       2: 1,  5: 1,  8: 1,
      20: 2, 23: 2, 26: 2,
      18: 3, 21: 3, 24: 3,
    };
    const map2 = {   // cube index : delta start index
       1: 0,  4: 0,  7: 0,
      11: 1, 14: 1, 17: 1,
      19: 2, 22: 2, 25: 2,
       9: 3, 12: 3, 15: 3,
    }

    let result = index;
    if (map1.hasOwnProperty(index)) {
      for (let i = 0; i < rotateYCount; i++) {
        let offset = map1[index] + i;
        result += delta1[offset % 4];
      }
    } else if (map2.hasOwnProperty(index)) {
      for (let i = 0; i < rotateYCount; i++) {
        let offset = map2[index] + i;
        result += delta2[offset % 4];
      }
    } else {
      // 10, 13, 16，即中心列
      result = index;
    }
    let cube;
    for (let i = 0; i < cubes.length; i++) {
      if (cubes[i].index == result) {
        cube = cubes[i];
        break;
      }
    }
    return cube;
  }

  function getCubeByIndexs(indexs) {
    let results = [];
    for (let i = 0; i < indexs.length; i++) {
      results.push(getCubeByIndex(indexs[i]));
    }
    return results;
  }

  /**
   * 根据绕 Y 轴逆时针旋转的次数，对坐标轴进行转换
   * @param vector 待转换的坐标轴
   * @param rotateYCount 绕 Y 轴逆时针旋转的次数
   */
  function rotateAxisAroundWorldY(axis, rotateYCount) {
    let result = axis;
    for (let i = 0; i < rotateYCount; i++) {
      if (result.angleTo(xLine) == 0) {
        // X -> -Z 
        result = zLineAd.clone();
      } else if (result.angleTo(xLineAd) == 0) {
        // -X -> Z 
        result = zLine.clone();
      } else if (result.angleTo(zLine) == 0) {
        // Z -> X 
        result = xLine.clone();
      } else if (result.angleTo(zLineAd) == 0) {
        // -Z -> -X 
        result = xLineAd.clone();
      }
    }
    return result;
  }

  /**
   * 随机旋转
   */
  function randomRotate() {
    if (!isRotating && !isAutoRecover) {
      const steps = parseInt(10 * Math.random()) + 10; 
      const ops = [U, u, D, d, L, l, R, r, F, f, B, b];
      const queue = [];
      for (let i = 0; i < steps; i++) {
        const index = parseInt(Math.random() * ops.length);
        queue.push(ops[index]);
      }
      runOps(queue, 0, 0);
    }
  }

  function runOps(ops, index, rotateYCount, callback) {
    if (index >= ops.length - 1) {
      if (callback) {
        ops[index](rotateYCount, callback);
      } else {
        ops[index](rotateYCount);
      }
    } else {
      // 递归执行
      ops[index](rotateYCount, () => {
        if (index < ops.length - 1) {
          index++;
          runOps(ops, index, rotateYCount, callback);
        }
      });
    }
  }

    /**
   * 魔方旋转公式：
   * 顺时针: U, D, L, R, F, B 
   * 逆时针: u, d, l, r, f, b
   */
   function U(rotateYCount, callback) {
    console.log("U: "+ rotateYCount);
    const cube2 = getCubeByIndex(2, rotateYCount);
    const n_zLine = rotateAxisAroundWorldY(zLine, rotateYCount);
    const d_xLineAd = rotateAxisAroundWorldY(xLineAd, rotateYCount);
    normalize = n_zLine;
    rotateTo(cube2, d_xLineAd, callback);
  }

  function u(rotateYCount, callback) {
    console.log("u: "+ rotateYCount);
    const cube2 = getCubeByIndex(2, rotateYCount);
    const n_xLine = rotateAxisAroundWorldY(xLine, rotateYCount);
    const d_zLineAd = rotateAxisAroundWorldY(zLineAd, rotateYCount);
    normalize = n_xLine;
    rotateTo(cube2, d_zLineAd, callback);
  }

  function D(rotateYCount, callback) {
    console.log("D: "+ rotateYCount);
    const cube8 = getCubeByIndex(8, rotateYCount);
    const n_xLine = rotateAxisAroundWorldY(xLine, rotateYCount);
    const d_zLineAd = rotateAxisAroundWorldY(zLineAd, rotateYCount);
    normalize = n_xLine;
    rotateTo(cube8, d_zLineAd, callback);
  }

  function d(rotateYCount, callback) {
    console.log("d: "+ rotateYCount);
    const cube8 = getCubeByIndex(8, rotateYCount);
    const n_zLine = rotateAxisAroundWorldY(zLine, rotateYCount);
    const d_xLineAd = rotateAxisAroundWorldY(xLineAd, rotateYCount);
    normalize = n_zLine;
    rotateTo(cube8, d_xLineAd, callback);
  }

  function L(rotateYCount, callback) {
    console.log("L: "+ rotateYCount);
    const cube0 = getCubeByIndex(0, rotateYCount);
    const n_zLine = rotateAxisAroundWorldY(zLine, rotateYCount);
    const d_yLineAd = rotateAxisAroundWorldY(yLineAd, rotateYCount);
    normalize = n_zLine;
    rotateTo(cube0, d_yLineAd, callback); 
  }

  function l(rotateYCount, callback) {
    console.log("l: "+ rotateYCount);
    const cube0 = getCubeByIndex(0, rotateYCount);
    const n_yLine = rotateAxisAroundWorldY(yLine, rotateYCount);
    const d_zLineAd = rotateAxisAroundWorldY(zLineAd, rotateYCount);
    normalize = n_yLine;
    rotateTo(cube0, d_zLineAd, callback); 
  }

  function R(rotateYCount, callback) {
    console.log("R: "+ rotateYCount);
    const cube2 = getCubeByIndex(2, rotateYCount);
    const n_yLine = rotateAxisAroundWorldY(yLine, rotateYCount);
    const d_zLineAd = rotateAxisAroundWorldY(zLineAd, rotateYCount);
    normalize = n_yLine;
    rotateTo(cube2, d_zLineAd, callback); 
  }

  function r(rotateYCount, callback) {
    console.log("r: "+ rotateYCount);
    const cube2 = getCubeByIndex(2, rotateYCount);
    const n_zLine = rotateAxisAroundWorldY(zLine, rotateYCount);
    const d_yLineAd = rotateAxisAroundWorldY(yLineAd, rotateYCount);
    normalize = n_zLine;
    rotateTo(cube2, d_yLineAd, callback); 
  }

  function F(rotateYCount, callback) {
    console.log("F: "+ rotateYCount);
    const cube2 = getCubeByIndex(2, rotateYCount);
    const n_xLine = rotateAxisAroundWorldY(xLine, rotateYCount);
    const d_yLineAd = rotateAxisAroundWorldY(yLineAd, rotateYCount);
    normalize = n_xLine;
    rotateTo(cube2, d_yLineAd, callback); 
  }

  function f(rotateYCount, callback) {
    console.log("f: "+ rotateYCount);
    const cube2 = getCubeByIndex(2, rotateYCount);
    const n_yLine = rotateAxisAroundWorldY(yLine, rotateYCount);
    const d_xLineAd = rotateAxisAroundWorldY(xLineAd, rotateYCount);
    normalize = n_yLine;
    rotateTo(cube2, d_xLineAd, callback); 
  }

  function B(rotateYCount, callback) {
    console.log("B: "+ rotateYCount);
    const cube20 = getCubeByIndex(20, rotateYCount);
    const n_yLine = rotateAxisAroundWorldY(yLine, rotateYCount);
    const d_xLineAd = rotateAxisAroundWorldY(xLineAd, rotateYCount);
    normalize = n_yLine;
    rotateTo(cube20, d_xLineAd, callback); 
  }

  function b(rotateYCount, callback) {
    console.log("b: "+ rotateYCount);
    const cube20 = getCubeByIndex(20, rotateYCount);
    const n_xLine = rotateAxisAroundWorldY(xLine, rotateYCount);
    const d_yLineAd = rotateAxisAroundWorldY(yLineAd, rotateYCount);
    normalize = n_xLine;
    rotateTo(cube20, d_yLineAd, callback); 
  }

  function rotateTo(cube, vector3, callback) {
    isRotating = true;
    const direction = getDirection(vector3);
    const cubes = getPlaneCubes(cube, direction);
    window.requestAnimationFrame((timestamp) => {
      rotateAnimation(cubes, direction, timestamp, 0, null, callback);
    });
  }
  
  /**
   * 第一步：小白花
   */
  function step1() {
    if (checkStep1()) {
      // TODO: @baocq remove
      console.log("step1 success");
      currentStep = 2;
      step2();
      return;
    }
    // 绕 Y 周四个面旋转一周，执行一样的操作
    console.log("recover ...");
    // for (let i = 0; i < 4; i++) {
    //   step1Case1(i);
    //   step1Case2(i);
    //   step1Case3(i);
    //   step1Case4(i);
    // }
    step1Case1(0);
    step1Case1(1);
    step1Case1(2);
    step1Case1(3);

    step1Case2(0);
    step1Case2(1);
    step1Case2(2);
    step1Case2(3);

    step1Case3(0);
    step1Case3(1);
    step1Case3(2);
    step1Case3(3);

    step1Case4(0);
    step1Case4(1);
    step1Case4(2);
    step1Case4(3);

  }

  function checkStep1() {
    const indexs = [1, 9, 11, 19];
    let result = true;
    for (let i = 0; i < indexs.length; i++) {
      let cube = getCubeByIndex(indexs[i]);
      let color = getCubeFaceColor(cube, yLine);
      if (color != btmColor) {
        result = false;
        break;
      }
    }
    return result;
  }

  function step1Case1(rotateYCount) {
    if (!isRotating) {
      console.log("step1Case1: " + rotateYCount);
      let cube3 = getCubeByIndex(3, rotateYCount);
      let cube9 = getCubeByIndex(9, rotateYCount);
      let _zLine = rotateAxisAroundWorldY(zLine, rotateYCount);

      if (getCubeFaceColor(cube3, _zLine) == btmColor) {
        if (getCubeFaceColor(cube9, yLine) != btmColor) {
          l(rotateYCount);
        } else {
          u(rotateYCount);
        }
      }
    }
  }
  function step1Case2(rotateYCount) {
    if (!isRotating) {
      console.log("step1Case2: " + rotateYCount);
      let cube5 = getCubeByIndex(5, rotateYCount);
      let cube11 = getCubeByIndex(11, rotateYCount);
      let _zLine = rotateAxisAroundWorldY(zLine, rotateYCount);

      if (getCubeFaceColor(cube5, _zLine) == btmColor) {
        if (getCubeFaceColor(cube11, yLine) != btmColor) {
          R(rotateYCount);
        } else {
          u(rotateYCount);
        }
      }
    }
  }
  function step1Case3(rotateYCount) {
    if (!isRotating) {
      console.log("step1Case3: " + rotateYCount);
      let cube15 = getCubeByIndex(15, rotateYCount);
      let cube9 = getCubeByIndex(9, rotateYCount);
      let _zLine = rotateAxisAroundWorldY(zLine, rotateYCount);

      if (getCubeFaceColor(cube15, yLineAd) == btmColor) {
        if (getCubeFaceColor(cube9, yLine) != btmColor) {
          l(rotateYCount);
        } else {
          u(rotateYCount);
        }
      } 
    }
  }
  function step1Case4(rotateYCount) {
    if (!isRotating) {
      console.log("step1Case4: " + rotateYCount);
      let cube1 = getCubeByIndex(1, rotateYCount);
      let cube7 = getCubeByIndex(7, rotateYCount);
      let _zLine = rotateAxisAroundWorldY(zLine, rotateYCount);

      if (getCubeFaceColor(cube1, _zLine) == btmColor || getCubeFaceColor(cube7, _zLine) == btmColor) {
        if (getCubeFaceColor(cube1, yLine) != btmColor) {
          F(rotateYCount);
        } else {
          D(rotateYCount);
        }
      }
    }
  }

  function step2() {
    if (checkStep2()) {
      console.log("step2 success");
      currentStep = 3;
      return;
    }
    step2Case1(0);
    step2Case1(1);
    step2Case1(2);
    step2Case1(3);

    // step2Case2(0);
    // step2Case2(1);
    // step2Case2(2);
    // step2Case2(3);

    // step2Case3(0);
    // step2Case3(1);
    // step2Case3(2);
    // step2Case3(3);
  }

  function checkStep2() {
    const indexs = [4, 7, 14, 17, 22, 25, 12, 15];
    const normals = [zLine, xLine, zLineAd, xLineAd];
    const cubes = getCubeByIndexs(indexs);
    for (let i = 0; i < cubes.length; i++) {
      let index = parseInt(i / 2);
      let color1 = getCubeFaceColor(cubes[i], normals[index]);
      if (color1 == topColor || color1 == btmColor) {
        return false;
      }
      if (i % 2 == 0) {
        let color2 = getCubeFaceColor(cubes[i + 1], normals[index]);
        if (color1 != color2) {
          return false;
        }
      }
    }
    // 底部十字
    for (let i = 1; i < cubes.length; i = i + 2) {
      let color = getCubeFaceColor(cubes[i], yLineAd);
      if (color != btmColor) {
        return false;
      }
    }
    return true;
  }

  function step2Case1(rotateYCount) {
    if (!isRotating) {
      console.log("step2Case1: " + rotateYCount);
      let cube1 = getCubeByIndex(1, rotateYCount);
      let cube4 = getCubeByIndex(4, rotateYCount);
      let _zLine = rotateAxisAroundWorldY(zLine, rotateYCount);
      if (getCubeFaceColor(cube1, yLine) == btmColor) {
        if (getCubeFaceColor(cube1, _zLine) == getCubeFaceColor(cube4, _zLine)) {
          // 旋转 180 度
          F(rotateYCount, () => {
            F(rotateYCount);
          });
        } else {
          u(rotateYCount, () => {
            rotateYCount++;
            if (rotateYCount >= 4) {
              rotateYCount = 0;
            }
            step2Case1(rotateYCount);
          });
        }
      }
    }
  }

  function step2Case2(rotateYCount) { 
    if (!isRotating) {
      console.log("step2Case2: " + rotateYCount);
      let cube7 = getCubeByIndex(7, rotateYCount);
      let cube8 = getCubeByIndex(8, rotateYCount); 
      let cube2 = getCubeByIndex(2, rotateYCount);
      let xLine = rotateAxisAroundWorldY(xLine, rotateYCount);
      if (getCubeFaceColor(cube7, yLineAd) == btmColor && getCubeFaceColor(cube8, yLineAd) == btmColor) {
        if (getCubeFaceColor(cube2, xLine) != btmColor) {
          R(rotateYCount, () => {
            u(rotateYCount, () => {
              r(rotateYCount);
            });
          });
        } else {
          f(rotateYCount, () => {
            u(rotateYCount, () => {
              F(rotateYCount);
            });
          });
        }
      }
    }
  }

  function step2Case3(rotateYCount) {
    if (!isRotating) {
      console.log("step2Case3: " + rotateYCount);
      let cube7 = getCubeByIndex(7, rotateYCount);
      let cube6 = getCubeByIndex(6, rotateYCount); 
      let cube0 = getCubeByIndex(0, rotateYCount);
      let xLine = rotateAxisAroundWorldY(xLine, rotateYCount);
      if (getCubeFaceColor(cube7, yLineAd) == btmColor && getCubeFaceColor(cube6, yLineAd) == btmColor) {
        if (getCubeFaceColor(cube0, xLine) != btmColor) {
          l(rotateYCount, () => {
            u(rotateYCount, () => {
              L(rotateYCount);
            });
          });
        } else {
          f(rotateYCount, () => {
            u(rotateYCount, () => {
              F(rotateYCount);
            });
          });
        }
      }
    }
  }

  function autoRecover() {
    let topCenterCube = getCubeByIndex(10);
    topColor = getCubeFaceColor(topCenterCube, yLine);
    btmColor = getCubeFaceColor(topCenterCube, yLineAd);
    
    isAutoRecover = true;
    currentStep = 1;
    if (checkStep2()) {
      currentStep = 3;
    } else if (checkStep1()) {
      currentStep = 2;
      step2();
    } else {
      currentStep = 1;
      step1();
    }
  }


  /**
   * =====================================================
   */
  function min(arr){
    var min = arr[0];
    for(var i = 1; i < arr.length; i++){
      if (arr[i] < min) {
        min = arr[i];
      }
    }
    return min;
  }
</script>

<template>
  <div>
    <ForkMeOnGitHub/>
    <div class="fixed-top-left">
      <button @click="randomButtonClick" class="random-button-class">随机打乱</button>
      <button @click="recoverButtonClick" class="recover-button-class">自动复原</button>
    </div>
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

.fixed-top-left {
  position: fixed;
  top: 0;
  left: 0;
  margin: 10px; /* 添加一点边距，以便不会紧贴于屏幕边缘 */
}

button {
  /* 按钮样式（根据需要调整） */
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 2px;
  border-radius: 4px;
  cursor: pointer;
}
</style>