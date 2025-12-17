// Main Controller & UI Logic
import { TEAMS_DB, FORMATIONS, CONFIG } from './data.js';
import * as Game from './game.js';

// DEBUG: Add global click listener
document.addEventListener('click', (e) => {
    console.log('Click detected on:', e.target, e.target.classList);
    if(e.target.classList && e.target.classList.contains('main-opt-btn')) {
        console.log('MENU BUTTON CLICKED');
    }
});

let appState = {
    gameMode: 'match', // 'match' or 'training'
    selHomeIdx: 0,
    selAwayIdx: 2,
    currentTrainingMode: 'freeKick' // Default
};

// --- INITIALIZATION ---
window.addEventListener('load', () => {
    console.log('Page loaded, setting up navigation...');
    setupNavigation();
    setupGameLinkage();
    updateTeamUI();
    
    // Start at Main Menu
    showScreen('screen-main');
    console.log('Main menu displayed');
});

// --- NAVIGATION CONTROLLER ---
function setupNavigation() {
    
    // 1. Main Menu -> Mode Selection (Using Event Delegation)
    document.addEventListener('click', (e) => {
        if(e.target.classList.contains('main-opt-btn') || e.target.closest('.main-opt-btn')) {
            const btn = e.target.classList.contains('main-opt-btn') ? e.target : e.target.closest('.main-opt-btn');
            console.log(`Menu button clicked: ${btn.dataset.action}`);
            const action = btn.dataset.action;
            if(action === 'mode-match') {
                appState.gameMode = 'match';
                showScreen('screen-teams');
            } else if(action === 'mode-training') {
                appState.gameMode = 'training';
                showScreen('screen-teams');
            }
        }
    });

    // 2. Team Select -> Tactics
    document.getElementById('btn-prev-home').onclick = () => changeTeam('home', -1);
    document.getElementById('btn-next-home').onclick = () => changeTeam('home', 1);
    document.getElementById('btn-prev-away').onclick = () => changeTeam('away', -1);
    document.getElementById('btn-next-away').onclick = () => changeTeam('away', 1);
    
    document.getElementById('btn-to-tactics').onclick = () => {
        showScreen('screen-tactics');
        // Auto-render pitch when entering screen
        setTimeout(updatePitchViz, 100);
    };

    // 3. Tactics -> Match Settings
    document.getElementById('formation-select').onchange = updatePitchViz;
    document.getElementById('btn-to-settings').onclick = () => {
        prepareSettingsScreen();
        showScreen('screen-settings');
    };

    // 4. Match Settings -> Start Game
    document.getElementById('btn-start-game').onclick = () => startGame();

    // Global "Back" Buttons
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.onclick = () => showScreen(btn.dataset.target);
    });

    // Pause Menu
    document.getElementById('btn-resume').onclick = () => Game.togglePause();
    
    document.getElementById('btn-restart').onclick = () => {
        Game.quitToMenu(); // Clean up old game
        document.getElementById('pause-menu').style.display = 'none';
        startGame(); // Start fresh with same settings
    };

    document.getElementById('btn-quit').onclick = () => {
        Game.quitToMenu();
        showScreen('screen-main');
    };
    
    // TRAINING CONTROLS (NEW)
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Toggle
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Logic
            appState.currentTrainingMode = btn.dataset.mode;
            Game.setTrainingScenario(appState.currentTrainingMode, 'center');
        });
    });

    document.querySelectorAll('.place-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const loc = btn.dataset.loc;
            Game.setTrainingScenario(appState.currentTrainingMode, loc);
        });
    });
}

// --- SCREEN MANAGER ---
function showScreen(id) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    document.getElementById('ui-layer').style.display = 'none';
    document.getElementById('pause-menu').style.display = 'none';

    // Show target
    const target = document.getElementById(id);
    if(target) {
        target.style.display = 'flex';
        // Small delay for fade-in effect if CSS transition exists
        setTimeout(() => target.classList.add('active'), 10);
    }
}

// --- UI HELPERS ---
function changeTeam(side, dir) {
    if(side === 'home') appState.selHomeIdx = (appState.selHomeIdx + dir + TEAMS_DB.length) % TEAMS_DB.length;
    else appState.selAwayIdx = (appState.selAwayIdx + dir + TEAMS_DB.length) % TEAMS_DB.length;
    updateTeamUI();
}

function updateTeamUI() {
    const h = TEAMS_DB[appState.selHomeIdx];
    const a = TEAMS_DB[appState.selAwayIdx];
    
    // Render Home
    const homeNameEl = document.getElementById('sel-home-name');
    if(homeNameEl) {
        homeNameEl.innerText = h.name;
        document.getElementById('sel-home-logo').innerText = h.logo;
        document.getElementById('home-att').innerText = h.att;
        document.getElementById('home-mid').innerText = h.mid;
        document.getElementById('home-def').innerText = h.def;
        document.querySelector('.team-card.home').style.borderTopColor = h.color;
        
        // Render Away
        document.getElementById('sel-away-name').innerText = a.name;
        document.getElementById('sel-away-logo').innerText = a.logo;
        document.getElementById('away-att').innerText = a.att;
        document.getElementById('away-mid').innerText = a.mid;
        document.getElementById('away-def').innerText = a.def;
        document.querySelector('.team-card.away').style.borderTopColor = a.color;
    }
}

function updatePitchViz() {
    const container = document.getElementById('pitch-viz');
    if(!container) return;
    container.innerHTML = '';
    const formKey = document.getElementById('formation-select').value;
    const form = FORMATIONS[formKey];
    const team = TEAMS_DB[appState.selHomeIdx];

    const mapX = (x) => 50 + (x/CONFIG.FIELD_W)*80; // %
    const mapY = (z) => 50 - (z/CONFIG.FIELD_L)*80; // %

    const createDot = (x, z, name, rating) => {
        const d = document.createElement('div');
        d.className = 'pitch-player';
        d.style.left = mapX(x) + '%';
        d.style.top = mapY(z) + '%';
        d.innerHTML = `<div class="pp-dot"></div><div class="pp-name">${name}</div><div class="pp-rating">${rating}</div>`;
        container.appendChild(d);
    };

    createDot(0, 45, team.roster[0], team.def); // GK
    for(let i=0; i<4; i++) {
        const pos = form[i+1];
        createDot(pos[0], pos[1], team.roster[i+1], i<2?team.def : (i<3?team.mid:team.att));
    }
}

function prepareSettingsScreen() {
    // Show/Hide Training options based on mode
    const trRow = document.getElementById('row-training-type');
    if(appState.gameMode === 'training') {
        trRow.style.display = 'flex';
        document.querySelector('#screen-settings h1 span').innerText = "TRAINING";
    } else {
        trRow.style.display = 'none';
        document.querySelector('#screen-settings h1 span').innerText = "SETUP";
    }
}

// --- GAME LAUNCHER ---

function getVal(id, def) { const el = document.getElementById(id); return el ? el.value : def; }

function startGame() {
    // 1. Collect Data
    const settings = {
        time: getVal('time-select', 'day'), 
        weather: getVal('weather-select', 'clear'),
        speed: parseFloat(getVal('speed-select', '1.0')), 
        ai: parseFloat(getVal('diff-select', '1.0')),
        camera: getVal('cam-select', 'broadcast')
    };
    
    const teamsData = {
        mode: appState.gameMode,
        type: getVal('training-mode', 'free'),
        formation: document.getElementById('formation-select').value,
        home: { index: appState.selHomeIdx, data: TEAMS_DB[appState.selHomeIdx] },
        away: { index: appState.selAwayIdx, data: TEAMS_DB[appState.selAwayIdx] }
    };

    // 2. Hide Menus
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active'); 
        el.style.display = 'none';
    });
    
    // 3. Show HUD & Init
    document.getElementById('ui-layer').style.display = 'block';
    
    // Call Game Engine with callbacks
    Game.setUICallbacks({
        onScoreUpdate: (h, a) => { 
            const sh = document.getElementById('score-home'); if(sh) sh.innerText = h; 
            const sa = document.getElementById('score-away'); if(sa) sa.innerText = a; 
        },
        onMessage: showMessage,
        onSetPiece: (type) => {
            const el = document.getElementById('set-piece-indicator');
            if(type) { el.innerText = type.toUpperCase(); el.style.display = 'block'; } 
            else { el.style.display = 'none'; }
        },
        onSetPieceMenu: (show) => {
            document.getElementById('ball-placer').style.display = show ? 'block' : 'none';
        },
        onHUDUpdate: updateHUD
    });
    
    Game.initGame('game-container', settings, teamsData);
    
    if(appState.gameMode === 'match') showMessage("KICK OFF!");
    else showMessage("TRAINING START");
}

function setupGameLinkage() {
    try {
        if(Game && Game.resizeGame) {
            window.addEventListener('resize', Game.resizeGame);
        }
    } catch(e) {
        console.error('Error setting up game linkage:', e);
        return;
    }
    
    const inputs = { up:0, down:0, left:0, right:0, sprint:0, shoot:0, pass:0, through:0, switch:0 };
    const onKey = (e, down) => {
        const k = e.code; const v = down ? 1 : 0;
        if(k==='ShiftLeft') inputs.sprint=v; 
        if(k==='KeyQ') inputs.switch=v;
        if(k==='ArrowUp') inputs.up=v; if(k==='ArrowDown') inputs.down=v; 
        if(k==='ArrowLeft') inputs.left=v; if(k==='ArrowRight') inputs.right=v;
        if(k==='KeyD'||k==='Space') inputs.shoot=v; 
        if(k==='KeyS') inputs.pass=v; 
        if(k==='KeyW') inputs.through=v;
        if(k==='Escape' && down && Game && Game.togglePause) Game.togglePause();
        
        if(Game && Game.setInputs) Game.setInputs(inputs);
    };
    document.addEventListener('keydown', e => onKey(e, true));
    document.addEventListener('keyup', e => onKey(e, false));
}

// --- HUD HELPERS ---
function showMessage(msg, time) {
    const el = document.getElementById('comm-text'); 
    if(!el) return;
    el.innerText = msg; el.classList.add('active');
    if(time) setTimeout(()=>el.classList.remove('active'), time); 
    else setTimeout(()=>el.classList.remove('active'), 1500);
}

function updateHUD(gameState, teams, ball) {
    if(!gameState || !teams || !ball) return; // Safety check

    // Score & Colors
    const sh = document.getElementById('score-home'); if(sh) sh.innerText = gameState.homeScore;
    const sa = document.getElementById('score-away'); if(sa) sa.innerText = gameState.awayScore;
    
    if(TEAMS_DB[appState.selHomeIdx]) {
        const strip = document.getElementById('strip-home');
        if(strip) strip.style.background = TEAMS_DB[appState.selHomeIdx].color;
    }
    if(TEAMS_DB[appState.selAwayIdx]) {
        const strip = document.getElementById('strip-away');
        if(strip) strip.style.background = TEAMS_DB[appState.selAwayIdx].color;
    }
    
    // Timer
    const timer = document.getElementById('timer');
    if(timer) {
        const m = Math.floor(gameState.timeRemaining / 60); 
        const s = Math.floor(gameState.timeRemaining % 60);
        timer.innerText = gameState.gameMode === 'match' ? `${m}:${s<10?'0':''}${s}` : 'DRILL';
    }
    
    // Stamina
    const stamina = document.getElementById('stamina-fill');
    if(stamina) stamina.style.width = gameState.playerStamina + '%';

    // Power
    const pFill = document.getElementById('power-fill');
    if(pFill) {
        if(gameState.isCharging) { 
            pFill.style.width = (gameState.shotCharge * 100) + '%'; 
            pFill.parentElement.style.opacity = 1; 
        } else { 
            pFill.style.width = '0%'; 
            pFill.parentElement.style.opacity = 0.5; 
        }
    }

    // Minimap
    const cvs = document.getElementById('minimap-canvas');
    if(cvs) {
        const ctx = cvs.getContext('2d');
        ctx.clearRect(0,0,300,150);
        const mx = (x) => (x/CONFIG.FIELD_W + 0.5) * 300; 
        const my = (z) => (z/CONFIG.FIELD_L + 0.5) * 150;
        const dot = (p,c) => { 
            ctx.fillStyle=c; ctx.beginPath(); 
            ctx.arc(mx(p.position.x), my(p.position.z), 4, 0, 7); 
            ctx.fill(); 
        };
        teams.home.forEach(p => dot(p, TEAMS_DB[appState.selHomeIdx].color));
        teams.away.forEach(p => dot(p, TEAMS_DB[appState.selAwayIdx].color));
        dot(ball, '#fff');
    }
}