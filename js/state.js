// Enums
// 游戏模式
const GAME_MODE_RANKED = Symbol("GAME_MODE_RANKED");
const GAME_MODE_CASUAL = Symbol("GAME_MODE_CASUAL");
// 可用的菜单
const MENU_MAIN = Symbol("MENU_MAIN");
const MENU_PAUSE = Symbol("MENU_PAUSE");
const MENU_SCORE = Symbol("MENU_SCORE");

// Global State
const state = {
  game: {
    mode: GAME_MODE_RANKED,
    // 当前游戏的运行时间。
    time: 0,
    // 玩家得分。
    score: 0,
    // 游戏中打碎的方块总数。
    cubeCount: 0
  },
  menus: {
    // 设置为“null”以隐藏所有菜单
    active: MENU_MAIN
  }
};

// Global State Selectors
function isInGame() {
  return !state.menus.active;
}
function isMenuVisible() {
  return !!state.menus.active;
}
function isCasualGame() {
  return state.game.mode === GAME_MODE_CASUAL;
}
function isPaused() {
  return state.menus.active === MENU_PAUSE;
}

// Local Storage
const highScoreKey = "__menja__highScore";
function getHighScore() {
  const raw = localStorage.getItem(highScoreKey);
  return raw ? parseInt(raw, 10) : 0;
}
function setHighScore(score) {
  localStorage.setItem(highScoreKey, String(score));
}
