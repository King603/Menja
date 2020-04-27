function setHudVisibility(visible) {
  $(".hud").style.display = visible ? "block" : "none";
}

// Score
const scoreNode = $(".score-lbl");
const cubeCountNode = $(".cube-count-lbl");
function renderScoreHud() {
  !isCasualGame() && (scoreNode.innerText = `SCORE: ${state.game.score}`);
  scoreNode.style.display = isCasualGame() ? "none" : "block";
  cubeCountNode.style.opacity = isCasualGame() ? 1 : 0.65;
  cubeCountNode.innerText = `CUBES SMASHED: ${state.game.cubeCount}`;
}
renderScoreHud();

// Pause Button
handlePointerDown($(".pause-btn"), () => pauseGame());

// Slow-Mo Status
function renderSlowmoStatus(percentRemaining) {
  $(".slowmo").style.opacity = percentRemaining === 0 ? 0 : 1;
  $(".slowmo__bar").style.transform = `scaleX(${percentRemaining.toFixed(3)})`;
}
