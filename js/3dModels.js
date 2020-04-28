// 一旦定义模型。原点是模型的中心。
// 一个简单的立方体，8个顶点，6个四边形。
// 默认边长为2个单位，可以通过“缩放”来改变。
function makeCubeModel({ scale = 1 }) {
  return {
    vertices: [
      // 上
      { x: -scale, y: -scale, z: scale },
      { x: scale, y: -scale, z: scale },
      { x: scale, y: scale, z: scale },
      { x: -scale, y: scale, z: scale },
      // 下
      { x: -scale, y: -scale, z: -scale },
      { x: scale, y: -scale, z: -scale },
      { x: scale, y: scale, z: -scale },
      { x: -scale, y: scale, z: -scale },
    ],
    polys: [
      { vIndexes: [0, 1, 2, 3] }, // z = 1
      { vIndexes: [7, 6, 5, 4] }, // z = -1
      { vIndexes: [3, 2, 6, 7] }, // y = 1
      { vIndexes: [4, 5, 1, 0] }, // y = -1
      { vIndexes: [5, 6, 2, 1] }, // x = 1
      { vIndexes: [0, 3, 7, 4] }, // x = -1
    ]
  };
}
// 不是很优化-大量重复的顶点生成。
function makeRecursiveCubeModel({ recursionLevel, splitFn, color, scale = 1 }) {
  function getScaleAtLevel(level) {
    return 1 / (3 ** level);
  }
  // 我们可以手动建模0级。它只是一个居中的立方体。
  let cubeOrigins = [{ x: 0, y: 0, z: 0 }];
  // 递归地用较小的数据集替换数据集。
  for (let i = 1; i <= recursionLevel; i++) {
    let cubeOrigins2 = [];
    cubeOrigins.forEach(origin => cubeOrigins2.push(...splitFn(origin, getScaleAtLevel(i) * 2)));
    cubeOrigins = cubeOrigins2;
  }
  let finalModel = { vertices: [], polys: [] };
  // 生成单个立方体模型并缩放它。
  let cubeModel = makeCubeModel();
  cubeModel.vertices.forEach(scaleVector(getScaleAtLevel(recursionLevel)));
  // 计算x、y或z的最大距离。
  // 与`Math.max(...cubeOrigins.map(o => o.x))"相同的结果，但快得多。
  let maxComponent = getScaleAtLevel(recursionLevel) * (3 ** recursionLevel - 1);
  // 在每个原点放置立方体几何图形。
  cubeOrigins.forEach((origin, cubeIndex) => {
    // 要计算遮挡(阴影)，找到最大星等的原点分量，并将其相对于“maxComponent”进行归一化。
    let occlusion = Math.max(Math.abs(origin.x), Math.abs(origin.y), Math.abs(origin.z)) / maxComponent;
    // 在较低的迭代中，遮挡看起来更好地减轻了一些。
    let occlusionLighter = recursionLevel > 2 ? occlusion : (occlusion + 0.8) / 1.8;
    // 克隆，翻译顶点到原点，并应用规模
    finalModel.vertices.push(...cubeModel.vertices.map(vertex => ({
      x: (vertex.x + origin.x) * scale,
      y: (vertex.y + origin.y) * scale,
      z: (vertex.z + origin.z) * scale
    })));
    // 克隆多边形，移动参考顶点索引，计算颜色。
    finalModel.polys.push(...cubeModel.polys.map(poly => ({
      vIndexes: poly.vIndexes.map(add(cubeIndex * 8))
    })));
  });
  return finalModel;
}
// o: Vector3D -立方体原点(中心)的位置。
// s: Vector3D -决定门格尔海绵的大小。
function mengerSpongeSplit({ x, y, z }, s) {
  return [
    // 上
    { x: x + s, y: y - s, z: z + s },
    { x: x + s, y: y - s, z: z + 0 },
    { x: x + s, y: y - s, z: z - s },
    { x: x + 0, y: y - s, z: z + s },
    { x: x + 0, y: y - s, z: z - s },
    { x: x - s, y: y - s, z: z + s },
    { x: x - s, y: y - s, z: z + 0 },
    { x: x - s, y: y - s, z: z - s },
    // 下
    { x: x + s, y: y + s, z: z + s },
    { x: x + s, y: y + s, z: z + 0 },
    { x: x + s, y: y + s, z: z - s },
    { x: x + 0, y: y + s, z: z + s },
    { x: x + 0, y: y + s, z: z - s },
    { x: x - s, y: y + s, z: z + s },
    { x: x - s, y: y + s, z: z + 0 },
    { x: x - s, y: y + s, z: z - s },
    // 中央
    { x: x + s, y: y + 0, z: z + s },
    { x: x + s, y: y + 0, z: z - s },
    { x: x - s, y: y + 0, z: z + s },
    { x: x - s, y: y + 0, z: z - s },
  ];
}
// 通过在一个阈值内合并重复的顶点，并删除共享相同顶点的所有多边形，帮助优化模型。
// 直接修改模型。
function optimizeModel(model, threshold = 0.0001) {
  let { vertices, polys } = model;
  function compareVertices(v1, v2) {
    return Math.abs(v1.x - v2.x) < threshold &&
      Math.abs(v1.y - v2.y) < threshold &&
      Math.abs(v1.z - v2.z) < threshold;
  }
  function comparePolys(p1, p2) {
    let v1 = p1.vIndexes;
    let v2 = p2.vIndexes;
    return (v1[0] === v2[0] || v1[0] === v2[1] || v1[0] === v2[2] || v1[0] === v2[3]) &&
      (v1[1] === v2[0] || v1[1] === v2[1] || v1[1] === v2[2] || v1[1] === v2[3]) &&
      (v1[2] === v2[0] || v1[2] === v2[1] || v1[2] === v2[2] || v1[2] === v2[3]) &&
      (v1[3] === v2[0] || v1[3] === v2[1] || v1[3] === v2[2] || v1[3] === v2[3]);
  }
  vertices.forEach((v, i) => v.originalIndexes = [i]);
  for (let i = vertices.length - 1; i >= 0; i--) {
    for (let j = i - 1; j >= 0; j--) {
      let v1 = vertices[i];
      let v2 = vertices[j];
      if (compareVertices(v1, v2)) {
        vertices.splice(i, 1);
        v2.originalIndexes.push(...v1.originalIndexes);
        break;
      }
    }
  }
  vertices.forEach((vertice, i) =>
    polys.forEach(poly =>
      poly.vIndexes.forEach((vi, j, arr) =>
        vertice.originalIndexes.includes(vi) && (arr[j] = i)
      )
    )
  );
  polys.forEach(poly => poly.vIndexes.forEach(vIndex => poly.sum = (poly.sum ? poly.sum : 0) + vIndex));
  polys.sort((a, b) => b.sum - a.sum);
  /**
   * 假设:
   * 1. 每个多边形要么没有副本，要么有一个副本。
   * 2. 如果两个多边形相等，它们都是隐藏的(两个立方体接触)，因此都可以被删除。
   */
  for (let i = polys.length - 1; i >= 0; i--) {
    for (let j = i - 1; j >= 0; j--) {
      let p1 = polys[i];
      let p2 = polys[j];
      if (p1.sum !== p2.sum)
        break;
      if (comparePolys(p1, p2)) {
        polys.splice(i--, 1);
        polys.splice(j, 1);
        break;
      }
    }
  }
  return model;
}
