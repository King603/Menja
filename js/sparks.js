let sparks = [];
let sparkPool = [];
function addSpark(x, y, xD, yD) {
  let spark = sparkPool.pop() || {};
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
  let angleInc = TAU / count;
  for (let i = 0; i < count; i++) {
    let angle = i * angleInc + angleInc * Math.random();
    let speed = (1 - Math.random() ** 3) * maxSpeed;
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
  glueShedVertices.forEach(vertice => {
    if (Math.random() < .4) {
      projectVertex(vertice);
      addSpark(vertice.x, vertice.y, random(-12, 12), random(-12, 12));
    }
  });
}
function returnSpark(spark) {
  sparkPool.push(spark);
}
