// MENU ACTIONS
function setActiveMenu(menu) {
  state.menus.active = menu;
  renderMenus();
}

// HUD ACTIONS
function setScore(score) {
  state.game.score = score;
  renderScoreHud();
}
function incrementScore(inc) {
  if (isInGame()) {
    state.game.score = Math.max(state.game.score += inc, 0);
    renderScoreHud();
  }
}
function setCubeCount(count) {
  state.game.cubeCount = count;
  renderScoreHud();
}
function incrementCubeCount(inc) {
  if (isInGame()) {
    state.game.cubeCount += inc;
    renderScoreHud();
  }
}

// GAME ACTIONS
function setGameMode(mode) {
  state.game.mode = mode;
}
function resetGame() {
  resetAllTargets();
  state.game.time = 0;
  resetAllCooldowns();
  setScore(0);
  setCubeCount(0);
  spawnTime = getSpawnDelay();
}
function pauseGame() {
  isInGame() && setActiveMenu(MENU.PAUSE);
}
function resumeGame() {
  isPaused() && setActiveMenu(null);
}
function endGame() {
  setActiveMenu(MENU.SCORE);
  handleCanvasPointerUp();
  // 如果需要更新高分，在渲染分数菜单后。
  state.game.score > getHighScore() &&
    setHighScore(state.game.score);
}

// KEYBOARD SHORTCUTS
window.addEventListener("keydown", ({ key }) => key === "p" && (isPaused() ? resumeGame() : pauseGame()));
