// 交互
function handleCanvasPointerDown(x, y) {
  if (!pointer.isDown) {
    pointer.isDown = true;
    pointer.screen.x = x;
    pointer.screen.y = y;
    // 当菜单打开时，向下/向上切换交互模式。
    // 我们只需要重新运行菜单系统，让它做出响应。
    if (isMenuVisible())
      renderMenus();
  }
}
function handleCanvasPointerUp() {
  if (pointer.isDown) {
    pointer.isDown = false;
    touchPoints.push({
      touchBreak: true,
      life: touchPointLife
    });
    // 当菜单打开时，向下/向上切换交互模式。
    // 我们只需要重新运行菜单系统，让它做出响应。
    if (isMenuVisible())
      renderMenus();
  }
}
function handleCanvasPointerMove(x, y) {
  if (pointer.isDown) {
    pointer.screen.x = x;
    pointer.screen.y = y;
  }
}
// 使用指针事件如果可用，否则回退到触摸事件(iOS)。
if ("PointerEvent" in window) {
  canvas.addEventListener("pointerdown", e => e.isPrimary && handleCanvasPointerDown(e.clientX, e.clientY));
  canvas.addEventListener("pointerup", e => e.isPrimary && handleCanvasPointerUp());
  canvas.addEventListener("pointermove", e => e.isPrimary && handleCanvasPointerMove(e.clientX, e.clientY));
  // 我们还需要知道鼠标是否离开了页面。对于这个游戏，最好是取消一个滑动，所以本质上是一个“mouseup”事件。
  document.body.addEventListener("mouseleave", handleCanvasPointerUp);
}
else {
  let activeTouchId = null;
  canvas.addEventListener("touchstart", event => {
    if (!pointer.isDown) {
      let touch = event.changedTouches[0];
      activeTouchId = touch.identifier;
      handleCanvasPointerDown(touch.clientX, touch.clientY);
    }
  });
  canvas.addEventListener("touchend", event => {
    event.changedTouches.forEach(touch => {
      if (touch.identifier === activeTouchId) {
        handleCanvasPointerUp();
        return;
      }
    });
  });
  canvas.addEventListener("touchmove", event => {
    event.changedTouches.forEach(touch => {
      if (touch.identifier === activeTouchId) {
        handleCanvasPointerMove(touch.clientX, touch.clientY);
        event.preventDefault();
        return;
      }
    });
  }, { passive: false });
}
