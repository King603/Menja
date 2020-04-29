function invariant(condition, message) {
  if (!condition)
    throw new Error(message);
}

// DOM
function $(selector) {
  return document.querySelector(selector);
}
function handleClick(element, handler) {
  element.addEventListener("click", handler);
}
function handlePointerDown(element, handler) {
  element.addEventListener("touchstart", handler);
  element.addEventListener("mousedown", handler);
}

// Formatting Helpers
// 将数字转换为带千个分隔符的格式化字符串。
function formatNumber(num) {
  return num.toLocaleString();
}

// Math Constants
const PI = Math.PI;
const TAU = Math.PI * 2;
const ETA = Math.PI * .5;

// Math Helpers
// 夹取最小值和最大值之间的一个数字(包括)
function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}
// 在数字a和b之间以特定的数量进行线性内插。
// mix >= 0 && mix <= 1
function lerp(a, b, mix) {
  return (b - a) * mix + a;
}

// Random Helpers
// 在min(包含)和max(不包含)之间生成一个随机数
function random(min, max) {
  return Math.random() * (max - min) + min;
}
// 生成一个介于最小值和最大值之间的随机整数
function randomInt(min, max) {
  return ((Math.random() * (max - min + 1)) | 0) + min;
}
// 从数组中返回一个随机元素
function pickOne(arr) {
  return arr[Math.random() * arr.length | 0];
}

// Color Helpers
// 将{r, g, b}颜色对象转换为六位十六进制代码。
function colorToHex(color) {
  return "#" +
    setColor(color.r | 0) +
    setColor(color.g | 0) +
    setColor(color.b | 0);
}
// 操作一个{r, g, b}颜色对象。
// 返回字符串十六进制代码。
// “亮度”必须在0到1之间。0是纯黑，1是纯白。
function shadeColor(color, lightness) {
  let other = lightness < .5 ? 0 : 255;
  let mix = Math.abs(lightness * 2 - 1);
  return "#" +
    setColor(lerp(color.r, other, mix) | 0) +
    setColor(lerp(color.g, other, mix) | 0) +
    setColor(lerp(color.b, other, mix) | 0);
}
// 设置颜色
function setColor(color) {
  return color.toString(16).padStart(2, "0");
}
// Timing Helpers
let _allCooldowns = [];
function makeCooldown(rechargeTime, units = 1) {
  let timeRemaining = 0;
  let lastTime = 0;
  let initialOptions = { rechargeTime, units };
  function updateTime() {
    let now = state.game.time;
    // 如果时间倒退，重置剩余时间。
    if (now < lastTime)
      timeRemaining = 0;
    else {
      // 更新……
      timeRemaining -= now - lastTime;
      timeRemaining = Math.max(timeRemaining, 0);
    }
    lastTime = now;
  }
  let cooldown = {
    canUse() {
      updateTime();
      return timeRemaining <= rechargeTime * (units - 1);
    },
    useIfAble() {
      let usable = this.canUse();
      if (usable)
        timeRemaining += rechargeTime;
      return usable;
    },
    mutate(options) {
      if (options.rechargeTime) {
        // 应用补给时间增量，使变化立即生效。
        timeRemaining -= rechargeTime - options.rechargeTime;
        if (timeRemaining < 0)
          timeRemaining = 0;
        rechargeTime = options.rechargeTime;
      }
      if (options.units)
        units = options.units;
    },
    reset() {
      timeRemaining = 0;
      lastTime = 0;
      this.mutate(initialOptions);
    }
  };
  _allCooldowns.push(cooldown);
  return cooldown;
}
function resetAllCooldowns() {
  _allCooldowns.forEach(cooldown => cooldown.reset());
}
function makeSpawner({ chance, cooldownPerSpawn, maxSpawns }) {
  let cooldown = makeCooldown(cooldownPerSpawn, maxSpawns);
  return {
    shouldSpawn() {
      return Math.random() <= chance && cooldown.useIfAble();
    },
    mutate(options) {
      if (options.chance)
        chance = options.chance;
      cooldown.mutate({
        rechargeTime: options.cooldownPerSpawn,
        units: options.maxSpawns
      });
    }
  };
}

// Vector Helpers
function normalize({ x, y, z }) {
  let mag = Math.hypot(x, y, z);
  return {
    x: x / mag,
    y: y / mag,
    z: z / mag
  };
}
// 里德数学助手
function add(a) {
  return (b) => a + b;
}
// 里德矢量助手
function scaleVector(scale) {
  return vector => {
    vector.x *= scale;
    vector.y *= scale;
    vector.z *= scale;
  };
}

// 3D Helpers
// 克隆数组和所有顶点。
function cloneVertices(vertices) {
  return vertices.map(({ x, y, z }) => ({ x, y, z }));
}
// 将顶点数据从一个数组复制到另一个数组。
// 数组的长度必须相同。
function copyVerticesTo(arr1, arr2) {
  for (let i = 0; i < arr1.length; i++) {
    let v1 = arr1[i];
    let v2 = arr2[i];
    v2.x = v1.x;
    v2.y = v1.y;
    v2.z = v1.z;
  }
}
// 计算三角形中点。
// 改变给定多边形的“中间”属性。
function computeTriMiddle(poly) {
  computeMiddle(poly, 3);
}
// 计算四中点。
// 改变给定多边形的“中间”属性。
function computeQuadMiddle(poly) {
  computeMiddle(poly, 4);
}
function computeMiddle({ vertices: v, middle: m }, n) {
  for (let i = 0; i < n; i++) {
    m.x = (i == 0 ? 0 : m.x) + v[i].x / n;
    m.y = (i == 0 ? 0 : m.y) + v[i].y / n;
    m.z = (i == 0 ? 0 : m.z) + v[i].z / n;
  }
}
function computePolyMiddle(poly) {
  poly.vertices.length === 3 ?
    computeTriMiddle(poly) : computeQuadMiddle(poly);
}
// 计算任意多边形中点到摄像机的距离。
// 设置给定多边形的深度属性。
// 还会触发中点计算，这会改变" middle "属性的" poly "。
function computePolyDepth(poly) {
  computePolyMiddle(poly);
  let { x, y, z } = poly.middle;
  poly.depth = Math.hypot(x, y, z - cameraDistance);
}
// 计算任意多边形的法线。使用标准化向量叉乘。
// 改变给定" poly "的" normalName "属性。
function computePolyNormal(poly, normalName) {
  // 存储快速参考顶点
  let [v1, v2, v3] = poly.vertices;
  // 按缠绕顺序计算顶点的差值。
  let a = { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
  let b = { x: v1.x - v3.x, y: v1.y - v3.y, z: v1.z - v3.z };
  // 叉积
  let { x, y, z } = { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
  // 计算法向和正规的模量
  let mag = Math.hypot(x, y, z);
  let polyNormal = poly[normalName];
  polyNormal.x = x / mag;
  polyNormal.y = y / mag;
  polyNormal.z = z / mag;
}
// 对所有给定的顶点应用平移/旋转/缩放。
// 如果" vertices "和" target "是相同的数组，则顶点将在相应位置发生突变。
// 如果" vertices "和" target "是不同的数组，" vertices "将不被触及，而是将" vertices "转换后的值写入" target "数组。
function transformVertices(vertices, target, t, r, s) {
  // 矩阵乘法常数只需要对所有顶点计算一次。
  let sin = { x: Math.sin(r.x), y: Math.sin(r.y), z: Math.sin(r.z) };
  let cos = { x: Math.cos(r.x), y: Math.cos(r.y), z: Math.cos(r.z) };
  // 使用类似map()的forEach()，但使用(回收的)目标数组。
  vertices.forEach((vertex, index) => {
    let targetVertex = target[index];
    let X_axis = { x: vertex.x, y: vertex.z * sin.x + vertex.y * cos.x, z: vertex.z * cos.x - vertex.y * sin.x };// X轴旋转
    let Y_axis = { x: X_axis.x * cos.y - X_axis.z * sin.y, y: X_axis.y, z: X_axis.x * sin.y + X_axis.z * cos.y };// Y轴旋转
    let Z_axis = { x: Y_axis.x * cos.z - Y_axis.y * sin.z, y: Y_axis.x * sin.z + Y_axis.y * cos.z, z: Y_axis.z };// Z轴旋转
    // 缩放、平移和设置转换。
    targetVertex.x = Z_axis.x * s.x + t.x;
    targetVertex.y = Z_axis.y * s.y + t.y;
    targetVertex.z = Z_axis.z * s.z + t.z;
  });
}
// 单个顶点上的三维投影。
// 直接改变顶点。
function projectVertex(vertex) {
  let depth = getDepth(vertex);
  vertex.x *= depth;
  vertex.y *= depth;
}
// 单个顶点上的三维投影。
// 使次要目标顶点发生突变。
function projectVertexTo(vertex, target) {
  let depth = getDepth(vertex);
  target.x = vertex.x * depth;
  target.y = vertex.y * depth;
}
// 获取深度。
function getDepth({ z }) {
  return cameraDistance * sceneScale / (cameraDistance - z);
}
