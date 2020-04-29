// 跟踪所有活动片段
let frags = [];
// 使用地图，按颜色将不活动的片段池起来。
// keys是color对象，值是片段数组。
// 另外，还单独地池线框实例。
let fragPool = new Map(allColors.map(c => [c, []]));
let fragWireframePool = new Map(allColors.map(c => [c, []]));
let createBurst = (() => {
  // 预先计算一些私有数据以供所有突发事件重用。
  let basePositions = mengerSpongeSplit({ x: 0, y: 0, z: 0 }, fragRadius * 2);
  let positions = cloneVertices(basePositions);
  let prevPositions = cloneVertices(basePositions);
  let velocities = cloneVertices(basePositions);
  let basePositionNormals = basePositions.map(normalize);
  let positionNormals = cloneVertices(basePositionNormals);
  let fragCount = basePositions.length;
  function getFragForTarget({ wireframe, color }) {
    let pool = wireframe ? fragWireframePool : fragPool;
    let frag = pool.get(color).pop();
    if (!frag) {
      frag = new Entity({
        model: makeCubeModel({ scale: fragRadius }),
        color,
        wireframe
      });
      frag.color = color;
      frag.wireframe = wireframe;
    }
    return frag;
  }
  return (target, force = 1) => {
    let { x, y, z, xD, yD, zD, rotateX, rotateY, rotateZ, rotateXD, rotateYD, rotateZD } = target;
    // 计算碎片位置，以及当仍然是较大目标的一部分时，先前的位置是什么。
    transformVertices(basePositions, positions, { x, y, z }, { x: rotateX, y: rotateY, z: rotateZ }, { x: 1, y: 1, z: 1 });
    transformVertices(basePositions, prevPositions, { x: x - xD, y: y - yD, z: z - zD }, { x: rotateX - rotateXD, y: rotateY - rotateYD, z: rotateZ - rotateZD }, { x: 1, y: 1, z: 1 });
    // 根据之前的位置计算每个碎片的速度。
    // 将写入"velocities"数组。
    for (let i = 0; i < fragCount; i++) {
      let position = positions[i];
      let prevPosition = prevPositions[i];
      let velocity = velocities[i];
      velocity.x = position.x - prevPosition.x;
      velocity.y = position.y - prevPosition.y;
      velocity.z = position.z - prevPosition.z;
    }
    // 对法线应用目标旋转
    transformVertices(basePositionNormals, positionNormals, { x: 0, y: 0, z: 0 }, { x: rotateX, y: rotateY, z: rotateZ }, { x: 1, y: 1, z: 1 });
    for (let i = 0; i < fragCount; i++) {
      let position = positions[i];
      let velocity = velocities[i];
      let normal = positionNormals[i];
      let frag = getFragForTarget(target);
      frag.x = position.x;
      frag.y = position.y;
      frag.z = position.z;
      frag.rotateX = rotateX;
      frag.rotateY = rotateY;
      frag.rotateZ = rotateZ;
      let burstSpeed = 2 * force;
      let randSpeed = 2 * force;
      let rotateScale = .015;
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
function returnFrag(frag) {
  frag.reset();
  (frag.wireframe ? fragWireframePool : fragPool).get(frag.color).push(frag);
};
