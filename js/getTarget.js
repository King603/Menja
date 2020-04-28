// 所有活动目标
let targets = [];
/**
 * 使用映射按颜色池目标实例。
 * 键是颜色对象，值是目标数组。
 * 另外，还单独地池线框实例。
 */
let targetPool = new Map(allColors.map(c => [c, []]));
let targetWireframePool = new Map(allColors.map(c => [c, []]));
let getTarget = (() => {
  let slowmoSpawner = makeSpawner({
    chance: 0.5,
    cooldownPerSpawn: 10000,
    maxSpawns: 1
  });
  let doubleStrong = false;
  let strongSpawner = makeSpawner({
    chance: 0.3,
    cooldownPerSpawn: 12000,
    maxSpawns: 1
  });
  let spinnerSpawner = makeSpawner({
    chance: 0.1,
    cooldownPerSpawn: 10000,
    maxSpawns: 1
  });
  // 缓存的数组实例，不需要每次分配。
  let axisOptions = [["x", "y"], ["y", "z"], ["z", "x"]];
  function getTargetOfStyle(color, wireframe) {
    let target = (wireframe ? targetWireframePool : targetPool).get(color).pop();
    if (!target) {
      target = new Entity({
        model: optimizeModel(makeRecursiveCubeModel({
          recursionLevel: 1,
          splitFn: mengerSpongeSplit,
          scale: targetRadius
        })),
        color,
        wireframe
      });
      // 初始化将使用的任何属性。
      // 这些不会自动重置时回收。
      target.color = color;
      target.wireframe = wireframe;
      // 有些属性还没有最终值。
      // 使用正确类型的任何值初始化。
      target.hit = false;
      target.maxHealth = 0;
      target.health = 0;
    }
    return target;
  }
  return () => {
    if (doubleStrong && state.game.score <= doubleStrongEnableScore) {
      doubleStrong = false;
      // 当游戏重置时，Spawner会自动重置。
    }
    else if (!doubleStrong && state.game.score > doubleStrongEnableScore) {
      doubleStrong = true;
      strongSpawner.mutate({ maxSpawns: 2 });
    }
    // 目标参数
    let color = pickOne([BLUE, GREEN, ORANGE]);
    let wireframe = false;
    let health = 1;
    let maxHealth = 3;
    let spinner = state.game.cubeCount >= spinnerThreshold && isInGame() && spinnerSpawner.shouldSpawn();
    // 目标参数覆盖
    if (state.game.cubeCount >= slowmoThreshold && slowmoSpawner.shouldSpawn()) {
      color = BLUE;
      wireframe = true;
    } else if (state.game.cubeCount >= strongThreshold && strongSpawner.shouldSpawn()) {
      color = PINK;
      health = 3;
    }
    // 目标创建
    let target = getTargetOfStyle(color, wireframe);
    target.hit = false;
    target.maxHealth = maxHealth;
    target.health = health;
    updateTargetHealth(target, 0);
    let spinSpeeds = [
      Math.random() * .1 - .05,
      Math.random() * .1 - .05
    ];
    if (spinner) {
      // 最终会绕着一个随机的轴旋转
      spinSpeeds[0] = -.25;
      spinSpeeds[1] = 0;
      target.rotateZ = random(0, TAU);
    }
    spinSpeeds.forEach((spinSpeed, i) => {
      switch (pickOne(axisOptions)[i]) {
        case "x": target.rotateXD = spinSpeed; break;
        case "y": target.rotateYD = spinSpeed; break;
        case "z": target.rotateZD = spinSpeed; break;
      }
    });
    return target;
  };
})();
function updateTargetHealth(target, healthDelta) {
  target.health += healthDelta;
  // 只更新非线框目标的行程。
  // 显示“glue”是显示健康状态的临时尝试。到目前为止，我们没有理由把线框定为高生命值的目标，所以我们做得很好。
  target.wireframe || target.polys.forEach(poly => {
    poly.strokeWidth = target.health - 1;
    poly.strokeColor = makeTargetGlueColor(target);
  });
};
function returnTarget(target) {
  target.reset();
  (target.wireframe ? targetWireframePool : targetPool).get(target.color).push(target);
};
function resetAllTargets() {
  targets.forEach(() => returnTarget(targets.pop()));
}
