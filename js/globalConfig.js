// 提供整个程序使用的全局变量。
// 其中大部分应该是配置。

// 整个游戏引擎的定时倍增器。
let gameSpeed = 1;
// Colors
const BLUE = { r: 0x67, g: 0xd7, b: 0xf0 };
const GREEN = { r: 0xa6, g: 0xe0, b: 0x2c };
const PINK = { r: 0xfa, g: 0x24, b: 0x73 };
const ORANGE = { r: 0xfe, g: 0x95, b: 0x22 };
const allColors = [BLUE, GREEN, PINK, ORANGE];
// Gameplay
function getSpawnDelay() {
  return Math.max(1400 - state.game.cubeCount * 3.1, 550);
}
const doubleStrongEnableScore = 2000;
// 在激活一个功能之前必须打碎的立方体的数量。
const slowmoThreshold = 10;
const strongThreshold = 25;
const spinnerThreshold = 25;
// 互动状态
let pointerIsDown = false;
// 主指针在屏幕坐标中的最后一个已知位置。
let pointerScreen = { x: 0, y: 0 };
// 与“pointerScreen”相同，但在rAF中转换为场景坐标。
let pointerScene = { x: 0, y: 0 };
// 计算“hits”之前指针的最小速度。
const minPointerSpeed = 60;
// 命中速度影响目标命中后的方向。这个数字削弱了这种力量。
const hitDampening = .1;
// 背板接收阴影，是实体的最负Z位置。
const backboardZ = -400;
const shadowColor = "#262e36";
// 在标准物体上施加多少空气阻力
const airDrag = .022;
const gravity = .3;
// 火花配置
const sparkColor = "rgba(170,221,255,.9)";
const sparkThickness = 2.2;
const airDragSpark = .1;
// 跟踪指针的位置来显示轨迹
const touchTrailColor = "rgba(170,221,255,.62)";
const touchTrailThickness = 7;
const touchPointLife = 120;
const touchPoints = [];
// 游戏内目标的大小。这将影响渲染的大小和命中率。
const targetRadius = 40;
const targetHitRadius = 50;
const makeTargetGlueColor = target => {
  // const alpha = (target.health - 1) / (target.maxHealth - 1);
  // return `rgba(170,221,255,${alpha.toFixed(3)})`;
  return "rgb(170,221,255)";
};
// 目标碎片大小
const fragRadius = targetRadius / 3;
// 游戏画布元素需要在setup.js和interaction.js
const canvas = document.querySelector("#c");
// 3D 相机配置
// 影响的角度
const cameraDistance = 900;
// 不影响视角
const sceneScale = 1;
// 太靠近相机的物体将会在这个范围内淡出为透明。
// const cameraFadeStartZ = .8*cameraDistance - 6*targetRadius;
const cameraFadeStartZ = .45 * cameraDistance;
const cameraFadeEndZ = .65 * cameraDistance;
const cameraFadeRange = cameraFadeEndZ - cameraFadeStartZ;
// 用于在每个帧中聚集所有顶点/多边形的全局值
const allVertices = [];
const allPolys = [];
const allShadowVertices = [];
const allShadowPolys = [];
