// --- Start/Intro/Game Page Switching ---
window.addEventListener("DOMContentLoaded", function() {
  const startPage = document.getElementById('startPage');
  const introPage = document.getElementById('introPage');
  const gameContainer = document.getElementById('gameContainer');
  const startBtn = document.getElementById('startBtn');
  const continueBtn = document.getElementById('continueBtn');

  // Only show start page on load
  startPage.style.display = 'flex';
  introPage.style.display = 'none';
  gameContainer.style.display = 'none';

  startBtn.onclick = function() {
    startPage.style.display = 'none';
    introPage.style.display = 'flex';
  };
  continueBtn.onclick = function() {
    introPage.style.display = 'none';
    gameContainer.style.display = 'flex';
    // Only now controls & canvas are visible, so initialize inventory UI
    setupCoinInventoryDisplay();
    updateCoinInventoryDisplay(player.coinCount);
    if (typeof fitGameCanvas === 'function') fitGameCanvas();
  };
});

// ==== DEVICE-OPTIMIZED CANVAS SIZING, MOBILE/TABLET PORTRAIT FOCUS ====
function getDeviceType() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 600) return "mobile";
  if (w > 600 && w <= 1000) return "tablet";
  return "desktop";
}
const GAME_ASPECT = 960 / 540;

function fitGameCanvas() {
  const controls = document.getElementById("controls");
  const canvas = document.getElementById("gameCanvas");
  const device = getDeviceType();
  const portrait = window.innerHeight > window.innerWidth;

  if (!portrait) {
    canvas.style.display = "none";
    controls.style.display = "none";
    document.body.style.background = "#222";
    return;
  } else {
    canvas.style.display = "block";
    controls.style.display = "flex";
    document.body.style.background = "#87CEFA";
  }

  const controlsHeight = controls.offsetHeight || (device === "mobile" ? window.innerHeight * 0.20 : window.innerHeight * 0.17);
  const availH = window.innerHeight - controlsHeight - 16;
  const availW = window.innerWidth;
  let targetW = availW;
  let targetH = availH;

  if (targetW / targetH > GAME_ASPECT) {
    targetW = Math.round(targetH * GAME_ASPECT);
  } else {
    targetH = Math.round(targetW / GAME_ASPECT);
  }

  canvas.style.width = targetW + "px";
  canvas.style.height = targetH + "px";
  canvas.width = 960;
  canvas.height = 540;

  if (device === "mobile") {
    canvas.style.marginTop = "3vh";
    canvas.style.marginBottom = "1vh";
  } else if (device === "tablet") {
    canvas.style.marginTop = "5vh";
    canvas.style.marginBottom = "2vh";
  } else {
    canvas.style.marginTop = "4vh";
    canvas.style.marginBottom = "0";
  }
}

window.addEventListener("resize", fitGameCanvas);
window.addEventListener("orientationchange", fitGameCanvas);
window.addEventListener("load", fitGameCanvas);

// ==== COIN INVENTORY UI ====
// Adds a coin inventory above the controls, updates when coin count changes.
function setupCoinInventoryDisplay() {
  // Only run once
  if (document.getElementById("coinInventoryDisplay")) return;
  const controls = document.getElementById("controls");
  if (!controls) return; // Don't run if controls not present
  const inventoryDiv = document.createElement("div");
  inventoryDiv.id = "coinInventoryDisplay";
  inventoryDiv.style.fontSize = "22px";
  inventoryDiv.style.fontWeight = "bold";
  inventoryDiv.style.fontFamily = "monospace";
  inventoryDiv.style.color = "#ffb800";
  inventoryDiv.style.textShadow = "1px 1px 3px #222";
  inventoryDiv.style.display = "flex";
  inventoryDiv.style.alignItems = "center";
  inventoryDiv.style.justifyContent = "center";
  inventoryDiv.style.marginBottom = "8px";
  inventoryDiv.innerHTML = `<img src="assets/file_00000000978c61f7a3829e2af5cfbdd2 (1).png" alt="coin" style="height:1.2em;vertical-align:middle;margin-right:0.5em;"> <span id="coinCountText">0</span>`;
  controls.parentNode.insertBefore(inventoryDiv, controls);
}
function updateCoinInventoryDisplay(count) {
  const coinCountText = document.getElementById("coinCountText");
  if (coinCountText) coinCountText.textContent = count;
}

// ==== GAME CODE ====

const tileSize = 32;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- SOUND EFFECTS ---
const sndEnemyHit = new Audio('assets/audio/364929__jofae__game-die.mp3');
const sndEnemyStomp = new Audio('assets/audio/video-game-bonus-323603.mp3');
const sndJump = new Audio('assets/audio/pixel-jump-319167.mp3');
const sndCoin = new Audio('assets/audio/613312__ezzin__coins_1.wav');
const sndScamCoin = new Audio('assets/audio/wrong-buzzer-6268.mp3');
const sndLevelUp = new Audio('assets/audio/pixel-level-up-sound-351836.mp3');

// --- COIN/SCAM COIN GRAPHICS ---
const coinImg = new Image();
coinImg.src = 'assets/file_00000000978c61f7a3829e2af5cfbdd2 (1).png';
const scamCoinImg = new Image();
scamCoinImg.src = 'assets/file_000000002028622fa6a883704e7d77d0.png';

document.addEventListener("touchstart", function (e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// === LEVELS ===
const levels = [
  [
    "####################################################################################################",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                            $                                 $  F#",
    "#                                                         2        cBcccc                cA  #######",
    "#                                   $       @@@@@@  #############                                  #",
    "#                                                                                                  #",
    "#                              bA   ######                                                         #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                               $                                                  #",
    "#                                                                                                  #",
    "#                                          1                Y                                      #",
    "#                              bB    ##   #################    ####                                #",
    "#                                                                                                  #",
    "#                                                                 ##                               #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                              ###                                 #",
    "#                                                                                                  #",
    "#                                        $                #####                                    #",
    "#                                           T    @@@@@                                             #",
    "#                                 $      #####                                                     #",
    "#                                    ##                                                            #",
    "#                                                                                                  #",
    "#                              ##                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                 ####   $                                                         #",
    "#                                                 $                                                #",
    "#                                     #######                                                      #",
    "#                                              #######    aA                                       #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                 R                                                #",
    "#                                               #####     aB                                       #",
    "#                                           $                                                      #",
    "#                                         #####                                                    #",
    "# S Q       W       $        E     x                                                               #",
    "####################################################################################################"
  ],
  [
    "####################################################################################################",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                              F                                                                    #",
    "#                            ###                                                                      #",
    "#                                                                                                  #",
    "#                                        3                                                         #",
    "#                             ############################                                         #",
    "#                                                                                                  #",
    "#                                                            ###########                           #",
    "#                                                         #               aA                       #",
    "#                                                 2                                                #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                               #######                           #    #         R                 #",
    "#                                       #                                                          #",
    "#                                               1              #          aB                       #",
    "#                                       ####################       bA                              #",
    "#                                                                  b                               #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                  bB        ############          #",
    "#                                                                                                  #",
    "#                                                                         @@@@          T          #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                              #########                           #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                    #########                                     #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                              W              #######        @@@@@                                 #",
    "#                                                                                                  #",
    "# S           !       $        #        !    E          x                                          #",
    "####################################################################################################"
  ],
  [
    "####################################################################################################",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                        3                                                         #",
    "#                             ############################                                         #",
    "#                                                                                                  #",
    "#                                                            ###########                           #",
    "#                                                         #               aA                       #",
    "#                                                 2                                                #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                               #######                           #    #         R                 #",
    "#                                       #                                                          #",
    "#                                               1              #          aB                       #",
    "#                                       ####################       bA                              #",
    "#                                                                  b                               #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                  bB        ############          #",
    "#                                                                                                  #",
    "#                                                                         @@@@          T          #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                              #########                           #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                    #########                                     #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                              W              #######        @@@@@                                 #",
    "#                                                                                                  #",
    "# S           !       $        #        !    E          x                                          #",
    "####################################################################################################"
  ],
  [
    "####################################################################################################",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                        3                                                         #",
    "#                             ############################                                         #",
    "#                                                                                                  #",
    "#                                                            ###########                           #",
    "#                                                         #               aA                       #",
    "#                                                 2                                                #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                               #######                           #    #         R                 #",
    "#                                       #                                                          #",
    "#                                               1              #          aB                       #",
    "#                                       ####################       bA                              #",
    "#                                                                  b                               #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                  bB        ############          #",
    "#                                                                                                  #",
    "#                                                                         @@@@          T          #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                              #########                           #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                    #########                                     #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                              W              #######        @@@@@                                 #",
    "#                                                                                                  #",
    "# S           !       $        #        !    E          x                                          #",
    "####################################################################################################"
  ],
  [
    "####################################################################################################",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                        3                                                         #",
    "#                             ############################                                         #",
    "#                                                                                                  #",
    "#                                                            ###########                           #",
    "#                                                         #               aA                       #",
    "#                                                 2                                                #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                               #######                           #    #         R                 #",
    "#                                       #                                                          #",
    "#                                               1              #          aB                       #",
    "#                                       ####################       bA                              #",
    "#                                                                  b                               #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                  bB        ############          #",
    "#                                                                                                  #",
    "#                                                                         @@@@          T          #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                              #########                           #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                    #########                                     #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                              W              #######        @@@@@                                 #",
    "#                                                                                                  #",
    "# S           !       $        #        !    E          x                                          #",
    "####################################################################################################"
  ],
  [
    "####################################################################################################",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                        3                                                         #",
    "#                             ############################                                         #",
    "#                                                                                                  #",
    "#                                                            ###########                           #",
    "#                                                         #               aA                       #",
    "#                                                 2                                                #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                               #######                           #    #         R                 #",
    "#                                       #                                                          #",
    "#                                               1              #          aB                       #",
    "#                                       ####################       bA                              #",
    "#                                                                  b                               #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                  bB        ############          #",
    "#                                                                                                  #",
    "#                                                                         @@@@          T          #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                              #########                           #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                    #########                                     #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                              W              #######        @@@@@                                 #",
    "#                                                                                                  #",
    "# S           !       $        #        !    E          x                                          #",
    "####################################################################################################"
  ],
  [
    "####################################################################################################",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                        3                                                         #",
    "#                             ############################                                         #",
    "#                                                                                                  #",
    "#                                                            ###########                           #",
    "#                                                         #               aA                       #",
    "#                                                 2                                                #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                               #######                           #    #         R                 #",
    "#                                       #                                                          #",
    "#                                               1              #          aB                       #",
    "#                                       ####################       bA                              #",
    "#                                                                  b                               #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                  bB        ############          #",
    "#                                                                                                  #",
    "#                                                                         @@@@          T          #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                              #########                           #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                    #########                                     #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                              W              #######        @@@@@                                 #",
    "#                                                                                                  #",
    "# S           !       $        #        !    E          x                                          #",
    "####################################################################################################"
  ],
  [
    "####################################################################################################",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                        3                                                         #",
    "#                             ############################                                         #",
    "#                                                                                                  #",
    "#                                                            ###########                           #",
    "#                                                         #               aA                       #",
    "#                                                 2                                                #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                               #######                           #    #         R                 #",
    "#                                       #                                                          #",
    "#                                               1              #          aB                       #",
    "#                                       ####################       bA                              #",
    "#                                                                  b                               #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                  bB        ############          #",
    "#                                                                                                  #",
    "#                                                                         @@@@          T          #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                              #########                           #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                    #########                                     #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                              W              #######        @@@@@                                 #",
    "#                                                                                                  #",
    "# S           !       $        #        !    E          x                                          #",
    "####################################################################################################"
  ],
  [
    "####################################################################################################",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                        3                                                         #",
    "#                             ############################                                         #",
    "#                                                                                                  #",
    "#                                                            ###########                           #",
    "#                                                         #               aA                       #",
    "#                                                 2                                                #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                               #######                           #    #         R                 #",
    "#                                       #                                                          #",
    "#                                               1              #          aB                       #",
    "#                                       ####################       bA                              #",
    "#                                                                  b                               #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                  bB        ############          #",
    "#                                                                                                  #",
    "#                                                                         @@@@          T          #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                              #########                           #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                    #########                                     #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                              W              #######        @@@@@                                 #",
    "#                                                                                                  #",
    "# S           !       $        #        !    E          x                                          #",
    "####################################################################################################"
  ],
  [
    "####################################################################################################",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                        3                                                         #",
    "#                             ############################                                         #",
    "#                                                                                                  #",
    "#                                                            ###########                           #",
    "#                                                         #               aA                       #",
    "#                                                 2                                                #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                               #######                           #    #         R                 #",
    "#                                       #                                                          #",
    "#                                               1              #          aB                       #",
    "#                                       ####################       bA                              #",
    "#                                                                  b                               #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                  bB        ############          #",
    "#                                                                                                  #",
    "#                                                                         @@@@          T          #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                              #########                           #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                    #########                                     #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                                                                                                  #",
    "#                              W              #######        @@@@@                                 #",
    "#                                                                                                  #",
    "# S           !       $        #        !    E          x                                          #",
    "####################################################################################################"
  ]
];

// === CONTROL CHARACTERS ===
const tileColors = {
  '#': '#444', '-': '#b5651d', '@': '#a020f0', ' ': '#aee7ff',
  'S': '#0f0', 'F': '#ff9800', '$': '#ff9100', 'x': '#ff9100',
  '1': '#ffe600', '2': '#e74c3c', '3': '#2980b9', '!': '#fff',
  'Q': '#ff69b4', 'W': '#ff69b4', 'E': '#ff69b4', 'R': '#ff69b4',
  'T': '#ff69b4', 'Y': '#ff69b4', 'U': '#ff69b4'
};
const platformGreen = "#00d55a";
const triggerSymbols = ['Q','W','E','R','T','Y','U'];
const triggerMessages = {
  Q: "Start Point: This is where your journey begins. Move and jump to explore the level.",
  W: "Coin: Collect coins to increase your score.",
  E: "Scam Coin: These look like coins, but cost you points! Avoid them.",
  R: "Moving Platform: These platforms move back and forth. Ride them carefully.",
  T: "Spinning Platform: These platforms flip periodically. Watch your step!",
  Y: "Enemy: Jump on enemies to defeat them, but avoid touching them from the side.",
  U: "End Point: Reach here to complete the level."
};
let triggers = {}, shownTriggers = {}, activeTrigger = null, dismissCounter = 0, lastKey = null;
function scanTriggers() {
  triggers = {};
  shownTriggers = {};
  for (let symbol of triggerSymbols) triggers[symbol] = [];
  for (let y = 0; y < level.length; y++) {
    for (let x = 0; x < level[y].length; x++) {
      let char = level[y][x];
      if (triggerSymbols.includes(char)) triggers[char].push({x, y});
    }
  }
}
function resetTriggers() {
  shownTriggers = {};
  activeTrigger = null;
  dismissCounter = 0;
  lastKey = null;
}
function tryDismissTrigger(key) {
  if (!activeTrigger) return;
  if (lastKey !== key) {
    lastKey = key; dismissCounter = 1;
  } else {
    dismissCounter++;
    if (dismissCounter >= 2) {
      activeTrigger = null;
      dismissCounter = 0;
      lastKey = null;
    }
  }
}
function drawTriggerOverlay() {
  if (!activeTrigger) return;
  const message = triggerMessages[activeTrigger];
  if (!message) return;
  const boxWidth = canvas.width * 0.9;
  const boxHeight = 70;
  const boxX = (canvas.width - boxWidth) / 2;
  const boxY = canvas.height - boxHeight - 24;
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = "#23292e";
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#ff69b4";
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  ctx.font = "bold 18px 'Fira Mono', 'Consolas', 'monospace'";
  ctx.fillStyle = "#ffb1e7";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(message, boxX + 18, boxY + 16);
  ctx.font = "12px 'Fira Mono', 'Consolas', 'monospace'";
  ctx.fillText("Press any button twice to close", boxX + 18, boxY + boxHeight - 22);
  ctx.restore();
}

// ---------------------------------------

const player = {
  x: 0, y: 0, width: tileSize * 0.8, height: tileSize * 0.8,
  color: '#00f', dx: 0, dy: 0, speed: 2.5, jumpPower: 12,
  grounded: false, coinCount: 0
};

// --- Persist player coins across all levels ---
let globalCoinCount = 0;

let cameraX = 0, cameraY = 0;
let coins = [], scamCoins = [];
let stompInvulnTimer = 0;
let enemies = [];
const platformIDs = 'abcdefghij'.split('');
const endpointAChar = id => id + 'A';
const endpointBChar = id => id + 'B';
let movingPlatforms = [], spinningState = { time: 0, flipping: false, flipAngle: 0 };
let fallingThroughSpin = false, fallingThroughAnyPlatform = false, fallingThroughUntilY = null;

function scanEnemies() {
  enemies = [];
  for (let y = 0; y < level.length; y++) {
    for (let x = 0; x < level[y].length; x++) {
      const char = level[y][x];
      if (char === '1' || char === '2') {
        const { left, right } = findPlatformPatrolBounds(x, y, level);
        enemies.push({
          type: char, x: x * tileSize, y: y * tileSize, px: x, py: y, dir: 1,
          patrolMin: left * tileSize, patrolMax: right * tileSize,
          speed: 1.2, vy: 0, grounded: false, jumpCooldown: 0,
          jumpInterval: 1000 + Math.random() * 1500, alive: true
        });
      }
    }
  }
}
function findPlatformPatrolBounds(x, y, level) {
  let left = x, right = x;
  for (let lx = x; lx >= 0; lx--) {
    if (level[y+1] && level[y+1][lx] !== ' ' && level[y][lx] === ' ') left = lx;
    else if (lx !== x) break;
  }
  for (let rx = x; rx < level[y].length; rx++) {
    if (level[y+1] && level[y+1][rx] !== ' ' && level[y][rx] === ' ') right = rx;
    else if (rx !== x) break;
  }
  return { left, right };
}
function isEnemyGrounded(enemy) {
  const ex = enemy.x, ey = enemy.y, ew = tileSize, eh = tileSize;
  for (let dx of [2, ew - 2]) {
    const tx = Math.floor((ex + dx) / tileSize);
    const ty = Math.floor((ey + eh + 1) / tileSize);
    if (level[ty] && level[ty][tx] && level[ty][tx] !== ' ') return true;
    for (let p of movingPlatforms) {
      let px, py, w, h;
      if (p.vertical) {
        px = (p.aPos.x - 2.5) * tileSize;
        py = p.pos * tileSize;
        w = 6 * tileSize;
        h = tileSize;
      } else {
        px = p.pos * tileSize;
        py = p.aPos.y * tileSize;
        w = p.length * tileSize;
        h = tileSize;
      }
      if (ex + dx >= px && ex + dx < px + w && ey + eh + 1 >= py && ey + eh + 1 < py + h) return true;
    }
  }
  return false;
}
function updateEnemies(delta) {
  for (let enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.dir * enemy.speed;
    if (enemy.x < enemy.patrolMin) { enemy.x = enemy.patrolMin; enemy.dir = 1; }
    if (enemy.x > enemy.patrolMax) { enemy.x = enemy.patrolMax; enemy.dir = -1; }
    enemy.vy += 0.4;
    enemy.y += enemy.vy;
    if (isEnemyGrounded(enemy)) {
      enemy.y = Math.floor((enemy.y + tileSize) / tileSize) * tileSize - tileSize;
      enemy.vy = 0; enemy.grounded = true;
    } else {
      enemy.grounded = false;
    }
    enemy.jumpCooldown += delta;
    if (enemy.grounded && enemy.jumpCooldown > enemy.jumpInterval) {
      if (enemy.type === '1') enemy.vy = -2;
      else if (enemy.type === '2') enemy.vy = -4;
      enemy.jumpCooldown = 0;
      enemy.jumpInterval = 800 + Math.random() * 2200;
    }
  }
}
function drawEnemies() {
  for (let enemy of enemies) {
    if (!enemy.alive) continue;
    ctx.fillStyle = enemy.type === '1' ? tileColors['1'] : enemy.type === '2' ? tileColors['2'] : "#000";
    ctx.fillRect(enemy.x - cameraX, enemy.y - cameraY, tileSize, tileSize);
    ctx.fillStyle = "#222";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(enemy.type === '1' ? "S" : "D", enemy.x - cameraX + tileSize/2, enemy.y - cameraY + tileSize/2);
  }
}
function scanMovingPlatforms() {
  movingPlatforms = [];
  for (let id of platformIDs) {
    let aPos = null, bPos = null, length = 0, vertical = false;
    for (let y = 0; y < level.length; y++) {
      for (let x = 0; x < level[y].length; x++) {
        if (level[y].substr(x, 2) === endpointAChar(id)) aPos = {x, y};
        if (level[y].substr(x, 2) === endpointBChar(id)) bPos = {x, y};
      }
    }
    if (!aPos || !bPos) continue;
    vertical = (aPos.x === bPos.x);
    if (vertical) {
      length = 1;
    } else {
      let minX = Math.min(aPos.x, bPos.x);
      let maxX = Math.max(aPos.x, bPos.x);
      length = 0;
      for (let x = minX + 1; x < maxX; x++) {
        if (level[aPos.y][x] === id) length++;
      }
      if (length === 0) length = 1;
    }
    movingPlatforms.push({
      id, vertical, aPos, bPos, length,
      t: 0, timer: 0, direction: 1,
      pos: vertical ? aPos.y+1 : aPos.x+2,
      lastPos: vertical ? aPos.y+1 : aPos.x+2
    });
  }
}
function updateMovingPlatforms(delta) {
  for (let p of movingPlatforms) {
    p.lastPos = p.pos;
    const waitTime = 3000, moveTime = 5000;
    if (p.t === 0) {
      p.timer += delta;
      p.pos = p.vertical ? p.aPos.y+1 : p.aPos.x+2;
      if (p.timer >= waitTime) { p.direction = 1; p.timer = 0; p.t = 0.0001; }
    } else if (p.t === 1) {
      p.timer += delta;
      p.pos = p.vertical ? p.bPos.y-p.length : p.bPos.x-p.length;
      if (p.timer >= waitTime) { p.direction = -1; p.timer = 0; p.t = 0.9999; }
    } else {
      let progress = (delta / moveTime) * p.direction;
      p.t += progress;
      if (p.t >= 1) { p.t = 1; p.timer = 0; }
      else if (p.t <= 0) { p.t = 0; p.timer = 0; }
      if (p.vertical)
        p.pos = (1-p.t)*(p.aPos.y+1) + p.t*(p.bPos.y-p.length);
      else
        p.pos = (1-p.t)*(p.aPos.x+2) + p.t*(p.bPos.x-p.length);
    }
  }
}
function scanCoins() {
  coins = [];
  scamCoins = [];
  for (let y = 0; y < level.length; y++) {
    for (let x = 0; x < level[y].length; x++) {
      if (level[y][x] === '$') coins.push({ x, y });
      if (level[y][x] === 'x') scamCoins.push({ x, y });
    }
  }
}
function resetPlayerToStart() {
  for (let y = 0; y < level.length; y++) {
    for (let x = 0; x < level[y].length; x++) {
      if (level[y][x] === 'S') {
        player.x = x * tileSize;
        player.y = y * tileSize;
        player.dx = 0; player.dy = 0; player.grounded = false;
        cameraX = 0; cameraY = 0;
        fallingThroughSpin = false;
        fallingThroughAnyPlatform = false;
        fallingThroughUntilY = null;
        stompInvulnTimer = 0;
        return;
      }
    }
  }
}
let currentLevel = 0;
let level = levels[currentLevel];
function loadLevel(n) {
  // Before changing level, save coin count to global coin inventory
  globalCoinCount = player.coinCount;

  currentLevel = n;
  level = levels[currentLevel];
  resetPlayerToStart();
  scanCoins();
  scanMovingPlatforms();
  scanEnemies();
  scanTriggers();
  resetTriggers();
  spinningState = { time: 0, flipping: false, flipAngle: 0 };
  fallingThroughSpin = false;
  fallingThroughAnyPlatform = false;
  fallingThroughUntilY = null;
  stompInvulnTimer = 0;
  // Restore coin inventory from globalCoinCount, do NOT reset coins on new level!
  player.coinCount = globalCoinCount;
  updateCoinInventoryDisplay(player.coinCount); // Update inventory UI
}
resetPlayerToStart();
scanCoins();
scanMovingPlatforms();
scanEnemies();
scanTriggers();
resetTriggers();

const keys = { left: false, right: false, jump: false };

const controlButtons = document.querySelectorAll('.control-btn');
controlButtons.forEach(btn => {
  btn.addEventListener('contextmenu', e => e.preventDefault());
  btn.addEventListener('mousedown', e => e.preventDefault());
  btn.addEventListener('touchstart', e => e.preventDefault());
});
document.querySelector('.left').addEventListener('touchstart', () => {
  keys.left = true; tryDismissTrigger('left');
});
document.querySelector('.left').addEventListener('touchend', () => keys.left = false);
document.querySelector('.right').addEventListener('touchstart', () => {
  keys.right = true; tryDismissTrigger('right');
});
document.querySelector('.right').addEventListener('touchend', () => keys.right = false);
document.querySelector('.jump').addEventListener('touchstart', () => {
  if (player.grounded) {
    player.dy = -player.jumpPower;
    player.grounded = false;
    sndJump.currentTime = 0; sndJump.play();
  }
  tryDismissTrigger('jump');
});
document.addEventListener('keydown', function(e) {
  if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && player.grounded) {
    player.dy = -player.jumpPower;
    player.grounded = false;
    sndJump.currentTime = 0; sndJump.play();
  }
});

// Modified collectCoin to update coin inventory display
function collectCoin(coinList, tileChar, inventoryChange, sound) {
  for (let i = 0; i < coinList.length; i++) {
    const coin = coinList[i];
    const coinX = coin.x * tileSize;
    const coinY = coin.y * tileSize;
    const coinRect = { x: coinX, y: coinY, w: tileSize, h: tileSize };
    const playerRect = { x: player.x, y: player.y, w: player.width, h: player.height };
    if (
      playerRect.x < coinRect.x + coinRect.w &&
      playerRect.x + playerRect.w > coinRect.x &&
      playerRect.y < coinRect.y + coinRect.h &&
      playerRect.y + playerRect.h > coinRect.y
    ) {
      coinList.splice(i, 1);
      level[coin.y] = level[coin.y].substring(0, coin.x) + ' ' + level[coin.y].substring(coin.x + 1);
      let before = player.coinCount;
      inventoryChange();
      // Only play sound if gained or lost coins
      if (sound && player.coinCount !== before) { sound.currentTime = 0; sound.play(); }
      updateCoinInventoryDisplay(player.coinCount);
      // Also update globalCoinCount after coin count change for persistency!
      globalCoinCount = player.coinCount;
      return true;
    }
  }
  return false;
}

// Extra scam coin logic for player losing coins (used by enemy and scam coin)
// Lose a random number of coins between 1 and 4, but not more than currently collected
function loseCoinsRandomScam() {
  if (player.coinCount > 0) {
    let maxLose = Math.min(4, player.coinCount);
    let lost = Math.floor(Math.random() * maxLose) + 1;
    player.coinCount -= lost;
    if (player.coinCount < 0) player.coinCount = 0;
    updateCoinInventoryDisplay(player.coinCount);
    // Also update globalCoinCount so it's always in sync
    globalCoinCount = player.coinCount;
  }
}

// Original loseCoinsRandom for enemy collision: lose 40%
function loseCoinsRandom(amount) {
  let lost = Math.min(player.coinCount, amount);
  player.coinCount -= lost;
  if (player.coinCount < 0) player.coinCount = 0;
  updateCoinInventoryDisplay(player.coinCount);
  globalCoinCount = player.coinCount;
  return lost;
}

function updateSpinningState(delta) {
  spinningState.time += delta;
  if (!spinningState.flipping && spinningState.time >= 3000) {
    spinningState.flipping = true;
    spinningState.flipAngle = 0;
    spinningState.time = 0;
    if (isPlayerOnAnySpinningPlatform(player.x, player.y + player.height + 1)) {
      fallingThroughSpin = true;
    }
  }
  if (spinningState.flipping) {
    spinningState.flipAngle += Math.PI / 30;
    if (spinningState.flipAngle >= Math.PI) {
      spinningState.flipping = false;
      spinningState.flipAngle = 0;
      spinningState.time = 0;
    }
  }
}
function isSpinningPlatformSolid() {
  return !spinningState.flipping && !fallingThroughSpin;
}
function checkCollision(x, y) {
  if (stompInvulnTimer > 0) return false;
  if (fallingThroughAnyPlatform) {
    if (y + player.height < fallingThroughUntilY) return false;
    else fallingThroughAnyPlatform = false;
  }
  const corners = [
    [x, y],
    [x + player.width, y],
    [x, y + player.height],
    [x + player.width, y + player.height]
  ];
  for (const [cx, cy] of corners) {
    const tx = Math.floor(cx / tileSize);
    const ty = Math.floor(cy / tileSize);
    if (level[ty] && level[ty][tx]) {
      const tile = level[ty][tx];
      if (tile === '#') return true;
      if (tile === '@' && isSpinningPlatformSolid()) return true;
    }
    for (let p of movingPlatforms) {
      let px, py, w, h;
      if (p.vertical) {
        px = (p.aPos.x - 2.5) * tileSize;
        py = p.pos * tileSize;
        w = 6 * tileSize;
        h = tileSize;
      } else {
        px = p.pos * tileSize;
        py = p.aPos.y * tileSize;
        w = p.length * tileSize;
        h = tileSize;
      }
      if (
        cx >= px && cx < px + w &&
        cy >= py && cy < py + h
      ) {
        return true;
      }
    }
  }
  return false;
}
let microJumpActive = false;
function getPlayerStandingPlatform() {
  for (let p of movingPlatforms) {
    let px, py, w, h;
    if (p.vertical) {
      px = (p.aPos.x - 2.5) * tileSize;
      py = p.pos * tileSize;
      w = 6 * tileSize;
      h = tileSize;
      const platformTop = py;
      if (
        player.x + player.width > px &&
        player.x < px + w &&
        Math.abs((player.y + player.height) - platformTop) < 4
      ) {
        return {p, px, py, w, h, vertical: true, platformTop};
      }
    } else {
      px = p.pos * tileSize;
      py = p.aPos.y * tileSize;
      w = p.length * tileSize;
      h = tileSize;
      const platformTop = py;
      if (
        player.x + player.width > px &&
        player.x < px + w &&
        Math.abs((player.y + player.height) - platformTop) < 4
      ) {
        return {p, px, py, w, h, vertical: false, platformTop};
      }
    }
  }
  return null;
}
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw &&
         ax + aw > bx &&
         ay < by + bh &&
         ay + ah > by;
}
function updatePlayer() {
  if (stompInvulnTimer > 0) stompInvulnTimer--;
  player.dx = 0;
  if (keys.left) player.dx = -player.speed;
  if (keys.right) player.dx = player.speed;
  player.dy += 0.4;
  player.x += player.dx;
  if (checkCollision(player.x, player.y)) player.x -= player.dx;
  player.y += player.dy;
  let collided = checkCollision(player.x, player.y);
  if (collided) {
    player.y -= player.dy;
    if (player.dy > 0) player.grounded = true;
    player.dy = 0;
  } else {
    player.grounded = false;
  }
  let riding = getPlayerStandingPlatform();
  if (riding) {
    let {p, px, py, w, h, vertical, platformTop} = riding;
    let delta;
    if (vertical) {
      delta = (p.pos - p.lastPos) * tileSize;
      player.y += delta;
    } else {
      delta = (p.pos - p.lastPos) * tileSize;
      player.x += delta;
    }
    let pressingMovement = !player.grounded;
    if (!pressingMovement) {
      player.y = platformTop - player.height;
      player.dy = 0;
      player.grounded = true;
      if ((keys.left || keys.right) && !keys.jump && !microJumpActive) {
        player.dy = -3.5;
        player.grounded = false;
        microJumpActive = true;
      }
    } else {
      microJumpActive = false;
    }
  } else {
    microJumpActive = false;
  }
  if (fallingThroughSpin) {
    if (!isPlayerOnAnySpinningPlatform(player.x, player.y + player.height / 2)) {
      fallingThroughSpin = false;
    }
  }
  if (!activeTrigger) {
    for (let symbol of triggerSymbols) {
      if (shownTriggers[symbol]) continue;
      for (let trig of triggers[symbol]) {
        let tx = trig.x * tileSize, ty = trig.y * tileSize;
        if (rectsOverlap(player.x, player.y, player.width, player.height, tx, ty, tileSize, tileSize)) {
          activeTrigger = symbol;
          shownTriggers[symbol] = true;
          for (let t of triggers[symbol]) {
            level[t.y] = level[t.y].substring(0, t.x) + ' ' + level[t.y].substring(t.x + 1);
          }
          break;
        }
      }
      if (activeTrigger) break;
    }
  }
  collectCoin(coins, '$', () => { player.coinCount++; }, sndCoin);
  // When scam coin, lose a random number of coins (1 to 4 or less if not enough)
  collectCoin(scamCoins, 'x', loseCoinsRandomScam, sndScamCoin);
  checkFinish();
}
function handlePlayerEnemyCollision() {
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (!enemy.alive) continue;
    const ex = enemy.x, ey = enemy.y, ew = tileSize, eh = tileSize;
    const px = player.x, py = player.y, pw = player.width, ph = player.height;
    if (rectsOverlap(px, py, pw, ph, ex, ey, ew, eh)) {
      const playerBottom = py + ph;
      const playerPrevBottom = (py - player.dy) + ph;
      const enemyTop = ey;
      const horizontalOverlap = (px + pw > ex + ew * 0.15) && (px < ex + ew - ew * 0.15);
      const topTolerance = 7;
      if (
        player.dy > 0 &&
        playerPrevBottom <= enemyTop + topTolerance &&
        playerBottom > enemyTop + topTolerance &&
        horizontalOverlap
      ) {
        player.dy = -player.jumpPower * 0.8;
        enemy.alive = false;
        stompInvulnTimer = 8;
        player.y = enemy.y - player.height - 1;
        sndEnemyStomp.currentTime = 0; sndEnemyStomp.play();
        return;
      } else {
        fallingThroughAnyPlatform = true;
        fallingThroughUntilY = player.y + player.height + 45;
        let lost = Math.floor(player.coinCount * 0.4);
        player.coinCount -= lost;
        if (player.coinCount < 0) player.coinCount = 0;
        updateCoinInventoryDisplay(player.coinCount);
        globalCoinCount = player.coinCount;
        sndEnemyHit.currentTime = 0; sndEnemyHit.play();
        return;
      }
    }
  }
}
function isPlayerOnSpinningPlatform(x, y) {
  const tx1 = Math.floor(x / tileSize);
  const tx2 = Math.floor((x + player.width - 1) / tileSize);
  const ty = Math.floor((y + player.height) / tileSize);
  return (
    (level[ty] && (level[ty][tx1] === '@' || level[ty][tx2] === '@')) &&
    !spinningState.flipping
  );
}
function isPlayerOnAnySpinningPlatform(x, y) {
  const tx1 = Math.floor(x / tileSize);
  const tx2 = Math.floor((x + player.width - 1) / tileSize);
  const ty = Math.floor(y / tileSize);
  return (
    (level[ty] && (level[ty][tx1] === '@' || level[ty][tx2] === '@'))
  );
}
function checkFinish() {
  const px = Math.floor((player.x + player.width / 2) / tileSize);
  const py = Math.floor((player.y + player.height / 2) / tileSize);
  if (level[py] && level[py][px] === 'F') {
    sndLevelUp.currentTime = 0; sndLevelUp.play();
    if (currentLevel < levels.length - 1) {
      loadLevel(currentLevel + 1);
    } else {
      loadLevel(0);
    }
  }
}
function drawLevel() {
  for (let p of movingPlatforms) {
    ctx.fillStyle = platformGreen;
    if (p.vertical) {
      let px = (p.aPos.x - 2.5) * tileSize - cameraX;
      let py = p.pos * tileSize - cameraY;
      ctx.fillRect(px, py, 6 * tileSize, tileSize);
      ctx.fillStyle = platformGreen;
      ctx.fillRect((p.aPos.x - 2.5) * tileSize - cameraX, p.aPos.y * tileSize - cameraY, 6 * tileSize, tileSize);
      ctx.fillRect((p.bPos.x - 2.5) * tileSize - cameraX, p.bPos.y * tileSize - cameraY, 6 * tileSize, tileSize);
    } else {
      let px = p.pos * tileSize - cameraX;
      let py = p.aPos.y * tileSize - cameraY;
      ctx.fillRect(px, py, p.length * tileSize, tileSize);
      ctx.fillStyle = platformGreen;
      ctx.fillRect(p.aPos.x * tileSize - cameraX, p.aPos.y * tileSize - cameraY, tileSize, tileSize);
      ctx.fillRect(p.bPos.x * tileSize - cameraX, p.bPos.y * tileSize - cameraY, tileSize, tileSize);
    }
  }
  const tilesWide = Math.ceil(canvas.width / tileSize);
  const tilesHigh = Math.ceil(canvas.height / tileSize);
  const startCol = Math.max(0, Math.floor(cameraX / tileSize));
  const endCol = Math.min(level[0].length, startCol + tilesWide + 2);
  const startRow = Math.max(0, Math.floor(cameraY / tileSize));
  const endRow = Math.min(level.length, startRow + tilesHigh + 2);
  for (let y = startRow; y < endRow; y++) {
    let x = startCol;
    while (x < endCol) {
      let char = level[y][x];
      if (
        platformIDs.includes(char) ||
        platformIDs.some(id => level[y].substr(x, 2) === endpointAChar(id) || level[y].substr(x, 2) === endpointBChar(id))
      ) {
        x++;
        continue;
      }
      if (char === '@') {
        let xStart = x;
        while (x < endCol && level[y][x] === '@') x++;
        let xEnd = x - 1;
        let groupLength = xEnd - xStart + 1;
        const centerX = (xStart + xEnd + 1) / 2 * tileSize - cameraX;
        const centerY = y * tileSize + tileSize / 2 - cameraY;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(spinningState.flipping ? spinningState.flipAngle : 0);
        ctx.fillStyle = tileColors['@'];
        ctx.fillRect(
          -(groupLength * tileSize) / 2,
          -tileSize / 2,
          groupLength * tileSize,
          tileSize
        );
        ctx.restore();
      } else if (char !== ' ') {
        // Draw coins and scam coins using images
        if (char === '$') {
          if (coinImg.complete) {
            ctx.drawImage(coinImg, x * tileSize - cameraX, y * tileSize - cameraY, tileSize, tileSize);
          } else {
            coinImg.onload = () => {
              ctx.drawImage(coinImg, x * tileSize - cameraX, y * tileSize - cameraY, tileSize, tileSize);
            }
          }
        } else if (char === 'x') {
          if (scamCoinImg.complete) {
            ctx.drawImage(scamCoinImg, x * tileSize - cameraX, y * tileSize - cameraY, tileSize, tileSize);
          } else {
            scamCoinImg.onload = () => {
              ctx.drawImage(scamCoinImg, x * tileSize - cameraX, y * tileSize - cameraY, tileSize, tileSize);
            }
          }
        } else {
          let color = tileColors[char] || '#000';
          ctx.fillStyle = color;
          ctx.fillRect(x * tileSize - cameraX, y * tileSize - cameraY, tileSize, tileSize);
        }
        x++;
      } else {
        x++;
      }
    }
  }
}
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x - cameraX, player.y - cameraY, player.width, player.height);
}
function updateCamera() {
  const targetX = player.x + player.width / 2 - canvas.width / 2;
  const targetY = player.y + player.height / 2 - canvas.height / 2;
  cameraX += (targetX - cameraX) * 0.05;
  cameraY += (targetY - cameraY) * 0.05;
}
let prevTime = performance.now();
function gameLoop() {
  const now = performance.now();
  const delta = now - prevTime;
  prevTime = now;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateSpinningState(delta);
  updateMovingPlatforms(delta);
  updatePlayer();
  handlePlayerEnemyCollision();
  updateEnemies(delta);
  updateCamera();
  drawLevel();
  drawPlayer();
  drawEnemies();
  drawTriggerOverlay();
  requestAnimationFrame(gameLoop);
}

// --- COIN INVENTORY UI INIT ---
// (Do not call here! Only call after controls exist, in continueBtn.onclick above)

//gameLoop(); // <-- Move this call to after continueBtn.onclick if you want to start on continue

// Ensure gameLoop starts as soon as the DOM and controls are ready.
window.addEventListener("DOMContentLoaded", function() {
  // Optionally, start gameLoop immediately, or after continue is pressed.
  // If you want intro/start, comment out next line.
  // gameLoop();
});

// If you want the game to start only after continue:
continueBtn && continueBtn.addEventListener('click', function() {
  requestAnimationFrame(gameLoop);
});
