// game.js - Motor principal del juego Industrial Balancer v2.0

const GameState = {
    playerName: '', currentLevel: 0, score: 0, combo: 0, maxCombo: 1,
    isPaused: false, isGameOver: false, levelStartTime: 0,
    welfare: 0, abuse: 0, pressure: 50, justice: 50,
    particles: [], currentMinigame: null, animationFrameId: null,
    lastComboTime: Date.now(), levelTimer: null, timeRemaining: 0,
    conveyorScore: { correct: 0, wrong: 0, total: 0 },
    filterScore: { blocked: 0, passed: 0, total: 0 },
    giniIndex: 80,
    conveyorInterval: null, filterInterval: null, redistributeInterval: null
};

let canvas, ctx, canvasWidth, canvasHeight;
const DOM = {};
let currentFilterProduct = null;
let filterDecisionTimer = null;
let draggedProduct = null;
let touchDragProduct = null;

document.addEventListener('DOMContentLoaded', () => {
    cacheDOM(); setupCanvas(); setupEventListeners();
});

function cacheDOM() {
    const ids = ['loginScreen','gameScreen','levelCompleteScreen','gameOverScreen','leaderboardScreen','pauseScreen',
        'playerName','startButton','engineerDisplay','currentLevel','scoreValue','comboFill','comboMultiplier',
        'pressureBar','justiceBar','welfareFluid','welfareValue','abuseFluid','abuseValue',
        'gameControls','levelMessage','instructions','pauseButton','nextLevelBtn','retryBtn',
        'leaderboardBtn','resumeBtn','quitBtn','closeLeaderboard','backToGameBtn','gameCanvas'];
    ids.forEach(id => {
        const key = id.replace(/-([a-z])/g, g => g[1].toUpperCase());
        DOM[key] = document.getElementById(id);
    });
    DOM.playerNameInput = document.getElementById('playerName');
    DOM.startButton = document.getElementById('startButton');
    DOM.gameCanvas = document.getElementById('gameCanvas');
    DOM.gameControls = document.getElementById('gameControls');
    DOM.levelMessage = document.getElementById('levelMessage');
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

function setupEventListeners() {
    document.getElementById('startButton').addEventListener('click', handleStart);
    document.getElementById('playerName').addEventListener('keypress', e => { if(e.key==='Enter') handleStart(); });
    document.getElementById('pauseButton').addEventListener('click', pauseGame);
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
    document.getElementById('retryBtn').addEventListener('click', () => location.reload());
    document.getElementById('leaderboardBtn').addEventListener('click', showLeaderboard);
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    document.getElementById('quitBtn').addEventListener('click', () => location.reload());
    document.getElementById('closeLeaderboard').addEventListener('click', hideLeaderboard);
    document.getElementById('backToGameBtn').addEventListener('click', hideLeaderboard);
    document.addEventListener('keydown', e => { if(e.key==='Escape' && !GameState.isPaused && !GameState.isGameOver) pauseGame(); });
}

function handleStart() {
    const name = document.getElementById('playerName').value.trim();
    if (name.length < 2) {
        document.getElementById('playerName').style.borderColor = '#FF006E';
        soundManager.playError();
        setTimeout(() => { document.getElementById('playerName').style.borderColor=''; }, 2000);
        return;
    }
    GameState.playerName = name;
    document.getElementById('engineerDisplay').textContent = name;
    soundManager.playSuccess();
    setTimeout(() => {
        document.getElementById('loginScreen').classList.remove('active');
        setTimeout(() => {
            document.getElementById('gameScreen').classList.add('active');
            soundManager.startAmbient();
            setTimeout(() => startLevel(1), 500);
        }, 300);
    }, 300);
}

// ============ NIVELES ============
function startLevel(levelNumber) {
    if (levelNumber > GAME_DATA.levels.length) { gameComplete(); return; }
    const level = GAME_DATA.levels[levelNumber - 1];
    GameState.currentLevel = levelNumber;
    GameState.levelStartTime = Date.now();
    GameState.combo = 0; GameState.maxCombo = 1;
    GameState.timeRemaining = level.duration;
    GameState.welfare = 0; GameState.abuse = 0;
    GameState.pressure = level.initialPressure;
    GameState.justice = level.initialJustice;
    GameState.isGameOver = false;
    GameState.conveyorScore = { correct:0, wrong:0, total:0 };
    GameState.filterScore = { blocked:0, passed:0, total:0 };
    GameState.giniIndex = 80;
    currentFilterProduct = null; draggedProduct = null; touchDragProduct = null;
    if (GameState.conveyorInterval) { clearInterval(GameState.conveyorInterval); GameState.conveyorInterval = null; }
    if (GameState.filterInterval) { clearInterval(GameState.filterInterval); GameState.filterInterval = null; }
    if (GameState.redistributeInterval) { clearInterval(GameState.redistributeInterval); GameState.redistributeInterval = null; }

    document.getElementById('currentLevel').textContent = levelNumber;
    document.getElementById('instructions').textContent = level.messages.intro;
    updateIndicators();
    showLevelMessage(level.title);
    setTimeout(() => { initMinigame(level); soundManager.playLevelUp(); }, 2000);
}

function showLevelMessage(message) {
    const el = document.getElementById('levelMessage');
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
}

function initMinigame(level) {
    document.getElementById('gameControls').innerHTML = '';
    GameState.particles = [];
    switch(level.minigameType) {
        case 'hydraulic': initHydraulicMinigame(level); break;
        case 'conveyor': initConveyorMinigame(level); break;
        case 'filter': initFilterMinigame(level); break;
        case 'redistribution': initRedistributionMinigame(level); break;
        case 'circuit': initCircuitMinigame(level); break;
        default: initHydraulicMinigame(level);
    }
    startGameLoop();
    startLevelTimer(level);
}

// =============================================
// NIVEL 1 & 6 — HIDRÁULICA
// =============================================
function initHydraulicMinigame(level) {
    document.getElementById('instructions').textContent = 'Ajusta las válvulas: sube BIENESTAR sin desbordar ABUSO';
    GameState.currentMinigame = 'hydraulic';
    createParticles(level.particles.count, level.particles);
    const controls = level.controls;
    const labelMap = { taxValve:'⚖️ IMPUESTOS', incentiveValve:'🎁 INCENTIVOS', subsidyValve:'🏠 SUBSIDIOS', interestRate:'📊 TASA DE INTERÉS' };
    let html = `<div class="hydraulic-controls">`;
    Object.keys(controls).forEach(key => {
        const c = controls[key];
        html += `<div class="control-valve">
            <label class="valve-label">${labelMap[key]||key}</label>
            <div class="valve-row">
                <input type="range" id="${key}" min="${c.min}" max="${c.max}" value="${c.initial}" step="${c.step}">
                <span id="${key}Value" class="valve-value">${c.initial}%</span>
            </div></div>`;
    });
    html += `</div>`;
    document.getElementById('gameControls').innerHTML = html;
    Object.keys(controls).forEach(key => {
        const sl = document.getElementById(key);
        if (!sl) return;
        sl.addEventListener('input', e => {
            document.getElementById(key+'Value').textContent = e.target.value+'%';
            soundManager.playValve();
            applyValveEffect(key, parseInt(e.target.value), level);
        });
    });
}

function createParticles(count, config) {
    for (let i = 0; i < count; i++) {
        GameState.particles.push({ x: Math.random()*canvasWidth, y: -Math.random()*500,
            vx:(Math.random()-0.5)*3, vy:config.speed||2, radius:Math.random()*5+3,
            color:Math.random()>0.5?'#06FFA5':'#FF6B35', type:Math.random()>0.5?'welfare':'abuse' });
    }
}

function applyValveEffect(key, value, level) {
    const v = value / 100;
    if (key==='taxValve') { GameState.abuse=Math.max(0,GameState.abuse-v*2); GameState.justice=Math.min(100,GameState.justice+v*0.5); }
    else if (key==='incentiveValve') { GameState.welfare=Math.min(100,GameState.welfare+v*1.5); GameState.justice=Math.min(100,GameState.justice+v*0.8); }
    else if (key==='subsidyValve') { GameState.welfare=Math.min(100,GameState.welfare+v*1.2); }
    else if (key==='interestRate') { GameState.pressure=Math.max(0,GameState.pressure-v*2); }
    updateIndicators(); addCombo();
}

// =============================================
// NIVEL 2 — CINTA TRANSPORTADORA
// =============================================
const CONVEYOR_PRODUCTS = [
    { emoji:'🌾', name:'Arroz Básico',        dest:'subsidize', color:'#06FFA5', desc:'Alimento esencial de la canasta familiar' },
    { emoji:'🥛', name:'Leche Fresca',         dest:'subsidize', color:'#06FFA5', desc:'Nutrición infantil básica' },
    { emoji:'💊', name:'Medicamentos',         dest:'subsidize', color:'#06FFA5', desc:'Salud pública garantizada' },
    { emoji:'🍞', name:'Pan Artesanal',        dest:'subsidize', color:'#06FFA5', desc:'Alimento básico cotidiano' },
    { emoji:'⚠️', name:'Publicidad Falsa',     dest:'sanction',  color:'#FF6B35', desc:'Engaña al consumidor con promesas falsas' },
    { emoji:'☠️', name:'Producto Tóxico',      dest:'sanction',  color:'#FF006E', desc:'Daña la salud: composición oculta peligrosa' },
    { emoji:'🚫', name:'Trabajo Infantil',     dest:'sanction',  color:'#FF006E', desc:'Viola derechos humanos fundamentales' },
    { emoji:'📢', name:'Spam Comercial',       dest:'sanction',  color:'#FF6B35', desc:'Práctica comercial engañosa y abusiva' },
    { emoji:'💎', name:'Joyería de Lujo',      dest:'tax',       color:'#FFE66D', desc:'Bien suntuario con alta capacidad contributiva' },
    { emoji:'🏎️', name:'Auto Deportivo',       dest:'tax',       color:'#FFE66D', desc:'Lujo que debe contribuir al fisco' },
    { emoji:'🍾', name:'Vino Importado',       dest:'tax',       color:'#FFE66D', desc:'Producto premium con impuesto al consumo' },
    { emoji:'🛥️', name:'Yate Privado',         dest:'tax',       color:'#FFE66D', desc:'Lujo extremo: alta tributación obligatoria' },
];

function initConveyorMinigame(level) {
    document.getElementById('instructions').textContent = '📦 Arrastra cada producto a la zona correcta: SUBSIDIAR / SANCIONAR / GRAVAR';
    GameState.currentMinigame = 'conveyor';

    document.getElementById('gameControls').innerHTML = `
        <div class="conveyor-container">
            <div class="conveyor-stats">
                <span class="cstat">✅ Correctos: <strong id="convCorrect">0</strong></span>
                <span class="cstat">❌ Errores: <strong id="convWrong">0</strong></span>
                <span class="cstat">📦 Total: <strong id="convTotal">0</strong></span>
            </div>
            <div class="conveyor-belt-area">
                <div class="belt-track"><div class="belt-moving"></div></div>
                <div class="products-lane" id="productsLane"></div>
            </div>
            <div class="destination-zones">
                <div class="dest-zone subsidize-zone" id="destSubsidize"
                    ondragover="event.preventDefault()" ondrop="dropProduct(event,'subsidize')"
                    ontouchend="handleTouchDrop(event,'subsidize')">
                    <div class="zone-icon">🟢</div>
                    <div class="zone-label">SUBSIDIAR</div>
                    <div class="zone-hint">Básicos / Buenos</div>
                </div>
                <div class="dest-zone sanction-zone" id="destSanction"
                    ondragover="event.preventDefault()" ondrop="dropProduct(event,'sanction')"
                    ontouchend="handleTouchDrop(event,'sanction')">
                    <div class="zone-icon">🔴</div>
                    <div class="zone-label">SANCIONAR</div>
                    <div class="zone-hint">Engañosos / Dañinos</div>
                </div>
                <div class="dest-zone tax-zone" id="destTax"
                    ondragover="event.preventDefault()" ondrop="dropProduct(event,'tax')"
                    ontouchend="handleTouchDrop(event,'tax')">
                    <div class="zone-icon">🟡</div>
                    <div class="zone-label">GRAVAR</div>
                    <div class="zone-hint">Lujo / Suntuarios</div>
                </div>
            </div>
        </div>`;

    spawnConveyorProduct();
    GameState.conveyorInterval = setInterval(() => {
        if (!GameState.isPaused && !GameState.isGameOver) spawnConveyorProduct();
    }, 3800);
}

function spawnConveyorProduct() {
    const lane = document.getElementById('productsLane');
    if (!lane || GameState.isGameOver) return;
    const product = CONVEYOR_PRODUCTS[Math.floor(Math.random()*CONVEYOR_PRODUCTS.length)];
    const id = 'prod_'+Date.now();
    const el = document.createElement('div');
    el.className = 'conveyor-product'; el.id = id;
    el.setAttribute('draggable','true');
    el.dataset.dest = product.dest;
    el.style.setProperty('--prod-color', product.color);
    el.innerHTML = `<div class="prod-emoji">${product.emoji}</div><div class="prod-name">${product.name}</div><div class="prod-desc">${product.desc}</div>`;

    el.addEventListener('dragstart', e => {
        draggedProduct = { id, dest: product.dest };
        el.classList.add('dragging');
        e.dataTransfer.setData('text/plain', id);
        soundManager.playDrag();
    });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); draggedProduct = null; });

    // Touch drag
    let startX, startY;
    el.addEventListener('touchstart', e => {
        touchDragProduct = { id, dest: product.dest, el };
        el.classList.add('touch-dragging');
        startX = e.touches[0].clientX; startY = e.touches[0].clientY;
        soundManager.playDrag();
    }, { passive:true });
    el.addEventListener('touchmove', e => {
        if (!touchDragProduct) return;
        const t = e.touches[0];
        el.style.cssText += `position:fixed;left:${t.clientX-50}px;top:${t.clientY-50}px;z-index:9999;pointer-events:none;`;
        document.querySelectorAll('.dest-zone').forEach(z => z.classList.remove('zone-hover'));
        const under = document.elementFromPoint(t.clientX, t.clientY);
        if (under?.closest('.dest-zone')) under.closest('.dest-zone').classList.add('zone-hover');
    }, { passive:true });
    el.addEventListener('touchend', e => {
        if (!touchDragProduct) return;
        const t = e.changedTouches[0];
        el.style.pointerEvents = '';
        const under = document.elementFromPoint(t.clientX, t.clientY);
        const zone = under?.closest('.dest-zone');
        document.querySelectorAll('.dest-zone').forEach(z => z.classList.remove('zone-hover'));
        if (zone) {
            const dest = zone.classList.contains('subsidize-zone') ? 'subsidize'
                       : zone.classList.contains('sanction-zone') ? 'sanction' : 'tax';
            processConveyorDrop(id, touchDragProduct.dest, dest);
        } else {
            el.style.cssText = el.style.cssText.replace(/position:fixed;[^;]+;[^;]+;z-index:\d+;pointer-events:[^;]+;/,'');
        }
        el.classList.remove('touch-dragging'); touchDragProduct = null;
    }, { passive:true });

    el.classList.add('belt-enter');
    lane.appendChild(el); soundManager.playConveyor();
    el._timeout = setTimeout(() => { if(el.parentNode) missConveyorProduct(el); }, 7000);
}

window.dropProduct = function(e, zoneDest) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!draggedProduct || draggedProduct.id !== id) return;
    processConveyorDrop(id, draggedProduct.dest, zoneDest);
    draggedProduct = null;
};

window.handleTouchDrop = function(e, zoneDest) { /* handled by touchend on product */ };

function processConveyorDrop(id, correctDest, chosenDest) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el._timeout) clearTimeout(el._timeout);
    const isCorrect = correctDest === chosenDest;
    GameState.conveyorScore.total++;
    if (isCorrect) {
        GameState.conveyorScore.correct++;
        GameState.welfare = Math.min(100, GameState.welfare + 12);
        GameState.justice = Math.min(100, GameState.justice + 6);
        GameState.abuse = Math.max(0, GameState.abuse - 5);
        addScore(150); addCombo(); soundManager.playSuccess();
        showFloatingText('+12 Bienestar ✅', '#06FFA5');
        el.classList.add('prod-correct');
    } else {
        GameState.conveyorScore.wrong++;
        GameState.abuse = Math.min(100, GameState.abuse + 15);
        GameState.welfare = Math.max(0, GameState.welfare - 5);
        soundManager.playError();
        showFloatingText('❌ Clasificación incorrecta', '#FF6B35');
        el.classList.add('prod-wrong');
    }
    // Reset position if touch-dragged
    el.style.position=''; el.style.left=''; el.style.top=''; el.style.zIndex=''; el.style.pointerEvents='';
    updateConveyorStats(); updateIndicators();
    setTimeout(() => { if(el.parentNode) el.parentNode.removeChild(el); }, 500);
}

function missConveyorProduct(el) {
    GameState.conveyorScore.wrong++; GameState.conveyorScore.total++;
    GameState.abuse = Math.min(100, GameState.abuse + 10);
    updateConveyorStats(); soundManager.playError();
    el.classList.add('prod-miss');
    setTimeout(() => { if(el.parentNode) el.parentNode.removeChild(el); }, 400);
    updateIndicators();
}

function updateConveyorStats() {
    const c = GameState.conveyorScore;
    ['correct','wrong','total'].forEach(k => {
        const el = document.getElementById('conv'+k.charAt(0).toUpperCase()+k.slice(1));
        if(el) el.textContent = c[k];
    });
}

// =============================================
// NIVEL 3 — FILTRO DE PRODUCTOS DAÑINOS
// =============================================
const FILTER_PRODUCTS = [
    { emoji:'🥦', name:'Brócoli Orgánico', safe:true,  hint:'🟢 Sin pesticidas. Certificado BPA-free.' },
    { emoji:'💉', name:'Vacuna Aprobada',   safe:true,  hint:'🟢 INVIMA aprobada. Estudios clínicos OK.' },
    { emoji:'🏠', name:'Pintura Eco',       safe:true,  hint:'🟢 Sin plomo ni benceno. Certificada.' },
    { emoji:'👕', name:'Ropa Algodón',      safe:true,  hint:'🟢 Sin colorantes tóxicos. Comercio justo.' },
    { emoji:'🧴', name:'Crema Solar FPS50', safe:true,  hint:'🟢 Dermatológicamente testeada.' },
    { emoji:'🧪', name:'Suplemento Milagroso', safe:false, hint:'🔴 Sin registro sanitario. Contiene mercurio.' },
    { emoji:'🔋', name:'Batería Sin Normas',   safe:false, hint:'🔴 Riesgo de explosión. Sin certificación.' },
    { emoji:'🍬', name:'Dulces con Plomo',     safe:false, hint:'🔴 Colorante prohibido. Neurotóxico infantil.' },
    { emoji:'💊', name:'Medicamento Pirata',   safe:false, hint:'🔴 Falsificado. Sin principio activo real.' },
    { emoji:'🫧', name:'Aceite Motor "Vegetal"',safe:false,hint:'🔴 Engaño grave: tóxico vendido como alimento.' },
];

function initFilterMinigame(level) {
    document.getElementById('instructions').textContent = '🔬 Inspecciona cada producto: ¿APROBAR o BLOQUEAR? Lee la descripción con cuidado';
    GameState.currentMinigame = 'filter';

    document.getElementById('gameControls').innerHTML = `
        <div class="filter-container">
            <div class="inspector-panel">
                <div class="inspector-title">🔬 INSPECTOR NACIONAL DE SEGURIDAD</div>
                <div class="filter-stats">
                    <span class="fstat">🚫 Bloqueados: <strong id="filtBlocked">0</strong></span>
                    <span class="fstat">✅ Aprobados: <strong id="filtPassed">0</strong></span>
                    <span class="fstat">📋 Revisados: <strong id="filtTotal">0</strong></span>
                </div>
            </div>
            <div class="filter-queue-area">
                <div class="filter-queue-label">Cola de inspección:</div>
                <div class="queue-items" id="queueItems"></div>
            </div>
            <div class="filter-current" id="filterCurrent">
                <div class="filter-idle">⏳ Esperando productos para inspeccionar...</div>
            </div>
            <div class="filter-timer-bar"><div class="filter-timer-fill" id="filterTimerFill" style="width:100%"></div></div>
            <div class="filter-buttons">
                <button class="filter-btn approve-btn" id="approveBtn" onclick="filterDecision('approve')" disabled>
                    <span class="fbtn-icon">✅</span><span class="fbtn-label">APROBAR</span><span class="fbtn-hint">Seguro para el mercado</span>
                </button>
                <button class="filter-btn block-btn" id="blockBtn" onclick="filterDecision('block')" disabled>
                    <span class="fbtn-icon">🚫</span><span class="fbtn-label">BLOQUEAR</span><span class="fbtn-hint">Producto peligroso</span>
                </button>
            </div>
        </div>`;

    // Start spawning products
    addToFilterQueue(); addToFilterQueue(); addToFilterQueue();
    setTimeout(showNextFilterProduct, 600);
    GameState.filterInterval = setInterval(() => {
        if (!GameState.isPaused && !GameState.isGameOver) addToFilterQueue();
    }, 4500);
}

function addToFilterQueue() {
    const queue = document.getElementById('queueItems');
    if (!queue) return;
    const p = FILTER_PRODUCTS[Math.floor(Math.random()*FILTER_PRODUCTS.length)];
    const item = document.createElement('div');
    item.className = 'queue-item';
    Object.assign(item.dataset, { safe: p.safe, name: p.name, hint: p.hint, emoji: p.emoji });
    item.innerHTML = `<span>${p.emoji}</span>`;
    queue.appendChild(item);
    if (!currentFilterProduct) setTimeout(showNextFilterProduct, 300);
}

function showNextFilterProduct() {
    if (currentFilterProduct || GameState.isGameOver || GameState.isPaused) return;
    const queue = document.getElementById('queueItems');
    if (!queue || !queue.children.length) return;
    const item = queue.children[0];
    queue.removeChild(item);
    currentFilterProduct = { safe: item.dataset.safe==='true', name: item.dataset.name, hint: item.dataset.hint, emoji: item.dataset.emoji };
    const area = document.getElementById('filterCurrent');
    if (!area) return;
    area.innerHTML = `
        <div class="filter-product-card ${currentFilterProduct.safe?'safe-product':'unsafe-product'}">
            <div class="fcard-emoji">${currentFilterProduct.emoji}</div>
            <div class="fcard-name">${currentFilterProduct.name}</div>
            <div class="fcard-hint">${currentFilterProduct.hint}</div>
        </div>`;
    document.getElementById('approveBtn').disabled = false;
    document.getElementById('blockBtn').disabled = false;
    let timeLeft = 100;
    const fill = document.getElementById('filterTimerFill');
    if (filterDecisionTimer) clearInterval(filterDecisionTimer);
    filterDecisionTimer = setInterval(() => {
        if (GameState.isPaused) return;
        timeLeft -= 2;
        if (fill) { fill.style.width = timeLeft+'%'; fill.style.background = timeLeft>50 ? '#06FFA5' : timeLeft>25 ? '#FFE66D' : '#FF006E'; }
        if (timeLeft <= 0) { clearInterval(filterDecisionTimer); autoFilterFail(); }
    }, 100);
}

function autoFilterFail() {
    if (!currentFilterProduct) return;
    GameState.filterScore.total++;
    GameState.abuse = Math.min(100, GameState.abuse + 12);
    soundManager.playAlarm(); showFloatingText('⏰ ¡Tiempo agotado!', '#FFE66D');
    updateFilterStats(); finishFilterDecision(false);
}

window.filterDecision = function(decision) {
    if (!currentFilterProduct || GameState.isGameOver) return;
    if (filterDecisionTimer) clearInterval(filterDecisionTimer);
    const p = currentFilterProduct;
    const correct = (decision==='block' && !p.safe) || (decision==='approve' && p.safe);
    GameState.filterScore.total++;
    if (correct) {
        if (decision==='block') { GameState.filterScore.blocked++; GameState.welfare=Math.min(100,GameState.welfare+14); GameState.abuse=Math.max(0,GameState.abuse-10); showFloatingText('🚫 Bloqueado! +14','#06FFA5'); }
        else { GameState.filterScore.passed++; GameState.welfare=Math.min(100,GameState.welfare+8); showFloatingText('✅ Aprobado! +8','#4ECDC4'); }
        addScore(200); addCombo(); soundManager.playSuccess();
    } else {
        GameState.abuse = Math.min(100, GameState.abuse + 20);
        GameState.welfare = Math.max(0, GameState.welfare - 10);
        soundManager.playError();
        showFloatingText(decision==='approve'?'⚠️ ¡Aprobaste un producto peligroso!':'⚠️ ¡Bloqueaste un producto seguro!', '#FF006E');
    }
    updateFilterStats(); finishFilterDecision(correct);
};

function finishFilterDecision(ok) {
    currentFilterProduct = null;
    document.getElementById('approveBtn').disabled = true;
    document.getElementById('blockBtn').disabled = true;
    const area = document.getElementById('filterCurrent');
    if (area) area.innerHTML = `<div class="filter-result ${ok?'result-ok':'result-fail'}">${ok?'✅ ¡Correcto!':'❌ ¡Error!'}</div>`;
    updateIndicators();
    setTimeout(showNextFilterProduct, 900);
}

function updateFilterStats() {
    const f = GameState.filterScore;
    const b=document.getElementById('filtBlocked'), p=document.getElementById('filtPassed'), t=document.getElementById('filtTotal');
    if(b) b.textContent=f.blocked; if(p) p.textContent=f.passed; if(t) t.textContent=f.total;
}

// =============================================
// NIVEL 4 — REDISTRIBUIDOR DE RIQUEZA
// =============================================
function initRedistributionMinigame(level) {
    document.getElementById('instructions').textContent = '💰 Reduce la desigualdad: ajusta impuestos y subsidios para bajar el Índice GINI a 50 o menos';
    GameState.currentMinigame = 'redistribution';
    GameState.giniIndex = 80;

    document.getElementById('gameControls').innerHTML = `
        <div class="redistribution-container">
            <div class="gini-display">
                <div class="gini-header">
                    <span class="gini-title">📊 COEFICIENTE GINI</span>
                    <span class="gini-big" id="giniValue">80</span>
                    <span class="gini-status" id="giniStatus">🔴 CRÍTICO</span>
                </div>
                <div class="gini-bar-wrap"><div class="gini-bar-bg"><div class="gini-bar-fill" id="giniBarFill" style="width:80%"></div></div><div class="gini-target-line">← Meta: 50</div></div>
                <div class="wealth-bars" id="wealthBars"></div>
                <div class="quintile-labels"><span>Q1 Pobres</span><span>Q2</span><span>Q3 Medio</span><span>Q4</span><span>Q5 Ricos</span></div>
            </div>
            <div class="redistrib-controls">
                <div class="control-valve">
                    <label class="valve-label">💸 IMPUESTO PROGRESIVO</label>
                    <div class="valve-row"><input type="range" id="progressiveTax" min="0" max="100" value="20" step="5"><span id="progressiveTaxValue" class="valve-value">20%</span></div>
                </div>
                <div class="control-valve">
                    <label class="valve-label">🏠 SUBSIDIO A POBRES</label>
                    <div class="valve-row"><input type="range" id="subsidyPoor" min="0" max="100" value="10" step="5"><span id="subsidyPoorValue" class="valve-value">10%</span></div>
                </div>
                <div class="control-valve">
                    <label class="valve-label">🎓 INVERSIÓN EDUCACIÓN</label>
                    <div class="valve-row"><input type="range" id="educationInvest" min="0" max="100" value="30" step="5"><span id="educationInvestValue" class="valve-value">30%</span></div>
                </div>
                <div class="control-valve">
                    <label class="valve-label">⚖️ REGULACIÓN SALARIAL</label>
                    <div class="valve-row"><input type="range" id="wageRegulation" min="0" max="100" value="25" step="5"><span id="wageRegulationValue" class="valve-value">25%</span></div>
                </div>
            </div>
            <div class="policy-effect-hint" id="policyEffectHint">🎛️ Mueve los controles para redistribuir la riqueza</div>
        </div>`;

    renderWealthBars();
    setupRedistribControls();

    GameState.redistributeInterval = setInterval(() => {
        if (GameState.isPaused || GameState.isGameOver) return;
        GameState.giniIndex = Math.min(85, GameState.giniIndex + 0.4);
        GameState.welfare = Math.max(0, GameState.welfare - 0.3);
        GameState.abuse = Math.min(100, GameState.abuse + 0.2);
        updateGiniDisplay(); updateIndicators();
    }, 1800);
}

function getWealthDist(gini) {
    const g = gini/100, rich = 20+g*60, rem = 100-rich;
    return [rem*0.13, rem*0.20, rem*0.27, rem*0.40, rich];
}

function renderWealthBars() {
    const el = document.getElementById('wealthBars'); if (!el) return;
    const dist = getWealthDist(GameState.giniIndex);
    const colors = ['#06FFA5','#4ECDC4','#FFE66D','#FF6B35','#FF006E'];
    el.innerHTML = dist.map((pct,i) => `
        <div class="wealth-bar-col">
            <div class="wealth-bar-fill" style="height:${Math.min(pct,100)}%;background:${colors[i]};box-shadow:0 0 10px ${colors[i]}88">
                <span class="wealth-bar-pct">${pct.toFixed(1)}%</span>
            </div>
        </div>`).join('');
}

function updateGiniDisplay() {
    const gv=document.getElementById('giniValue'), gs=document.getElementById('giniStatus'), gf=document.getElementById('giniBarFill');
    if(gv) gv.textContent = Math.round(GameState.giniIndex);
    if(gf) { gf.style.width=GameState.giniIndex+'%'; gf.style.background=GameState.giniIndex<50?'#06FFA5':GameState.giniIndex<65?'#FFE66D':'#FF006E'; }
    if(gs) { gs.textContent = GameState.giniIndex<30?'🟢 EQUITATIVO':GameState.giniIndex<50?'🟡 MODERADO':GameState.giniIndex<65?'🟠 ALTO':'🔴 CRÍTICO'; }
    renderWealthBars();
}

function setupRedistribControls() {
    const map = {
        progressiveTax:  v => { GameState.giniIndex=Math.max(0,GameState.giniIndex-v*0.5); GameState.justice=Math.min(100,GameState.justice+v*0.4); return v>50?'📉 Reduciendo concentración de riqueza':'⚠️ Impuesto bajo: poco efecto redistributivo'; },
        subsidyPoor:     v => { GameState.welfare=Math.min(100,GameState.welfare+v*0.9); GameState.giniIndex=Math.max(0,GameState.giniIndex-v*0.35); return v>50?'📈 Mejorando calidad de vida del Q1 y Q2':'⚠️ Subsidio insuficiente para el cambio'; },
        educationInvest: v => { GameState.welfare=Math.min(100,GameState.welfare+v*0.7); GameState.justice=Math.min(100,GameState.justice+v*0.5); return v>50?'🎓 Movilidad social en aumento':'📚 Más inversión = más movilidad a futuro'; },
        wageRegulation:  v => { GameState.abuse=Math.max(0,GameState.abuse-v*0.6); GameState.giniIndex=Math.max(0,GameState.giniIndex-v*0.3); return v>50?'⚖️ Brecha salarial reduciéndose':'💼 Regula más para impactar el Gini'; }
    };
    Object.keys(map).forEach(key => {
        const sl = document.getElementById(key); if (!sl) return;
        sl.addEventListener('input', e => {
            const v = parseInt(e.target.value)/100;
            document.getElementById(key+'Value').textContent = e.target.value+'%';
            soundManager.playValve();
            const hint = map[key](v);
            addCombo(); addScore(40);
            updateGiniDisplay(); updateIndicators();
            const he = document.getElementById('policyEffectHint');
            if (he) he.textContent = hint;
        });
    });
}

// =============================================
// NIVEL 5 — CIRCUITO ECONÓMICO
// =============================================
function initCircuitMinigame(level) {
    document.getElementById('instructions').textContent = '⚡ Conecta cada circuito económico para activar el sistema de crecimiento equilibrado';
    GameState.currentMinigame = 'circuit';
    const circuits = level.circuits || [];
    const labels = { taxes:'⚖️ Impuestos', publicServices:'🏥 Servicios Públicos', incentives:'🎁 Incentivos', innovation:'💡 Innovación', regulation:'📋 Regulación', fairCompetition:'🏆 Competencia Justa' };
    document.getElementById('gameControls').innerHTML = `
        <div class="circuit-container">
            <div class="circuit-title">🔌 PANEL DE CONEXIONES ECONÓMICAS</div>
            <div class="circuit-grid">
                ${circuits.map((c,i) => `
                    <div class="circuit-node" id="circNode_${i}">
                        <div class="circuit-from">${labels[c.from]||c.from}</div>
                        <div class="circuit-wire" id="wire_${i}"><div class="wire-line"></div><span class="wire-dot">○</span></div>
                        <div class="circuit-to">${labels[c.to]||c.to}</div>
                        <button class="circuit-btn" id="circBtn_${i}" onclick="connectCircuit(${i},'${c.resistance}')">⚡ CONECTAR</button>
                        <div class="resist-label">Resistencia: ${c.resistance==='low'?'🟢 Baja':c.resistance==='medium'?'🟡 Media':'🟠 Balanceada'}</div>
                    </div>`).join('')}
            </div>
            <div class="circuit-progress">
                <div class="circ-prog-bar"><div class="circ-prog-fill" id="circProgFill" style="width:0%"></div></div>
                <span id="circProgText">0 / ${circuits.length} conexiones</span>
            </div>
        </div>`;
}

window.connectCircuit = function(i, resistance) {
    const btn = document.getElementById(`circBtn_${i}`);
    const wire = document.getElementById(`wire_${i}`);
    const node = document.getElementById(`circNode_${i}`);
    if (!btn || btn.disabled) return;
    soundManager.playElectric();
    btn.disabled = true; btn.textContent = '✅ CONECTADO';
    btn.style.background = 'linear-gradient(135deg,#06FFA5,#4ECDC4)';
    if (wire) { wire.querySelector('.wire-line').style.cssText='background:#06FFA5;box-shadow:0 0 20px #06FFA5;'; wire.querySelector('.wire-dot').textContent='●'; wire.querySelector('.wire-dot').style.color='#06FFA5'; }
    if (node) node.classList.add('node-connected');
    const pts = resistance==='low'?300:resistance==='medium'?400:500;
    addScore(pts); addCombo();
    GameState.welfare = Math.min(100, GameState.welfare + (resistance==='balanced'?22:16));
    GameState.justice = Math.min(100, GameState.justice + 12);
    GameState.abuse = Math.max(0, GameState.abuse - 6);
    updateIndicators(); showFloatingText(`⚡ +${pts} pts`, '#FFE66D');
    const allBtns = document.querySelectorAll('.circuit-btn');
    const connected = [...allBtns].filter(b=>b.disabled).length;
    const fill = document.getElementById('circProgFill'), text = document.getElementById('circProgText');
    if (fill) fill.style.width = (connected/allBtns.length*100)+'%';
    if (text) text.textContent = `${connected} / ${allBtns.length} conexiones`;
    if (connected === allBtns.length) { document.getElementById('instructions').textContent = '⚡ ¡Sistema completo! Aguarda el fin del temporizador.'; soundManager.playVictory(); }
};

// ============ GAME LOOP ============
function startGameLoop() {
    if (GameState.animationFrameId) cancelAnimationFrame(GameState.animationFrameId);
    gameLoop();
}
function gameLoop() {
    if (!GameState.isPaused && !GameState.isGameOver) { updatePhysics(); renderCanvas(); updateComboDecay(); checkLevelConditions(); }
    GameState.animationFrameId = requestAnimationFrame(gameLoop);
}
function updatePhysics() {
    if (GameState.currentMinigame !== 'hydraulic') return;
    GameState.particles.forEach(p => {
        p.vy += 0.3; p.x += p.vx; p.y += p.vy;
        if (p.x<p.radius||p.x>canvasWidth-p.radius) { p.vx*=-0.8; p.x=Math.max(p.radius,Math.min(canvasWidth-p.radius,p.x)); }
        if (p.y > canvasHeight-100) {
            if (Math.random()<0.1) { if(p.type==='welfare') GameState.welfare=Math.min(100,GameState.welfare+0.5); else GameState.abuse=Math.min(100,GameState.abuse+0.3); updateIndicators(); }
            p.y=-50; p.x=Math.random()*canvasWidth; p.vy=2;
        }
    });
}
function renderCanvas() {
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    GameState.particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
        ctx.fillStyle=p.color; ctx.shadowBlur=15; ctx.shadowColor=p.color; ctx.fill(); ctx.shadowBlur=0;
    });
}

// ============ TIMER ============
function startLevelTimer(level) {
    if (GameState.levelTimer) clearInterval(GameState.levelTimer);
    const footer = document.querySelector('.game-footer');
    let timerEl = document.getElementById('timerDisplay');
    if (!timerEl && footer) { timerEl = document.createElement('div'); timerEl.id='timerDisplay'; timerEl.className='timer-display'; footer.appendChild(timerEl); }
    if (timerEl) timerEl.textContent = `⏱️ ${GameState.timeRemaining}s`;
    GameState.levelTimer = setInterval(() => {
        if (GameState.isPaused) return;
        GameState.timeRemaining--;
        const te = document.getElementById('timerDisplay');
        if (te) { te.textContent=`⏱️ ${GameState.timeRemaining}s`; if(GameState.timeRemaining<=10){te.style.color='#FF006E';if(GameState.timeRemaining%2===0)soundManager.playAlarm();} }
        if (GameState.timeRemaining<=0) { clearInterval(GameState.levelTimer); checkLevelCompletion(level); }
    }, 1000);
}

// ============ INDICADORES ============
function updateIndicators() {
    const w=document.getElementById('welfareFluid'), wv=document.getElementById('welfareValue');
    const a=document.getElementById('abuseFluid'), av=document.getElementById('abuseValue');
    const pb=document.getElementById('pressureBar'), jb=document.getElementById('justiceBar');
    if(w) w.style.height=GameState.welfare+'%'; if(wv) wv.textContent=Math.round(GameState.welfare);
    if(a) a.style.height=GameState.abuse+'%'; if(av) av.textContent=Math.round(GameState.abuse);
    if(pb) pb.style.width=GameState.pressure+'%'; if(jb) jb.style.width=GameState.justice+'%';
}

// ============ SCORING ============
function addScore(points) {
    const mult = GAME_DATA.scoring.comboMultipliers[Math.min(GameState.combo, GAME_DATA.scoring.comboMultipliers.length-1)];
    GameState.score += Math.round(points*mult);
    const sv = document.getElementById('scoreValue');
    if(sv) { sv.textContent=GameState.score; sv.style.transform='scale(1.2)'; setTimeout(()=>sv.style.transform='scale(1)',200); }
}
function addCombo() {
    GameState.combo++; GameState.maxCombo=Math.max(GameState.maxCombo,GameState.combo);
    GameState.lastComboTime=Date.now();
    const idx=Math.min(GameState.combo-1,GAME_DATA.scoring.comboMultipliers.length-1);
    const cf=document.getElementById('comboFill'), cm=document.getElementById('comboMultiplier');
    if(cf) cf.style.width=(idx/(GAME_DATA.scoring.comboMultipliers.length-1)*100)+'%';
    if(cm) cm.textContent='×'+GAME_DATA.scoring.comboMultipliers[idx];
    if(GameState.combo>1) soundManager.playCombo(GameState.combo);
}
function updateComboDecay() { if(Date.now()-GameState.lastComboTime>GAME_DATA.scoring.comboDecayTime) resetCombo(); }
function resetCombo() {
    GameState.combo=0;
    const cf=document.getElementById('comboFill'), cm=document.getElementById('comboMultiplier');
    if(cf) cf.style.width='0%'; if(cm) cm.textContent='×1';
}

// ============ FLOATING TEXT ============
function showFloatingText(text, color) {
    const el=document.createElement('div');
    el.style.cssText=`position:fixed;z-index:9999;pointer-events:none;font-family:'Bungee',cursive;font-size:1.3rem;color:${color};text-shadow:0 0 10px ${color};top:38%;left:50%;transform:translateX(-50%);animation:floatUp 1.5s ease-out forwards;`;
    el.textContent=text; document.body.appendChild(el);
    setTimeout(()=>{ if(el.parentNode) document.body.removeChild(el); },1500);
}

// ============ LEVEL CONDITIONS ============
function checkLevelConditions() {
    const level = GAME_DATA.levels[GameState.currentLevel-1]; if(!level) return;
    if(GameState.abuse>=level.maxAbuse+10) { failLevel('El ABUSO EMPRESARIAL se desbordó'); return; }
    if(GameState.welfare<5 && GameState.timeRemaining<level.duration*0.4) failLevel('El BIENESTAR SOCIAL está en colapso total');
}

function checkLevelCompletion(level) {
    console.log(`📊 Nivel ${GameState.currentLevel}: Bienestar=${Math.round(GameState.welfare)}% (req:${level.targetWelfare}%) | Abuso=${Math.round(GameState.abuse)}% (max:${level.maxAbuse}%)`);
    if (GameState.currentMinigame==='redistribution' && GameState.giniIndex>50) {
        failLevel(`Desigualdad todavía crítica (Gini: ${Math.round(GameState.giniIndex)}). Meta: ≤50. Ajusta más las políticas.`);
        return;
    }
    const okW=GameState.welfare>=level.targetWelfare, okA=GameState.abuse<=level.maxAbuse;
    if (okW && okA) completeLevel();
    else failLevel(!okW?`Bienestar insuficiente: ${Math.round(GameState.welfare)}% (necesitas ${level.targetWelfare}%).`:`Abuso demasiado alto: ${Math.round(GameState.abuse)}% (máximo ${level.maxAbuse}%).`);
}

function completeLevel() {
    [GameState.conveyorInterval, GameState.filterInterval, GameState.redistributeInterval, filterDecisionTimer].forEach(t => { if(t) clearInterval(t); });
    GameState.conveyorInterval=GameState.filterInterval=GameState.redistributeInterval=filterDecisionTimer=null;
    clearInterval(GameState.levelTimer); GameState.isPaused=true;
    const level=GAME_DATA.levels[GameState.currentLevel-1];
    const bonus=Math.max(0,GameState.welfare-level.targetWelfare)*GAME_DATA.scoring.bonusWelfare + Math.max(0,level.maxAbuse-GameState.abuse)*GAME_DATA.scoring.bonusWelfare;
    const elapsed=(Date.now()-GameState.levelStartTime)/1000, tp=elapsed/level.duration;
    const speedBonus = tp<0.5?GAME_DATA.scoring.speedBonus.fast:tp<0.75?GAME_DATA.scoring.speedBonus.medium:0;
    const lp=Math.round(bonus+speedBonus); addScore(lp); soundManager.playVictory();
    document.getElementById('levelPoints').textContent=lp;
    document.getElementById('maxCombo').textContent='×'+GameState.maxCombo;
    document.getElementById('finalWelfare').textContent=Math.round(GameState.welfare)+'%';
    const msgs=level.supervisorMessages;
    document.getElementById('supervisorMessage').textContent=msgs[Math.floor(Math.random()*msgs.length)];
    const stars=document.getElementById('starsContainer'); stars.innerHTML='';
    const sc=GameState.welfare>=90?3:GameState.welfare>=75?2:1;
    for(let i=0;i<sc;i++) stars.innerHTML+=`<span style="font-size:3rem;animation:bounceIn 0.5s ${i*0.2}s both;">⭐</span>`;
    document.getElementById('levelCompleteScreen').classList.add('active');
    leaderboardManager.saveScore(GameState.playerName, GameState.score, GameState.currentLevel);
}

function failLevel(reason) {
    [GameState.conveyorInterval, GameState.filterInterval, GameState.redistributeInterval, filterDecisionTimer].forEach(t => { if(t) clearInterval(t); });
    GameState.conveyorInterval=GameState.filterInterval=GameState.redistributeInterval=filterDecisionTimer=null;
    clearInterval(GameState.levelTimer); GameState.isGameOver=true;
    soundManager.playDefeat(); soundManager.stopAmbient();
    document.getElementById('gameOverReason').textContent=reason;
    document.getElementById('finalScore').textContent=GameState.score;
    leaderboardManager.saveScore(GameState.playerName,GameState.score,GameState.currentLevel);
    document.getElementById('gameOverScreen').classList.add('active');
}

function nextLevel() {
    document.getElementById('levelCompleteScreen').classList.remove('active');
    GameState.isPaused=false; GameState.isGameOver=false; GameState.particles=[];
    document.getElementById('gameControls').innerHTML='';
    currentFilterProduct=null; draggedProduct=null; touchDragProduct=null;
    const te=document.getElementById('timerDisplay'); if(te) te.remove();
    startLevel(GameState.currentLevel+1);
}

function gameComplete() {
    leaderboardManager.saveScore(GameState.playerName,GameState.score,GameState.currentLevel);
    document.getElementById('gameOverScreen').classList.add('active');
    const t=document.querySelector('.gameover-title'); if(t){t.textContent='🏆 ¡MISIÓN COMPLETADA!';t.style.color='#06FFA5';}
    const ic=document.querySelector('.gameover-icon'); if(ic) ic.textContent='🎖️';
    document.getElementById('gameOverReason').textContent='¡Completaste todos los niveles! Eres INGENIERO MAESTRO de la Fábrica de Bienestar.';
    document.getElementById('finalScore').textContent=GameState.score;
}

function pauseGame() { GameState.isPaused=true; document.getElementById('pauseLevel').textContent=GameState.currentLevel; document.getElementById('pauseScore').textContent=GameState.score; document.getElementById('pauseScreen').classList.add('active'); soundManager.playClick(); }
function resumeGame() { GameState.isPaused=false; document.getElementById('pauseScreen').classList.remove('active'); soundManager.playClick(); }

async function showLeaderboard() {
    document.getElementById('leaderboardScreen').classList.add('active');
    const list=document.getElementById('leaderboardList');
    list.innerHTML='<div class="loading-spinner">Cargando rankings...</div>';
    try {
        const scores=await leaderboardManager.getLeaderboard();
        const formatted=leaderboardManager.formatLeaderboard(scores,15);
        if(!formatted.length){list.innerHTML='<p style="padding:40px;opacity:0.6;">No hay puntuaciones aún</p>';return;}
        list.innerHTML=formatted.map(e=>`<div class="leaderboard-entry" style="display:flex;justify-content:space-between;align-items:center;padding:15px 20px;background:rgba(255,255,255,0.05);margin:10px 0;border-radius:10px;border-left:4px solid ${e.rank<=3?'#FFE66D':'#4ECDC4'};"><span style="font-size:1.5rem;min-width:50px;">${e.medal}</span><span style="flex:1;font-weight:600;">${e.name}</span><span style="color:#06FFA5;font-family:Bungee;font-size:1.2rem;">${e.score}</span><span style="opacity:0.6;min-width:80px;text-align:right;">Nv.${e.level}</span></div>`).join('');
    } catch(err) { list.innerHTML='<p style="padding:40px;color:#FF6B35;">Error cargando ranking</p>'; }
}
function hideLeaderboard() { document.getElementById('leaderboardScreen').classList.remove('active'); }

// Inject floatUp animation
const _s=document.createElement('style');
_s.textContent='@keyframes floatUp{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-80px)}}';
document.head.appendChild(_s);
