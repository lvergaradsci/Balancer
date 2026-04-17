// game.js - Motor principal del juego Industrial Balancer

// ============ ESTADO GLOBAL DEL JUEGO ============
const GameState = {
    playerName: '',
    currentLevel: 0,
    score: 0,
    combo: 0,
    maxCombo: 1,
    isPaused: false,
    isGameOver: false,
    levelStartTime: 0,
    
    // Indicadores
    welfare: 0,
    abuse: 0,
    pressure: 50,
    justice: 50,
    
    // Física
    particles: [],
    
    // Minijuego actual
    currentMinigame: null,
    
    // Animaciones
    animationFrameId: null,
    lastComboTime: Date.now(),
    
    // Timer
    levelTimer: null,
    timeRemaining: 0
};

// ============ CANVAS Y CONTEXTO ============
let canvas, ctx;
let canvasWidth, canvasHeight;

// ============ ELEMENTOS DEL DOM ============
const DOM = {};

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Iniciando Industrial Balancer...');
    
    cacheDOM();
    setupCanvas();
    setupEventListeners();
    
    console.log('✅ Juego inicializado');
});

// Cachear elementos DOM
function cacheDOM() {
    DOM.loginScreen = document.getElementById('loginScreen');
    DOM.gameScreen = document.getElementById('gameScreen');
    DOM.levelCompleteScreen = document.getElementById('levelCompleteScreen');
    DOM.gameOverScreen = document.getElementById('gameOverScreen');
    DOM.leaderboardScreen = document.getElementById('leaderboardScreen');
    DOM.pauseScreen = document.getElementById('pauseScreen');
    
    DOM.playerNameInput = document.getElementById('playerName');
    DOM.startButton = document.getElementById('startButton');
    
    DOM.engineerDisplay = document.getElementById('engineerDisplay');
    DOM.currentLevel = document.getElementById('currentLevel');
    DOM.scoreValue = document.getElementById('scoreValue');
    DOM.comboFill = document.getElementById('comboFill');
    DOM.comboMultiplier = document.getElementById('comboMultiplier');
    DOM.pressureBar = document.getElementById('pressureBar');
    DOM.justiceBar = document.getElementById('justiceBar');
    
    DOM.welfareFluid = document.getElementById('welfareFluid');
    DOM.welfareValue = document.getElementById('welfareValue');
    DOM.abuseFluid = document.getElementById('abuseFluid');
    DOM.abuseValue = document.getElementById('abuseValue');
    
    DOM.gameControls = document.getElementById('gameControls');
    DOM.levelMessage = document.getElementById('levelMessage');
    DOM.instructions = document.getElementById('instructions');
    
    DOM.pauseButton = document.getElementById('pauseButton');
    DOM.nextLevelBtn = document.getElementById('nextLevelBtn');
    DOM.retryBtn = document.getElementById('retryBtn');
    DOM.leaderboardBtn = document.getElementById('leaderboardBtn');
    DOM.resumeBtn = document.getElementById('resumeBtn');
    DOM.quitBtn = document.getElementById('quitBtn');
    DOM.closeLeaderboard = document.getElementById('closeLeaderboard');
    DOM.backToGameBtn = document.getElementById('backToGameBtn');
    
    DOM.gameCanvas = document.getElementById('gameCanvas');
}

function setupCanvas() {
    canvas = DOM.gameCanvas;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    DOM.startButton.addEventListener('click', handleStart);
    DOM.playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleStart();
    });
    
    DOM.pauseButton.addEventListener('click', pauseGame);
    DOM.nextLevelBtn.addEventListener('click', nextLevel);
    DOM.retryBtn.addEventListener('click', retryGame);
    DOM.leaderboardBtn.addEventListener('click', showLeaderboard);
    DOM.resumeBtn.addEventListener('click', resumeGame);
    DOM.quitBtn.addEventListener('click', quitToMenu);
    DOM.closeLeaderboard.addEventListener('click', hideLeaderboard);
    DOM.backToGameBtn.addEventListener('click', hideLeaderboard);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !GameState.isPaused && !GameState.isGameOver) {
            pauseGame();
        }
    });
}

// ============ INICIO DEL JUEGO ============
function handleStart() {
    const name = DOM.playerNameInput.value.trim();
    
    if (name.length < 2) {
        DOM.playerNameInput.style.borderColor = '#FF006E';
        DOM.playerNameInput.placeholder = '¡Ingresa tu nombre primero!';
        soundManager.playError();
        
        setTimeout(() => {
            DOM.playerNameInput.style.borderColor = '';
            DOM.playerNameInput.placeholder = 'Ingresa tu nombre de ingeniero...';
        }, 2000);
        return;
    }
    
    GameState.playerName = name;
    DOM.engineerDisplay.textContent = name;
    
    soundManager.playSuccess();
    soundManager.playClick();
    DOM.startButton.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        DOM.loginScreen.classList.remove('active');
        
        setTimeout(() => {
            DOM.gameScreen.classList.add('active');
            soundManager.startAmbient();
            
            setTimeout(() => {
                startLevel(1);
            }, 500);
        }, 300);
    }, 300);
}

// ============ NIVELES ============
function startLevel(levelNumber) {
    if (levelNumber > GAME_DATA.levels.length) {
        gameComplete();
        return;
    }
    
    const level = GAME_DATA.levels[levelNumber - 1];
    GameState.currentLevel = levelNumber;
    GameState.levelStartTime = Date.now();
    GameState.combo = 0;
    GameState.timeRemaining = level.duration;
    
    DOM.currentLevel.textContent = levelNumber;
    DOM.instructions.textContent = level.messages.intro;
    
    GameState.welfare = 0;
    GameState.abuse = 0;
    GameState.pressure = level.initialPressure;
    GameState.justice = level.initialJustice;
    
    updateIndicators();
    showLevelMessage(level.title);
    
    setTimeout(() => {
        initMinigame(level);
        soundManager.playLevelUp();
    }, 2000);
}

function showLevelMessage(message) {
    DOM.levelMessage.textContent = message;
    DOM.levelMessage.classList.add('show');
    
    setTimeout(() => {
        DOM.levelMessage.classList.remove('show');
    }, 2500);
}

// ============ MINIJUEGOS ============
function initMinigame(level) {
    DOM.gameControls.innerHTML = '';
    GameState.particles = [];
    
    switch(level.minigameType) {
        case 'hydraulic':
            initHydraulicMinigame(level);
            break;
        case 'conveyor':
            initConveyorMinigame(level);
            break;
        case 'circuit':
            initCircuitMinigame(level);
            break;
        default:
            initHydraulicMinigame(level);
    }
    
    startGameLoop();
    startLevelTimer(level);
}

// HIDRÁULICA
function initHydraulicMinigame(level) {
    DOM.instructions.textContent = 'Ajusta las válvulas para llenar BIENESTAR sin desbordar ABUSO';
    
    createParticles(level.particles.count, level.particles);
    
    const controls = level.controls;
    const controlsHTML = [];
    
    Object.keys(controls).forEach(key => {
        const control = controls[key];
        const label = key.replace('Valve', '').replace('Rate', '').replace(/([A-Z])/g, ' $1').toUpperCase();
        
        controlsHTML.push(`
            <div class="control-valve">
                <label>${label}</label>
                <input type="range" id="${key}" min="${control.min}" max="${control.max}" value="${control.initial}" step="${control.step}">
                <span id="${key}Value">${control.initial}%</span>
            </div>
        `);
    });
    
    DOM.gameControls.innerHTML = controlsHTML.join('');
    
    Object.keys(controls).forEach(key => {
        const slider = document.getElementById(key);
        const valueDisplay = document.getElementById(key + 'Value');
        
        slider.addEventListener('input', (e) => {
            valueDisplay.textContent = e.target.value + '%';
            soundManager.playValve();
            applyValveEffect(key, e.target.value, level);
        });
    });
    
    GameState.currentMinigame = 'hydraulic';
}

function createParticles(count, config) {
    for (let i = 0; i < count; i++) {
        GameState.particles.push({
            x: Math.random() * canvasWidth,
            y: -Math.random() * 500,
            vx: (Math.random() - 0.5) * 3,
            vy: config.speed,
            radius: Math.random() * 5 + 3,
            color: Math.random() > 0.5 ? '#06FFA5' : '#FF6B35',
            type: Math.random() > 0.5 ? 'welfare' : 'abuse'
        });
    }
}

function applyValveEffect(valveType, value, level) {
    const v = value / 100;
    
    if (valveType === 'taxValve') {
        GameState.abuse = Math.max(0, GameState.abuse - v * 2);
        GameState.justice = Math.min(100, GameState.justice + v * 0.5);
    } else if (valveType === 'incentiveValve') {
        GameState.welfare = Math.min(100, GameState.welfare + v * 1.5);
        GameState.justice = Math.min(100, GameState.justice + v * 0.8);
    } else if (valveType === 'subsidyValve') {
        GameState.welfare = Math.min(100, GameState.welfare + v * 1.2);
    } else if (valveType === 'interestRate') {
        GameState.pressure = Math.max(0, GameState.pressure - v * 2);
    }
    
    updateIndicators();
    addCombo();
}

// CONVEYOR
function initConveyorMinigame(level) {
    DOM.instructions.textContent = 'Arrastra productos a su destino correcto';
    GameState.currentMinigame = 'conveyor';
    
    // Implementación simplificada
    const html = `<div style="text-align:center; padding:40px; font-size:1.2rem;">
        🎮 Minijuego de Cinta en Desarrollo<br>
        <button onclick="simulateConveyorSuccess()" style="margin-top:20px; padding:15px 30px; font-size:1.1rem; background:#06FFA5; border:none; border-radius:10px; cursor:pointer;">
            COMPLETAR NIVEL ✓
        </button>
    </div>`;
    DOM.gameControls.innerHTML = html;
}

window.simulateConveyorSuccess = function() {
    addScore(500);
    GameState.welfare = 80;
    GameState.justice = 75;
    updateIndicators();
    soundManager.playSuccess();
    setTimeout(() => completeLevel(), 1000);
}

// CIRCUIT
function initCircuitMinigame(level) {
    DOM.instructions.textContent = 'Conecta los circuitos para equilibrar el crecimiento';
    GameState.currentMinigame = 'circuit';
    
    const html = `
        <div style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center;">
            ${level.circuits.map((c, i) => `
                <button onclick="connectCircuit(${i})" style="padding:20px 40px; font-size:1.1rem; background:rgba(78,205,196,0.2); border:2px solid #4ECDC4; border-radius:15px; color:white; cursor:pointer; transition:all 0.3s;">
                    ${c.from} → ${c.to}
                </button>
            `).join('')}
        </div>
    `;
    DOM.gameControls.innerHTML = html;
}

window.connectCircuit = function(i) {
    soundManager.playElectric();
    addScore(200);
    GameState.welfare = Math.min(100, GameState.welfare + 15);
    GameState.justice = Math.min(100, GameState.justice + 10);
    updateIndicators();
    
    const btns = DOM.gameControls.querySelectorAll('button');
    btns[i].style.background = 'linear-gradient(135deg, #06FFA5, #4ECDC4)';
    btns[i].style.boxShadow = '0 0 30px rgba(6,255,165,0.8)';
    btns[i].disabled = true;
}

// ============ GAME LOOP ============
function startGameLoop() {
    if (GameState.animationFrameId) {
        cancelAnimationFrame(GameState.animationFrameId);
    }
    gameLoop();
}

function gameLoop() {
    if (!GameState.isPaused && !GameState.isGameOver) {
        updatePhysics();
        renderCanvas();
        updateComboDecay();
        checkLevelConditions();
    }
    
    GameState.animationFrameId = requestAnimationFrame(gameLoop);
}

function updatePhysics() {
    if (GameState.currentMinigame !== 'hydraulic') return;
    
    GameState.particles.forEach(p => {
        p.vy += 0.3;
        p.x += p.vx;
        p.y += p.vy;
        
        // Bordes
        if (p.x < p.radius || p.x > canvasWidth - p.radius) {
            p.vx *= -0.8;
            p.x = Math.max(p.radius, Math.min(canvasWidth - p.radius, p.x));
        }
        
        if (p.y > canvasHeight - 100) {
            // Agregar al tanque correspondiente
            if (Math.random() < 0.1) {
                if (p.type === 'welfare') {
                    GameState.welfare = Math.min(100, GameState.welfare + 0.5);
                } else {
                    GameState.abuse = Math.min(100, GameState.abuse + 0.3);
                }
                updateIndicators();
            }
            
            // SOLUCIÓN: Reciclar la partícula inmediatamente al tocar el fondo
            p.y = -50; // La enviamos arriba
            p.x = Math.random() * canvasWidth; // A una posición horizontal aleatoria
            p.vy = 2; // Restauramos su velocidad de caída
        }
    });
}

function renderCanvas() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    GameState.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

// ============ TIMER ============
function startLevelTimer(level) {
    if (GameState.levelTimer) clearInterval(GameState.levelTimer);
    
    GameState.levelTimer = setInterval(() => {
        if (GameState.isPaused) return;
        
        GameState.timeRemaining--;
        
        if (GameState.timeRemaining <= 0) {
            clearInterval(GameState.levelTimer);
            checkLevelCompletion(level);
        }
    }, 1000);
}

// ============ INDICADORES ============
function updateIndicators() {
    DOM.welfareFluid.style.height = GameState.welfare + '%';
    DOM.welfareValue.textContent = Math.round(GameState.welfare);
    
    DOM.abuseFluid.style.height = GameState.abuse + '%';
    DOM.abuseValue.textContent = Math.round(GameState.abuse);
    
    DOM.pressureBar.style.width = GameState.pressure + '%';
    DOM.justiceBar.style.width = GameState.justice + '%';
}

// ============ SCORING Y COMBO ============
function addScore(points) {
    const multiplier = GAME_DATA.scoring.comboMultipliers[Math.min(GameState.combo, GAME_DATA.scoring.comboMultipliers.length - 1)];
    const finalPoints = Math.round(points * multiplier);
    
    GameState.score += finalPoints;
    DOM.scoreValue.textContent = GameState.score;
    
    // Animación de puntos
    DOM.scoreValue.style.transform = 'scale(1.2)';
    setTimeout(() => {
        DOM.scoreValue.style.transform = 'scale(1)';
    }, 200);
}

function addCombo() {
    GameState.combo++;
    GameState.maxCombo = Math.max(GameState.maxCombo, GameState.combo);
    GameState.lastComboTime = Date.now();
    
    const comboIndex = Math.min(GameState.combo - 1, GAME_DATA.scoring.comboMultipliers.length - 1);
    const fillPercent = (comboIndex / (GAME_DATA.scoring.comboMultipliers.length - 1)) * 100;
    
    DOM.comboFill.style.width = fillPercent + '%';
    DOM.comboMultiplier.textContent = '×' + GAME_DATA.scoring.comboMultipliers[comboIndex];
    
    if (GameState.combo > 1) {
        soundManager.playCombo(GameState.combo);
    }
}

function updateComboDecay() {
    const elapsed = Date.now() - GameState.lastComboTime;
    if (elapsed > GAME_DATA.scoring.comboDecayTime) {
        resetCombo();
    }
}

function resetCombo() {
    GameState.combo = 0;
    DOM.comboFill.style.width = '0%';
    DOM.comboMultiplier.textContent = '×1';
}

// ============ CONDICIONES DE NIVEL ============
function checkLevelConditions() {
    const level = GAME_DATA.levels[GameState.currentLevel - 1];
    
    if (GameState.abuse >= level.maxAbuse + 10) {
        failLevel('El ABUSO EMPRESARIAL se desbordó');
    }
    
    if (GameState.welfare < 10 && GameState.timeRemaining < level.duration / 2) {
        failLevel('El BIENESTAR SOCIAL está en crisis');
    }
}

function checkLevelCompletion(level) {
    if (GameState.welfare >= level.targetWelfare && GameState.abuse <= level.maxAbuse) {
        completeLevel();
    } else {
        failLevel(level.messages.failure);
    }
}

function completeLevel() {
    clearInterval(GameState.levelTimer);
    GameState.isPaused = true;
    
    const level = GAME_DATA.levels[GameState.currentLevel - 1];
    
    // Calcular bonificaciones
    const welfareBonus = Math.max(0, GameState.welfare - level.targetWelfare) * GAME_DATA.scoring.bonusWelfare;
    const abuseBonus = Math.max(0, level.maxAbuse - GameState.abuse) * GAME_DATA.scoring.bonusWelfare;
    
    const elapsed = (Date.now() - GameState.levelStartTime) / 1000;
    const timePercent = elapsed / level.duration;
    let speedBonus = 0;
    if (timePercent < 0.5) speedBonus = GAME_DATA.scoring.speedBonus.fast;
    else if (timePercent < 0.75) speedBonus = GAME_DATA.scoring.speedBonus.medium;
    
    const levelPoints = welfareBonus + abuseBonus + speedBonus;
    addScore(levelPoints);
    
    soundManager.playVictory();
    
    // Mostrar pantalla de nivel completado
    document.getElementById('levelPoints').textContent = levelPoints;
    document.getElementById('maxCombo').textContent = '×' + GameState.maxCombo;
    document.getElementById('finalWelfare').textContent = Math.round(GameState.welfare) + '%';
    
    // Mensaje del supervisor
    const messages = level.supervisorMessages;
    const message = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('supervisorMessage').textContent = message;
    
    // Estrellas
    const stars = document.getElementById('starsContainer');
    stars.innerHTML = '';
    const starCount = GameState.welfare >= 90 ? 3 : GameState.welfare >= 75 ? 2 : 1;
    for (let i = 0; i < starCount; i++) {
        stars.innerHTML += '<span style="font-size:3rem; animation: bounceIn 0.5s ' + (i * 0.2) + 's both;">⭐</span>';
    }
    
    DOM.levelCompleteScreen.classList.add('active');
}

function failLevel(reason) {
    clearInterval(GameState.levelTimer);
    GameState.isGameOver = true;
    
    soundManager.playDefeat();
    soundManager.stopAmbient();
    
    document.getElementById('gameOverReason').textContent = reason;
    document.getElementById('finalScore').textContent = GameState.score;
    
    // Guardar puntuación en segundo plano
    leaderboardManager.saveScore(GameState.playerName, GameState.score, GameState.currentLevel);
    
    DOM.gameOverScreen.classList.add('active');
}

function nextLevel() {
    DOM.levelCompleteScreen.classList.remove('active');
    GameState.isPaused = false;
    startLevel(GameState.currentLevel + 1);
}

function gameComplete() {
    alert('¡FELICITACIONES! Has completado todos los niveles. Eres un INGENIERO MAESTRO.');
    leaderboardManager.saveScore(GameState.playerName, GameState.score, GameState.currentLevel);
    showLeaderboard();
}

// ============ PAUSA ============
function pauseGame() {
    GameState.isPaused = true;
    document.getElementById('pauseLevel').textContent = GameState.currentLevel;
    document.getElementById('pauseScore').textContent = GameState.score;
    DOM.pauseScreen.classList.add('active');
    soundManager.playClick();
}

function resumeGame() {
    GameState.isPaused = false;
    DOM.pauseScreen.classList.remove('active');
    soundManager.playClick();
}

function retryGame() {
    location.reload();
}

function quitToMenu() {
    location.reload();
}

// ============ LEADERBOARD ============
async function showLeaderboard() {
    DOM.leaderboardScreen.classList.add('active');
    
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<div class="loading-spinner">Cargando rankings...</div>';
    
    try {
        const scores = await leaderboardManager.getLeaderboard();
        const formatted = leaderboardManager.formatLeaderboard(scores, 15);
        
        if (formatted.length === 0) {
            list.innerHTML = '<p style="padding:40px; opacity:0.6;">No hay puntuaciones registradas aún</p>';
            return;
        }
        
        const html = formatted.map(entry => `
            <div class="leaderboard-entry" style="display:flex; justify-content:space-between; padding:15px 20px; background:rgba(255,255,255,0.05); margin:10px 0; border-radius:10px; border-left:4px solid ${entry.rank <= 3 ? '#FFE66D' : '#4ECDC4'};">
                <span style="font-size:1.5rem; min-width:50px;">${entry.medal}</span>
                <span style="flex:1; font-weight:600;">${entry.name}</span>
                <span style="color:#06FFA5; font-family:Bungee; font-size:1.2rem;">${entry.score}</span>
                <span style="opacity:0.6; min-width:80px; text-align:right;">Nv.${entry.level}</span>
            </div>
        `).join('');
        
        list.innerHTML = html;
        
    } catch (error) {
        list.innerHTML = '<p style="padding:40px; color:#FF6B35;">Error cargando ranking</p>';
    }
}

function hideLeaderboard() {
    DOM.leaderboardScreen.classList.remove('active');
}
