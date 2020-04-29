// 顶级菜单容器
function renderMenus() {
  function showMenu(node) {
    node.classList.add("active");
  }
  function hideMenu(node) {
    node.classList.remove("active");
  }
  let menuMainNode = $(".menu--main");
  let menuPauseNode = $(".menu--pause");
  let menuScoreNode = $(".menu--score");
  hideMenu(menuMainNode);
  hideMenu(menuPauseNode);
  hideMenu(menuScoreNode);
  switch (state.menus.active) {
    case MENU.MAIN:
      showMenu(menuMainNode);
      break;
    case MENU.PAUSE:
      showMenu(menuPauseNode);
      break;
    case MENU.SCORE:
      $(".final-score-lbl").textContent = formatNumber(state.game.score);
      $(".high-score-lbl").textContent = state.game.score > getHighScore()
        ? "New High Score!"
        : `High Score: ${formatNumber(getHighScore())}`;
      showMenu(menuScoreNode);
      break;
  }
  setHudVisibility(!isMenuVisible());
  let menuContainerNode = $(".menus");
  menuContainerNode.classList.toggle("has-active", isMenuVisible());
  menuContainerNode.classList.toggle("interactive-mode", isMenuVisible() && pointer.isDown);
}
renderMenus();

// Button Actions
// 主菜单
handleClick($(".play-normal-btn"), () => click(GAME_MODE.RANKED));
handleClick($(".play-casual-btn"), () => click(GAME_MODE.CASUAL));
// 暂停菜单
handleClick($(".resume-btn"), () => resumeGame());
handleClick($(".menu-btn--pause"), () => setActiveMenu(MENU.MAIN));
// 分数菜单
handleClick($(".play-again-btn"), () => click());
handleClick($(".menu-btn--score"), () => setActiveMenu(MENU.MAIN));
function click(GAME_MODE) {
  GAME_MODE && setGameMode(GAME_MODE);
  setActiveMenu(null);
  resetGame();
}
