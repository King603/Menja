function setupCanvases() {
  let ctx = canvas.getContext("2d");
  // 设备像素比例别名
  let dpr = window.devicePixelRatio || 1;
  // 视图将被缩放，以便对象在所有屏幕尺寸上显示大小相同。
  let viewScale;
  // 尺寸(考虑到视图规模!)
  let width, height;
  function handleResize() {
    let { innerWidth: w, innerHeight: h } = window;
    viewScale = h / 1000;
    width = w / viewScale;
    height = h / viewScale;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
  }
  // 设置初始大小
  handleResize();
  // 调整全屏帆布
  window.addEventListener("resize", handleResize);
  // 运行游戏循环
  let lastTimestamp = 0;
  function raf() {
    requestAnimationFrame(timestamp => {
      let frameTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      // 总是对另一帧进行排队
      raf();
      // 如果游戏暂停，我们仍然会跟踪帧时间(以上)，但可以避免所有其他游戏逻辑和绘图。
      if (isPaused())
        return;
      // 确保没有报告负时间(第一帧可能很奇怪)
      if (frameTime < 0)
        frameTime = 17;
      // - 15fps[~68ms]的最小帧率上限(假设60fps[~17ms]为“正常”)
      else
        frameTime = Math.min(frameTime, 68);
      let half = {
        w: width / 2,
        h: height / 2
      };
      // 将指针位置从屏幕转换为场景坐标。
      pointer.scene.x = pointer.screen.x / viewScale - half.w;
      pointer.scene.y = pointer.screen.y / viewScale - half.h;
      let lag = frameTime / 16.6667;
      tick(width, height, gameSpeed * frameTime, gameSpeed * lag, lag);
      // 自动清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 自动缩放绘图为高分辨率显示，并纳入" viewScale "。
      // 还可以移动画布(0,0)到屏幕中间。
      // 这只适用于3D透视投影。
      let drawScale = dpr * viewScale;
      ctx.scale(drawScale, drawScale);
      ctx.translate(half.w, half.h);
      draw(ctx, width, height, viewScale);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
  }
  // 开始循环
  raf();
}
