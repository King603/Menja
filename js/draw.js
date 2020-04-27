function draw(ctx, width, height, viewScale) {
  PERF_START("draw");
  // 3D 多边形
  ctx.lineJoin = "bevel";
  PERF_START("drawShadows");
  ctx.fillStyle = shadowColor;
  ctx.strokeStyle = shadowColor;
  allShadowPolys.forEach(Polys => {
    if (Polys.wireframe) ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < Polys.vertices.length; i++)
      ctx[`${i == 0 ? "move" : "line"}To`](Polys.vertices[i].x, Polys.vertices[i].y);
    ctx.closePath();
    ctx[Polys.wireframe ? "stroke" : "fill"]();
  });
  PERF_END("drawShadows");
  PERF_START("drawPolys");
  allPolys.forEach(Polys => {
    if (!Polys.wireframe && Polys.normalCamera.z < 0)
      return;
    if (Polys.strokeWidth !== 0) {
      ctx.lineWidth = Polys.normalCamera.z < 0 ? Polys.strokeWidth * 0.5 : Polys.strokeWidth;
      ctx.strokeStyle = Polys.normalCamera.z < 0 ? Polys.strokeColorDark : Polys.strokeColor;
    }
    const { vertices } = Polys;
    const lastV = vertices[vertices.length - 1];
    const fadeOut = Polys.middle.z > cameraFadeStartZ;
    if (!Polys.wireframe) {
      const normalLight = (Polys.normalWorld.y - Polys.normalWorld.z) * 0.5;
      ctx.fillStyle = shadeColor(Polys.color, (normalLight > 0 ? 0 : (normalLight ** 32 - normalLight) / 2 * 0.9) + 0.1);
    }
    // 淡出接近镜头的多边形。“globalAlpha”必须稍后重置。
    if (fadeOut)
      // 如果多边形非常接近相机(在“cameraFadeRange”之外)，alpha可以变为负值，其外观为alpha = 1。我们把它夹在0处。
      ctx.globalAlpha = Math.max(0, 1 - (Polys.middle.z - cameraFadeStartZ) / cameraFadeRange);
    ctx.beginPath();
    ctx.moveTo(lastV.x, lastV.y);
    for (let vertex of vertices)
      ctx.lineTo(vertex.x, vertex.y);
    if (!Polys.wireframe)
      ctx.fill();
    if (Polys.strokeWidth !== 0)
      ctx.stroke();
    if (fadeOut)
      ctx.globalAlpha = 1;
  });
  PERF_END("drawPolys");
  PERF_START("draw2D");
  // 2D 火花
  ctx.strokeStyle = sparkColor;
  ctx.lineWidth = sparkThickness;
  ctx.beginPath();
  sparks.forEach(spark => {
    ctx.moveTo(spark.x, spark.y);
    // 当火花熄灭时，将其缩小到零长度。
    // 当寿命接近0(根曲线)时，加速收缩。
    // 注意，随着时间的推移，火花的速度从衰减到减速，火花已经变小了。所以这就像一个双倍缩小。为了弥补这一点，并保持火花更大的时间更长，我们也将增加规模后，应用根曲线。
    const scale = (spark.life / spark.maxLife) ** 0.5 * 1.5;
    ctx.lineTo(spark.x - spark.xD * scale, spark.y - spark.yD * scale);
  });
  ctx.stroke();
  // 触碰
  ctx.strokeStyle = touchTrailColor;
  const touchPointCount = touchPoints.length;
  for (let i = 1; i < touchPointCount; i++) {
    const current = touchPoints[i];
    const prev = touchPoints[i - 1];
    if (current.touchBreak || prev.touchBreak) 
      continue;
    const scale = current.life / touchPointLife;
    ctx.lineWidth = scale * touchTrailThickness;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
  }
  PERF_END("draw2D");
  PERF_END("draw");
  PERF_END("frame");
  // 显示性能更新。
  PERF_UPDATE();
}
