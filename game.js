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
        case 'filter':
            initFilterMinigame(level);
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
// ==========================================
// NIVEL 2: CONVEYOR (Publicidad Engañosa)
// ==========================================
function initConveyorMinigame(level) {
    DOM.instructions.textContent = level.messages.intro;
    GameState.currentMinigame = 'conveyor';
    
    // Interfaz de Clasificación
    const html = `
        <div style="display:flex; flex-direction:column; align-items:center; gap:15px; width:100%;">
            <div id="conveyorProduct" style="width:100px; height:100px; background:rgba(255,255,255,0.05); border:3px solid #fff; border-radius:15px; display:flex; justify-content:center; align-items:center; font-size:3.5rem; transition:all 0.3s; margin-top:10px;">
                ⚙️
            </div>
            <div id="productLabel" style="font-size:1.2rem; font-weight:bold; height:25px;">Preparando cinta...</div>
            
            <div style="display:flex; gap:10px; width:100%; justify-content:center; flex-wrap:wrap; margin-top:10px;">
                <button onclick="sortProduct('good')" class="control-valve" style="flex:1; min-width:100px; background:rgba(6,255,165,0.1); border-color:#06FFA5; color:white; cursor:pointer;">✅ Aprobar</button>
                <button onclick="sortProduct('neutral')" class="control-valve" style="flex:1; min-width:100px; background:rgba(255,230,109,0.1); border-color:#FFE66D; color:white; cursor:pointer;">⚖️ Impuesto</button>
                <button onclick="sortProduct('bad')" class="control-valve" style="flex:1; min-width:100px; background:rgba(255,107,53,0.1); border-color:#FF6B35; color:white; cursor:pointer;">🚫 Sancionar</button>
            </div>
        </div>
    `;
    DOM.gameControls.innerHTML = html;
    
    window.currentProductType = null;
    setTimeout(spawnNextProduct, 1000);
}

window.spawnNextProduct = function() {
    if(GameState.isGameOver || GameState.isPaused || GameState.currentMinigame !== 'conveyor') return;
    
    const types = [
        { type: "good", label: "Producto Básico", icon: "🍞", color: "#06FFA5" },
        { type: "bad", label: "Publicidad Falsa", icon: "🤥", color: "#FF6B35" },
        { type: "neutral", label: "Producto Lujo", icon: "💎", color: "#FFE66D" }
    ];
    const prod = types[Math.floor(Math.random() * types.length)];
    window.currentProductType = prod.type;
    
    const prodDiv = document.getElementById('conveyorProduct');
    const labelDiv = document.getElementById('productLabel');
    if(prodDiv && labelDiv) {
        prodDiv.textContent = prod.icon;
        prodDiv.style.borderColor = prod.color;
        prodDiv.style.boxShadow = `0 0 20px ${prod.color}`;
        labelDiv.textContent = prod.label;
    }
};

window.sortProduct = function(selectedType) {
    if (!window.currentProductType || GameState.isPaused) return;
    
    if (selectedType === window.currentProductType) {
        // Acierto
        if(window.soundManager && window.soundManager.playDrop) soundManager.playDrop();
        GameState.welfare = Math.min(100, GameState.welfare + 6);
        GameState.justice = Math.min(100, GameState.justice + 2);
        addScore(60);
        addCombo();
    } else {
        // Error
        GameState.abuse = Math.min(100, GameState.abuse + 10);
        GameState.welfare = Math.max(0, GameState.welfare - 5);
        resetCombo();
    }
    updateIndicators();
    
    window.currentProductType = null;
    const prodDiv = document.getElementById('conveyorProduct');
    if(prodDiv) {
        prodDiv.textContent = "⚙️";
        prodDiv.style.borderColor = "#fff";
        prodDiv.style.boxShadow = "none";
        document.getElementById('productLabel').textContent = "Procesando...";
    }
    setTimeout(spawnNextProduct, 600);
};

// ==========================================
// NIVEL 3: FILTER (Productos Dañinos)
// ==========================================
function initFilterMinigame(level) {
    DOM.instructions.textContent = level.messages.intro;
    GameState.currentMinigame = 'filter';
    
    const html = `
        <div style="display:flex; flex-direction:column; align-items:center; gap:20px; width:100%; padding:10px;">
            <div style="font-size:1.1rem; text-align:center;">
                Filtro de Seguridad: <strong id="filterStatus" style="color:#FF6B35;">INACTIVO</strong>
            </div>
            
            <div id="filterScanner" style="width:90%; height:100px; border:3px dashed #4ECDC4; border-radius:15px; display:flex; align-items:center; overflow:hidden; position:relative; background:rgba(255,255,255,0.02);">
                <div style="position:absolute; width:4px; height:100%; background:rgba(255,255,255,0.2); left:50%; z-index:0;"></div>
                <div id="movingProduct" style="position:absolute; left:-50px; font-size:2.5rem; transition: left 1.5s linear; z-index:1;">📦</div>
            </div>
            
            <button id="activateFilterBtn" 
                onmousedown="toggleFilter(true)" onmouseup="toggleFilter(false)" onmouseleave="toggleFilter(false)" 
                ontouchstart="toggleFilter(true)" ontouchend="toggleFilter(false)" 
                class="control-valve" style="width:90%; border-color:#FF6B35; color:white; font-size:1.1rem; cursor:pointer; user-select:none;">
                🔴 MANTÉN PRESIONADO PARA FILTRAR
            </button>
        </div>
    `;
    DOM.gameControls.innerHTML = html;
    
    window.isFilterActive = false;
    setTimeout(startFilterScanner, 1000);
}

window.toggleFilter = function(active) {
    if(GameState.isPaused) return;
    window.isFilterActive = active;
    const btn = document.getElementById('activateFilterBtn');
    const status = document.getElementById('filterStatus');
    const scanner = document.getElementById('filterScanner');
    
    if(active) {
        if(window.soundManager && window.soundManager.playElectric) soundManager.playElectric();
        btn.style.borderColor = '#06FFA5';
        btn.innerHTML = '🟢 FILTRANDO...';
        status.textContent = 'ACTIVO (Gastando Justicia)';
        status.style.color = '#06FFA5';
        scanner.style.borderColor = '#06FFA5';
        scanner.style.background = 'rgba(6,255,165,0.1)';
    } else {
        btn.style.borderColor = '#FF6B35';
        btn.innerHTML = '🔴 MANTÉN PRESIONADO PARA FILTRAR';
        status.textContent = 'INACTIVO';
        status.style.color = '#FF6B35';
        scanner.style.borderColor = '#4ECDC4';
        scanner.style.background = 'rgba(255,255,255,0.02)';
    }
};

window.startFilterScanner = function() {
    if(GameState.isGameOver || GameState.isPaused || GameState.currentMinigame !== 'filter') return;
    
    const prodDiv = document.getElementById('movingProduct');
    if(!prodDiv) return;

    // 40% de probabilidad de ser tóxico
    const isToxic = Math.random() < 0.4; 
    prodDiv.textContent = isToxic ? '☠️' : '🍏';
    
    // Reiniciar posición a la izquierda
    prodDiv.style.transition = 'none';
    prodDiv.style.left = '-60px';
    
    // Iniciar movimiento hacia la derecha
    setTimeout(() => {
        prodDiv.style.transition = 'left 1.5s linear';
        prodDiv.style.left = '120%';
        
        // Evaluar justo cuando pasa por el medio (0.75s)
        setTimeout(() => {
            if (GameState.isGameOver || GameState.isPaused) return;
            
            if (window.isFilterActive) {
                GameState.justice = Math.max(0, GameState.justice - 1); // Costo de usar el filtro
                if (isToxic) {
                    GameState.welfare = Math.min(100, GameState.welfare + 5);
                    addScore(50);
                    addCombo();
                    prodDiv.textContent = '🛡️'; // Visual de bloqueo
                } else {
                    // Penalización por bloquear algo sano
                    GameState.abuse = Math.min(100, GameState.abuse + 5);
                    resetCombo();
                }
            } else {
                if (isToxic) {
                    // Dejó pasar algo tóxico
                    GameState.abuse = Math.min(100, GameState.abuse + 15);
                    GameState.welfare = Math.max(0, GameState.welfare - 8);
                    resetCombo();
                } else {
                    // Dejó pasar algo sano
                    GameState.welfare = Math.min(100, GameState.welfare + 3);
                }
            }
            updateIndicators();
            
            // Repetir el ciclo
            setTimeout(startFilterScanner, 800);
        }, 750);
    }, 50);
};

window.procesarPolitica = function(tipo, btn) {
    if (tipo === 'bien') {
        GameState.welfare = Math.min(100, GameState.welfare + 20);
        btn.style.background = "#06FFA5";
        soundManager.playSuccess();
    } else {
        GameState.abuse = Math.min(100, GameState.abuse + 20);
        btn.style.background = "#FF6B35";
        soundManager.playError();
    }
    btn.disabled = true;
    updateIndicators();
};


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
    soundManager.playSuccess(); // Cambiado a success para feedback claro
    addScore(200);
    
    // Subimos los valores para que el usuario pueda ganar
    GameState.welfare = Math.min(100, GameState.welfare + 25);
    GameState.justice = Math.min(100, GameState.justice + 15);
    
    // Reducimos un poco el abuso si conectas bien el circuito
    GameState.abuse = Math.max(0, GameState.abuse - 5);
    
    updateIndicators();
    
    const btns = DOM.gameControls.querySelectorAll('button');
    if(btns[i]) {
        btns[i].style.background = 'linear-gradient(135deg, #06FFA5, #4ECDC4)';
        btns[i].style.boxShadow = '0 0 30px rgba(6,255,165,0.8)';
        btns[i].innerHTML += " ✅";
        btns[i].disabled = true;
    }

    // Si ya conectó todos, avisar que debe esperar a que termine el tiempo
    const todosConectados = Array.from(btns).every(b => b.disabled);
    if (todosConectados) {
        DOM.instructions.textContent = "¡Circuitos estables! Espera a que termine el tiempo para validar.";
    }
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
    // Log para depuración: ver valores actuales vs objetivos del nivel
    console.log(`📊 Fin del Nivel ${GameState.currentLevel}:`);
    console.log(`Bienestar: ${GameState.welfare} (Objetivo: ${level.targetWelfare})`);
    console.log(`Abuso: ${GameState.abuse} (Máximo: ${level.maxAbuse})`);

    // Verificación de victoria
    const cumpleBienestar = GameState.welfare >= level.targetWelfare;
    const cumpleAbuso = GameState.abuse <= level.maxAbuse;

    if (cumpleBienestar && cumpleAbuso) {
        completeLevel();
    } else {
        // Personalizamos el mensaje de error según lo que falló
        let motivo = level.messages.failure;
        if (!cumpleBienestar) motivo = "No lograste alcanzar el Bienestar Social mínimo.";
        if (!cumpleAbuso) motivo = "El Abuso Empresarial superó los límites permitidos.";
        
        failLevel(motivo);
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
    
    // Limpiamos el rastro del nivel anterior
    GameState.particles = [];
    DOM.gameControls.innerHTML = '';
    
    // Iniciamos el siguiente
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
