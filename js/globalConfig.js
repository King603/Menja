// 提供整个程序使用的全局变量。
// 其中大部分应该是配置。

// 整个游戏引擎的定时倍增器。
let gameSpeed = 1;
// Colors
let BLUE = { r: 0x67, g: 0xd7, b: 0xf0 };
let GREEN = { r: 0xa6, g: 0xe0, b: 0x2c };
let PINK = { r: 0xfa, g: 0x24, b: 0x73 };
let ORANGE = { r: 0xfe, g: 0x95, b: 0x22 };
let allColors = [BLUE, GREEN, PINK, ORANGE];
// Gameplay
function getSpawnDelay() {
  return Math.max(1400 - state.game.cubeCount * 3.1, 550);
}
let doubleStrongEnableScore = 2000;
// 在激活一个功能之前必须打碎的立方体的数量。
let threshold = {
  slowmo: 10,
  strong: 25,
  spinner: 25
};
let pointer = {
  // 互动状态
  isDown: false,
  // 主指针在屏幕坐标中的最后一个已知位置。
  screen: { x: 0, y: 0 },
  // 与“pointerScreen”相同，但在rAF中转换为场景坐标。
  scene: { x: 0, y: 0 }
};
// 计算“hits”之前指针的最小速度。
let minPointerSpeed = 60;
// 命中速度影响目标命中后的方向。这个数字削弱了这种力量。
let hitDampening = .1;
// 背板接收阴影，是实体的最负Z位置。
let backboardZ = -400;
let shadowColor = "#262e36";
// 在标准物体上施加多少空气阻力
let airDrag = .022;
let gravity = .3;
// 火花配置
let sparkColor = "rgba(170,221,255,.9)";
let sparkThickness = 2.2;
let airDragSpark = .1;
// 跟踪指针的位置来显示轨迹
let touchTrailColor = "rgba(170,221,255,.62)";
let touchTrailThickness = 7;
let touchPointLife = 120;
let touchPoints = [];
// 游戏内目标的大小。这将影响渲染的大小和命中率。
let targetRadius = 40;
let targetHitRadius = 50;
function makeTargetGlueColor(target) {
  return `rgba(170,221,255,${((target.health - 1) / (target.maxHealth - 1)).toFixed(3)})`;
  // return "rgb(170,221,255)";
};
// 目标碎片大小
let fragRadius = targetRadius / 3;
// 游戏画布元素需要在setup.js和interaction.js
let canvas = document.querySelector("#c");
// 3D 相机配置
// 影响的角度
let cameraDistance = 900;
// 不影响视角
let sceneScale = 1;
// 太靠近相机的物体将会在这个范围内淡出为透明。
let cameraFadeStartZ = .45 * cameraDistance;
let cameraFadeEndZ = .65 * cameraDistance;
let cameraFadeRange = cameraFadeEndZ - cameraFadeStartZ;
// 用于在每个帧中聚集所有顶点/多边形的全局值
let all = {
  vertices: [],
  polys: [],
  shadow: {
    vertices: [],
    polys: []
  }
};
