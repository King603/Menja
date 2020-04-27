// 跟踪所有活动片段
const frags = [];
// 使用地图，按颜色将不活动的片段池起来。
// keys是color对象，值是片段数组。
// 另外，还单独地池线框实例。
const fragPool = new Map(allColors.map(c =>[c, []]));
const fragWireframePool = new Map(allColors.map(c => [c, []]));
const createBurst = (() => {
  // 预先计算一些私有数据以供所有突发事件重用。
  const basePositions = mengerSpongeSplit({ x: 0, y: 0, z: 0 }, fragRadius * 2);
  const positions = cloneVertices(basePositions);
  const prevPositions = cloneVertices(basePositions);
  const velocities = cloneVertices(basePositions);
  const basePositionNormals = basePositions.map(normalize);
  const positionNormals = cloneVertices(basePositionNormals);
  const fragCount = basePositions.length;
  function getFragForTarget(target) {
    const pool = target.wireframe ? fragWireframePool : fragPool;
    let frag = pool.get(target.color).pop();
    if (!frag) {
      frag = new Entity({
        model: makeCubeModel({ scale: fragRadius }),
        color: target.color,
        wireframe: target.wireframe
      });
      frag.color = target.color;
      frag.wireframe = target.wireframe;
    }
    return frag;
  }
  return (target, force = 1) => {
    // 计算碎片位置，以及当仍然是较大目标的一部分时，先前的位置是什么。
    transformVertices(basePositions, positions, target.x, target.y, target.z, target.rotateX, target.rotateY, target.rotateZ, 1, 1, 1);
    transformVertices(basePositions, prevPositions, target.x - target.xD, target.y - target.yD, target.z - target.zD, target.rotateX - target.rotateXD, target.rotateY - target.rotateYD, target.rotateZ - target.rotateZD, 1, 1, 1);
    // 根据之前的位置计算每个碎片的速度。
    // 将写入"velocities"数组。
    for (let i = 0; i < fragCount; i++) {
      const position = positions[i];
      const prevPosition = prevPositions[i];
      const velocity = velocities[i];
      velocity.x = position.x - prevPosition.x;
      velocity.y = position.y - prevPosition.y;
      velocity.z = position.z - prevPosition.z;
    }
    // 对法线应用目标旋转
    transformVertices(basePositionNormals, positionNormals, 0, 0, 0, target.rotateX, target.rotateY, target.rotateZ, 1, 1, 1);
    for (let i = 0; i < fragCount; i++) {
      const position = positions[i];
      const velocity = velocities[i];
      const normal = positionNormals[i];
      const frag = getFragForTarget(target);
      frag.x = position.x;
      frag.y = position.y;
      frag.z = position.z;
      frag.rotateX = target.rotateX;
      frag.rotateY = target.rotateY;
      frag.rotateZ = target.rotateZ;
      const burstSpeed = 2 * force;
      const randSpeed = 2 * force;
      const rotateScale = .015;
      frag.xD = velocity.x + normal.x * burstSpeed + Math.random() * randSpeed;
      frag.yD = velocity.y + normal.y * burstSpeed + Math.random() * randSpeed;
      frag.zD = velocity.z + normal.z * burstSpeed + Math.random() * randSpeed;
      frag.rotateXD = frag.xD * rotateScale;
      frag.rotateYD = frag.yD * rotateScale;
      frag.rotateZD = frag.zD * rotateScale;
      frags.push(frag);
    }
  };
})();
const returnFrag = frag => {
  frag.reset();
  const pool = frag.wireframe ? fragWireframePool : fragPool;
  pool.get(frag.color).push(frag);
};
// sparks.js
const sparks = [];
const sparkPool = [];
function addSpark(x, y, xD, yD) {
  const spark = sparkPool.pop() || {};
  spark.x = x + xD * .5;
  spark.y = y + yD * .5;
  spark.xD = xD;
  spark.yD = yD;
  spark.life = random(200, 300);
  spark.maxLife = spark.life;
  sparks.push(spark);
  return spark;
}
// 球形火花破裂
function sparkBurst(x, y, count, maxSpeed) {
  const angleInc = TAU / count;
  for (let i = 0; i < count; i++) {
    const angle = i * angleInc + angleInc * Math.random();
    const speed = (1 - Math.random() ** 3) * maxSpeed;
    addSpark(x, y, Math.sin(angle) * speed, Math.cos(angle) * speed);
  }
}
// 使一个目标“泄漏”火花从所有顶点。
// 这是用来创造目标胶“脱落”的效果。
let glueShedVertices;
function glueShedSparks(target) {
  if (!glueShedVertices) {
    glueShedVertices = cloneVertices(target.vertices);
  }
  else {
    copyVerticesTo(target.vertices, glueShedVertices);
  }
  glueShedVertices.forEach(v => {
    if (Math.random() < .4) {
      projectVertex(v);
      addSpark(v.x, v.y, random(-12, 12), random(-12, 12));
    }
  });
}
function returnSpark(spark) {
  sparkPool.push(spark);
}
