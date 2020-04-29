// Enums
// 游戏模式
const GAME_MODE = {
  RANKED: Symbol("GAME_MODE_RANKED"),
  CASUAL: Symbol("GAME_MODE_CASUAL"),
};
// 可用的菜单
const MENU = {
  MAIN: Symbol("MENU_MAIN"),
  PAUSE: Symbol("MENU_PAUSE"),
  SCORE: Symbol("MENU_SCORE"),
};

// Global State
let state = {
  game: {
    mode: GAME_MODE.RANKED,
    // 当前游戏的运行时间。
    time: 0,
    // 玩家得分。
    score: 0,
    // 游戏中打碎的方块总数。
    cubeCount: 0
  },
  menus: {
    // 设置为“null”以隐藏所有菜单
    active: MENU.MAIN
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
  return state.game.mode === GAME_MODE.CASUAL;
}
function isPaused() {
  return state.menus.active === MENU.PAUSE;
}

// Local Storage
let highScoreKey = "__menja__highScore";
function getHighScore() {
  let raw = localStorage.getItem(highScoreKey);
  return raw ? parseInt(raw, 10) : 0;
}
function setHighScore(score) {
  localStorage.setItem(highScoreKey, String(score));
}
