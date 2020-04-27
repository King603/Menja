// 顶级菜单容器
const menuContainerNode = $(".menus");
const menuMainNode = $(".menu--main");
const menuPauseNode = $(".menu--pause");
const menuScoreNode = $(".menu--score");
const finalScoreLblNode = $(".final-score-lbl");
const highScoreLblNode = $(".high-score-lbl");
function renderMenus() {
  function showMenu(node) {
    node.classList.add("active");
  }
  function hideMenu(node) {
    node.classList.remove("active");
  }
  hideMenu(menuMainNode);
  hideMenu(menuPauseNode);
  hideMenu(menuScoreNode);
  switch (state.menus.active) {
    case MENU_MAIN:
      showMenu(menuMainNode);
      break;
    case MENU_PAUSE:
      showMenu(menuPauseNode);
      break;
    case MENU_SCORE:
      finalScoreLblNode.textContent = formatNumber(state.game.score);
      highScoreLblNode.textContent = state.game.score > getHighScore()
        ? "New High Score!"
        : `High Score: ${formatNumber(getHighScore())}`;
      showMenu(menuScoreNode);
      break;
  }
  setHudVisibility(!isMenuVisible());
  menuContainerNode.classList.toggle("has-active", isMenuVisible());
  menuContainerNode.classList.toggle("interactive-mode", isMenuVisible() && pointerIsDown);
}
renderMenus();

// Button Actions
// 主菜单
handleClick($(".play-normal-btn"), () => click(GAME_MODE_RANKED));
handleClick($(".play-casual-btn"), () => click(GAME_MODE_CASUAL));
// 暂停菜单
handleClick($(".resume-btn"), () => resumeGame());
handleClick($(".menu-btn--pause"), () => setActiveMenu(MENU_MAIN));
// 分数菜单
handleClick($(".play-again-btn"), () => click());
handleClick($(".menu-btn--score"), () => setActiveMenu(MENU_MAIN));
function click(GAME_MODE) {
  GAME_MODE && setGameMode(GAME_MODE);
  setActiveMenu(null);
  resetGame();
}
