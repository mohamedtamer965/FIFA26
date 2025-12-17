// The Core 3D Game Engine (Three.js Logic)
import { CONFIG, FORMATIONS } from './data.js';
import { Animator } from './animator.js';
import { AI } from './ai.js'; // IMPORT NEW AI SYSTEM
import { ProceduralModelGenerator } from './loaders/proceduralModels.js';

let scene, camera, renderer, clock, audioCtx;
let ball, players = [], aimReticle, particles = [], weatherParticles = [], crowdPoints;
let teams = { home: [], away: [] };

// Camera Physics Vars
let camVelocity = new THREE.Vector3();
let camTargetPos = new THREE.Vector3();

// Game State
export const gameState = {
    activePlayer: null, ballOwner: null, lastToucher: null,
    homeScore: 0, awayScore: 0,
    isPlaying: false, matchState: 'menu', isPaused: false,
    timeRemaining: 300, gameSpeed: 1.0, aiDiff: 1.0,
    playerStamina: 100, shotCharge: 0, isCharging: false,
    shake: 0, slowMoTimer: 0, weather: 'clear',
    gameMode: 'match',
    selHomeIdx: 0, selAwayIdx: 2,
    cameraMode: 'broadcast' // NEW
};

let inputs = { up:0, down:0, left:0, right:0, sprint:0, shoot:0, pass:0, through:0, switch:0 };
let camOffset = { x:0, y:50, z:70 };
let baseCamOffset = { x:0, y:50, z:70 };
let uiCallbacks = {}; 

// Assets
let sharedParticleGeo, sharedParticleMat;

export function setInputs(newInputs) {
    inputs = { ...inputs, ...newInputs };
}

export function setUICallbacks(callbacks) {
    uiCallbacks = callbacks;
}

export function initGame(containerId, settings, teamsData) {
    try {
        const container = document.getElementById(containerId); 
        if(!container) throw new Error("Game container not found");
        container.innerHTML = '';

        clock = new THREE.Clock();
        scene = new THREE.Scene();
        
        // --- ASSETS ---
        if(!sharedParticleGeo) {
            sharedParticleGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
            sharedParticleMat = new THREE.MeshBasicMaterial({color: 0x4caf50, transparent: true});
        }

        // --- ENVIRONMENT ---
        const isNight = settings.time === 'night';
        const skyCol = isNight ? 0x050510 : (settings.weather === 'rain' ? 0x556677 : 0x87CEEB);
        scene.background = new THREE.Color(skyCol);
        scene.fog = new THREE.FogExp2(skyCol, isNight || settings.weather !== 'clear' ? 0.008 : 0.002);

        // SAVE CAMERA MODE
        gameState.cameraMode = settings.camera;

        camera = new THREE.PerspectiveCamera(35, window.innerWidth/window.innerHeight, 1, 1000);
        
        if(settings.camera === 'topdown') baseCamOffset = {x:0, y:90, z:10}; 
        else if(settings.camera === 'dynamic') baseCamOffset = {x:0, y:30, z:40}; 
        else baseCamOffset = {x:0, y:50, z:70};
        camOffset = {...baseCamOffset};
        
        // Initialize Camera Position and Target
        camera.position.set(0, camOffset.y, camOffset.z); 
        camera.lookAt(0,0,0);
        camTargetPos.copy(camera.position);

        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        container.appendChild(renderer.domElement);

        // Lights
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, settings.weather === 'rain' ? 0.4 : 0.6);
        scene.add(hemiLight);
        const sun = new THREE.DirectionalLight(0xffffff, isNight ? 0.4 : 1.2);
        sun.position.set(50, 80, 50); sun.castShadow = true;
        sun.shadow.mapSize.width = 2048; sun.shadow.mapSize.height = 2048;
        scene.add(sun);

        if(isNight) {
            const flood1 = new THREE.SpotLight(0xffffff, 1.5); flood1.position.set(-40, 60, -50); flood1.angle = 0.8; flood1.penumbra = 0.5; scene.add(flood1);
            const flood2 = new THREE.SpotLight(0xffffff, 1.5); flood2.position.set(40, 60, 50); flood2.angle = 0.8; flood2.penumbra = 0.5; scene.add(flood2);
        }

        // --- ASSET CREATION CALLS ---
        createStadium(isNight); 
        createPitch(); 
        createGoals(); 
        createCrowd(isNight);
        
        // --- ENTITIES ---
        // Use enhanced 3D soccer ball
        ball = ProceduralModelGenerator.createSoccerBall(CONFIG.BALL_RAD);
        ball.position.y = CONFIG.BALL_RAD;
        ball.userData = { vel: new THREE.Vector3(), onGround: true };
        scene.add(ball);

        aimReticle = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.6, 32), new THREE.MeshBasicMaterial({ color: 0xffff00, transparent:true, opacity:0.8 }));
        aimReticle.rotation.x = -Math.PI/2; aimReticle.visible=false; scene.add(aimReticle);

        players = []; teams.home = []; teams.away = [];
        const { home, away, formation, mode } = teamsData;
        gameState.gameMode = mode;
        gameState.selHomeIdx = home.index;
        gameState.selAwayIdx = away.index;

        if (mode === 'training') {
            spawnPlayer(0, 30, true, home.data, false, 0); // User
            spawnPlayer(0, -48, false, away.data, true, 0); // GK
            gameState.activePlayer = teams.home[0];
        } else {
            const formCoords = FORMATIONS[formation];
            formCoords.forEach((p, i) => spawnPlayer(p[0], p[1], true, home.data, i===0, i));
            formCoords.forEach((p, i) => spawnPlayer(p[0], -p[1], false, away.data, i===0, i));
            gameState.activePlayer = teams.home[4]; 
        }
        
        gameState.weather = settings.weather;
        gameState.gameSpeed = settings.speed;
        gameState.aiDiff = settings.ai;
        gameState.isPlaying = true;
        gameState.matchState = (mode === 'match') ? 'entrance' : 'kickoff';
        gameState.timeRemaining = 300; // 5 mins

        if(gameState.weather !== 'clear') createWeather(gameState.weather);
        
        if(teamsData.type === 'setpiece' && mode === 'training') {
            setSetPiece('freeKick', new THREE.Vector3(0, 0, 30));
            if(uiCallbacks.onSetPieceMenu) uiCallbacks.onSetPieceMenu(true);
        } else {
            if(uiCallbacks.onSetPieceMenu) uiCallbacks.onSetPieceMenu(false);
        }

        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
        
        requestAnimationFrame(loop);

    } catch (e) {
        console.error("Init Error", e);
        alert("Error starting game: " + e.message);
    }
}

function loop() {
    if(!gameState.isPlaying) return;
    if(gameState.isPaused) { requestAnimationFrame(loop); return; }

    const realDt = Math.min(clock.getDelta(), 0.1); // Cap dt
    let dt = realDt * gameState.gameSpeed;
    if(gameState.slowMoTimer > 0) { dt *= 0.2; gameState.slowMoTimer -= realDt; }

    try {
        if(gameState.matchState === 'entrance') updateEntrance(dt);
        else { 
            updatePhysics(dt);
            updateAllAI(dt); // UPDATED
            updatePlayerInput(dt);
        }
        updateEffects(dt); 
        updateCameraPosition(dt); // UPDATED
        
        if(uiCallbacks.onHUDUpdate) uiCallbacks.onHUDUpdate(gameState, teams, ball);

        renderer.render(scene, camera);
    } catch (err) { 
        console.error("Loop Error", err); 
        gameState.isPlaying = false; 
    }
    requestAnimationFrame(loop);
}

// --- NEW PHYSICS & LOGIC ---

function updatePhysics(dt) {
    // 1. Apply Velocity & Gravity
    ball.position.add(ball.userData.vel.clone().multiplyScalar(dt));
    ball.userData.vel.multiplyScalar(CONFIG.FRICTION); // Air/Ground resistance
    
    // Gravity
    if (ball.position.y > CONFIG.BALL_RAD) {
        ball.userData.vel.y -= CONFIG.GRAVITY * dt;
        ball.userData.onGround = false;
    } else {
        ball.position.y = CONFIG.BALL_RAD;
        if (Math.abs(ball.userData.vel.y) > 1.0) {
            ball.userData.vel.y *= -CONFIG.BOUNCE; // Bounce
            playSound('kick');
        } else {
            ball.userData.vel.y = 0;
            ball.userData.onGround = true;
        }
    }

    // Ball Rotation
    if (ball.userData.onGround) {
        ball.rotation.x += ball.userData.vel.z * dt * 2;
        ball.rotation.z -= ball.userData.vel.x * dt * 2;
    }

    // 2. Constraints (Field Bounds & Goals)
    const inGoalZ = Math.abs(ball.position.z) > CONFIG.FIELD_L/2;
    const inGoalX = Math.abs(ball.position.x) < CONFIG.GOAL_W/2;
    const inGoalH = ball.position.y < CONFIG.GOAL_H;

    // Check Goal Post Collisions (New Feature)
    checkGoalPostCollision();

    if (inGoalZ && inGoalX && inGoalH) {
        // Inside goal - Check Back of Net
        const goalDepth = CONFIG.GOAL_DEPTH || 2.5;
        if(Math.abs(ball.position.z) > CONFIG.FIELD_L/2 + goalDepth) {
            ball.position.z = Math.sign(ball.position.z) * (CONFIG.FIELD_L/2 + goalDepth - 0.2);
            ball.userData.vel.z *= -0.5;
        }
        // Check Side Net
        if(Math.abs(ball.position.x) > CONFIG.GOAL_W/2 - 0.2) {
            ball.position.x = Math.sign(ball.position.x) * (CONFIG.GOAL_W/2 - 0.2);
            ball.userData.vel.x *= -0.5;
        }
        
        // Goal Logic
        if(gameState.matchState === 'playing') handleGoal(ball.position.z > 0 ? 'away' : 'home');
    } 
    else {
        // Standard Field Bounds
        if (gameState.matchState === 'playing') {
            if (Math.abs(ball.position.x) > CONFIG.FIELD_W/2) setSetPiece('throwIn', ball.position.clone());
            if (Math.abs(ball.position.z) > CONFIG.FIELD_L/2) {
                const isHomeEnd = ball.position.z > 0; 
                const lastWasHome = gameState.lastToucher && gameState.lastToucher.userData.isHome;
                if (isHomeEnd) setSetPiece(lastWasHome ? 'corner' : 'goalKick', new THREE.Vector3((lastWasHome?-1:0)*CONFIG.FIELD_W/2, 0, CONFIG.FIELD_L/2));
                else setSetPiece(!lastWasHome ? 'corner' : 'goalKick', new THREE.Vector3((!lastWasHome?1:0)*CONFIG.FIELD_W/2, 0, -CONFIG.FIELD_L/2));
            }
        }
    }
}

// NEW: Goal Post Collision Logic
function checkGoalPostCollision() {
    const postRadius = 0.2; // Hitbox radius
    const posts = [
        { x: -CONFIG.GOAL_W/2, z: -CONFIG.FIELD_L/2 }, // Away Left
        { x: CONFIG.GOAL_W/2, z: -CONFIG.FIELD_L/2 },  // Away Right
        { x: -CONFIG.GOAL_W/2, z: CONFIG.FIELD_L/2 },  // Home Left
        { x: CONFIG.GOAL_W/2, z: CONFIG.FIELD_L/2 }    // Home Right
    ];

    posts.forEach(post => {
        if (ball.position.y > CONFIG.GOAL_H) return; // Over bar

        const dx = ball.position.x - post.x;
        const dz = ball.position.z - post.z;
        const dist = Math.sqrt(dx*dx + dz*dz);

        if (dist < postRadius + CONFIG.BALL_RAD) {
            // Collision detected
            const nx = dx / dist;
            const nz = dz / dist;

            // Reflect velocity
            const dot = ball.userData.vel.x * nx + ball.userData.vel.z * nz;
            ball.userData.vel.x -= 2 * dot * nx;
            ball.userData.vel.z -= 2 * dot * nz;
            
            // Push out
            const overlap = (postRadius + CONFIG.BALL_RAD) - dist;
            ball.position.x += nx * overlap;
            ball.position.z += nz * overlap;

            playSound('kick'); 
            spawnParticles(ball.position, 5);
        }
    });
}

function updatePlayerInput(dt) {
    if (gameState.matchState !== 'playing' && gameState.matchState !== 'kickoff' && !['corner','freeKick','throwIn','penalty'].includes(gameState.matchState)) return;
    
    // Switch Player Logic
    if(inputs.switch && gameState.activePlayer && gameState.activePlayer.userData.cooldown <= 0) {
        switchPlayer();
        gameState.activePlayer.userData.cooldown = 15;
    }

    const p = gameState.activePlayer;
    if(!p) return;

    // Input Vector
    const move = new THREE.Vector3(0,0,0);
    const isSetPiece = ['corner', 'freeKick', 'goalKick', 'penalty', 'throwIn'].includes(gameState.matchState);
    
    if(isSetPiece) {
        if(inputs.left) p.rotation.y += 2.5 * dt; 
        if(inputs.right) p.rotation.y -= 2.5 * dt;
    } else {
        if(inputs.up) move.z -= 1; if(inputs.down) move.z += 1;
        if(inputs.left) move.x -= 1; if(inputs.right) move.x += 1;
        // Camera relative: IF not first person, adapt to camera angle
        if (gameState.cameraMode !== 'firstperson') {
            move.applyAxisAngle(new THREE.Vector3(0,1,0), camera.rotation.y);
        } else {
            // In first person, up is forward
            const yaw = p.rotation.y;
            if(inputs.up) { move.z = -Math.cos(yaw); move.x = -Math.sin(yaw); }
            if(inputs.down) { move.z = Math.cos(yaw); move.x = Math.sin(yaw); }
            if(inputs.left) p.rotation.y += 3.0 * dt; // Rotate instead of strafe
            if(inputs.right) p.rotation.y -= 3.0 * dt;
        }
    }

    // Movement
    let isSprinting = inputs.sprint && gameState.playerStamina > 0 && move.length() > 0;
    if(isSprinting) gameState.playerStamina -= CONFIG.STAMINA_DRAIN * dt; 
    else gameState.playerStamina = Math.min(CONFIG.STAMINA_MAX, gameState.playerStamina + CONFIG.STAMINA_REGEN * dt);

    if ((move.length() > 0 || (gameState.cameraMode === 'firstperson' && (inputs.left || inputs.right))) && !isSetPiece) {
        const stats = p.userData.stats;
        const speed = (isSprinting ? 12.0 : 7.0) * stats.speed;
        
        // If not turning in place (First person)
        if (move.length() > 0) {
            move.normalize().multiplyScalar(speed * dt);
            p.position.add(move);
            if(gameState.cameraMode !== 'firstperson') p.lookAt(p.position.clone().add(move));
            p.userData.velocity = move;
        }
    } else {
        p.userData.velocity.set(0,0,0);
    }

    // --- INTERACTION ---
    const distToBall = p.position.distanceTo(ball.position);
    
    // 1. Kick Off
    if(gameState.matchState === 'kickoff' && distToBall < 2.0 && (inputs.pass || inputs.shoot)) {
        gameState.matchState = 'playing';
        if(uiCallbacks.onMessage) uiCallbacks.onMessage("GAME ON!");
    }

    // 2. Dribble & Shoot
    if (distToBall < CONFIG.CONTROL_DIST) {
        gameState.ballOwner = p;
        gameState.lastToucher = p;
        aimReticle.visible = true;
        
        // Show Reticle
        const aimPos = p.position.clone().add(new THREE.Vector3(0,0,1).applyQuaternion(p.quaternion).multiplyScalar(5));
        aimReticle.position.set(aimPos.x, 0.1, aimPos.z);

        // Charging Shot
        if(inputs.shoot && !isSetPiece) { 
            gameState.isCharging = true; 
            gameState.shotCharge = Math.min(gameState.shotCharge + dt * 1.5, 1.0);
        }
        else if(gameState.isCharging) {
            // Release Shot
            // Check for Throw In
            if (gameState.matchState === 'throwIn') {
                Animator.triggerThrow(p);
                // Delay actual throw
                setTimeout(() => {
                    shoot(p, gameState.shotCharge * CONFIG.SHOOT_POW_MAX * 0.7, 2.5);
                }, 400);
            } else {
                shoot(p, gameState.shotCharge * CONFIG.SHOOT_POW_MAX, 0.2 + gameState.shotCharge*0.4);
            }
            gameState.isCharging = false; gameState.shotCharge = 0;
            if(isSetPiece) gameState.matchState = 'playing';
        }
        else if(inputs.pass && p.userData.cooldown <= 0) {
            shoot(p, CONFIG.PASS_POW, 0);
            if(isSetPiece) gameState.matchState = 'playing';
        }
        else if(move.length() > 0 && !isSetPiece) {
             // DRIBBLE MECHANIC
             applyDribble(p, move, dt);
        }
    } else {
        aimReticle.visible = false;
        gameState.isCharging = false;
        if(gameState.ballOwner === p) gameState.ballOwner = null; // Lost control
        
        // Tackle Attempt
        if(inputs.shoot && !isSetPiece && p.userData.cooldown <= 0) {
            p.position.add(new THREE.Vector3(0,0,1.5).applyQuaternion(p.quaternion)); // Lunge
            p.userData.cooldown = 40;
            if(distToBall < 2.0) {
                 // Tackle Success
                 const dir = new THREE.Vector3(0,0,1).applyQuaternion(p.quaternion);
                 ball.userData.vel.add(dir.multiplyScalar(8)); // Knock ball away
                 if(uiCallbacks.onMessage) uiCallbacks.onMessage("TACKLE!");
            }
        }
    }
    
    // Animation Update
    Animator.update(p, dt);
    
    // Animation Triggers
    if (ball.position.y > 1.5 && distToBall < 1.5) Animator.triggerJump(p);
}

function applyDribble(player, moveVec, dt) {
    const dir = moveVec.clone().normalize();
    const force = dir.multiplyScalar(CONFIG.DRIBBLE_FORCE * dt);
    ball.userData.vel.add(force);
    if(ball.userData.vel.length() > 12) ball.userData.vel.setLength(12);
}

// NEW: Consolidated AI Update
function updateAllAI(dt) {
    players.forEach(p => {
        if (p === gameState.activePlayer) return;

        // Separation (Boid logic)
        const separation = new THREE.Vector3();
        let neighbors = 0;
        players.forEach(other => {
            if (p !== other) {
                const d = p.position.distanceTo(other.position);
                if (d < 2.0) {
                    const push = p.position.clone().sub(other.position).normalize().divideScalar(d);
                    separation.add(push);
                    neighbors++;
                }
            }
        });
        if(neighbors > 0) separation.divideScalar(neighbors).multiplyScalar(4.0 * dt);
        p.position.add(separation);

        // Call the new AI System
        AI.update(p, dt, ball, gameState, players);

        // Execute AI intent (e.g. shoot)
        if (p.userData.wantsToShoot) {
            shoot(p, CONFIG.SHOOT_POW_MAX * 0.9, 0.4);
            p.userData.wantsToShoot = false;
        }
        
        // Helper for GK Save
        if (p.userData.madeSave) {
            ball.userData.vel.x *= -0.8;
            ball.userData.vel.z *= -0.8;
            ball.userData.vel.y += 5.0; 
            playSound('kick');
            if(uiCallbacks.onMessage) uiCallbacks.onMessage("SAVE!");
            p.userData.madeSave = false;
        }
        
        Animator.update(p, dt);
    });
}

// --- ACTIONS ---

function handleGoal(scoringTeam) {
    playSound('whistle');
    if(scoringTeam === 'home') gameState.homeScore++; else gameState.awayScore++;
    if(uiCallbacks.onScoreUpdate) uiCallbacks.onScoreUpdate(gameState.homeScore, gameState.awayScore);
    if(uiCallbacks.onMessage) uiCallbacks.onMessage("GOAL!!! " + scoringTeam.toUpperCase(), 3000);
    
    gameState.matchState = 'kickoff';
    
    // Reset positions logic (simplified)
    gameState.isPlaying = false;
    setTimeout(() => {
        // Reset Ball
        ball.position.set(0, CONFIG.BALL_RAD, 0); ball.userData.vel.set(0,0,0);
        // Reset Players would go here...
        gameState.isPlaying = true;
    }, 3000);
}

function switchPlayer() {
    let best = null; let minD = 1000;
    teams.home.forEach(m => { 
        if(m === gameState.activePlayer || m.userData.isGK) return; 
        const d = m.position.distanceTo(ball.position); 
        if(d < minD) { minD = d; best = m; } 
    });
    if(best) gameState.activePlayer = best;
}

function shoot(p, power, lift) {
    gameState.ballOwner = null;
    const dir = new THREE.Vector3(0,0,1).applyQuaternion(p.quaternion).normalize();
    ball.userData.vel.copy(dir).multiplyScalar(power); 
    ball.userData.vel.y = lift * power * 0.5;
    
    p.userData.cooldown = 20; 
    playSound('kick'); 
    spawnParticles(ball.position, 15);
}

// --- HELPERS & ASSETS ---

// NEW: Spring Camera System + First Person
function updateCameraPosition(dt) {
    // 1. FIRST PERSON MODE LOGIC
    if (gameState.cameraMode === 'firstperson') {
        let targetPlayer = gameState.activePlayer;

        // Fallback if no active player
        if (!targetPlayer && teams.home.length > 0) targetPlayer = teams.home[0];

        if (targetPlayer) {
            const headOffset = new THREE.Vector3(0, 1.80, 0.4); 
            headOffset.applyQuaternion(targetPlayer.quaternion);
            
            const camPos = targetPlayer.position.clone().add(headOffset);
            camera.position.lerp(camPos, 15.0 * dt);

            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(targetPlayer.quaternion);
            const lookTarget = camPos.clone().add(forward.multiplyScalar(10));
            
            camera.lookAt(lookTarget);
            camera.updateProjectionMatrix();
            return;
        }
    }

    // 2. STANDARD SPRING CAMERA
    let target = ball.position.clone();
    
    if (gameState.activePlayer && (gameState.ballOwner === gameState.activePlayer || gameState.matchState !== 'playing')) {
        target = gameState.activePlayer.position.clone();
    }
    
    const desiredX = target.x * 0.7; 
    const desiredZ = target.z + camOffset.z;
    const desiredY = camOffset.y;
    
    const desiredPos = new THREE.Vector3(desiredX, desiredY, desiredZ);

    if (ball.userData.vel.length() > 5) {
        desiredPos.x += ball.userData.vel.x * 0.5;
        desiredPos.z += ball.userData.vel.z * 0.5;
    }

    // Spring Physics
    const springStrength = 4.0;
    const damping = 3.0;

    const displacement = new THREE.Vector3().subVectors(camera.position, desiredPos);
    const force = displacement.multiplyScalar(-springStrength);
    
    const dampForce = camVelocity.clone().multiplyScalar(-damping);
    force.add(dampForce);

    const acceleration = force; 
    camVelocity.add(acceleration.multiplyScalar(dt));
    
    camera.position.add(camVelocity.clone().multiplyScalar(dt));
    
    const lookTarget = new THREE.Vector3(target.x * 0.5, 0, target.z * 0.5);
    camera.lookAt(lookTarget);
}

export function setTrainingScenario(type, location) {
    let pos = new THREE.Vector3(0,0,0);
    if(type === 'freeKick') {
        if(location === 'left') pos.set(-20, 0, 25); 
        else if(location === 'right') pos.set(20, 0, 25);
        else if(location === 'center') pos.set(0, 0, 25); 
        else if(location === 'close') pos.set(0, 0, 20); 
        else pos.set(0,0,30);
    }
    else if(type === 'corner') {
        const z = -CONFIG.FIELD_L/2;
        pos.set(location === 'left' ? -CONFIG.FIELD_W/2 : CONFIG.FIELD_W/2, 0, z);
    }
    else if(type === 'penalty') pos.set(0, 0, -CONFIG.FIELD_L/2 + 11);
    
    setSetPiece(type, pos);
}

export function setSetPiece(type, pos) {
    gameState.matchState = type; 
    gameState.ballOwner = null; 
    ball.userData.vel.set(0,0,0);
    ball.position.copy(pos); ball.position.y = CONFIG.BALL_RAD;
    
    const p = gameState.activePlayer; 
    p.position.copy(pos).sub(new THREE.Vector3(0,0, 2));
    p.lookAt(0, 0, -CONFIG.FIELD_L/2); 
    
    if(uiCallbacks.onSetPiece) uiCallbacks.onSetPiece(type);
}

// --- CREATION FUNCTIONS ---

function createPitch() {
    // Load grass asset from models
    const loader = new THREE.GLTFLoader();
    loader.load('assets/models/grass.glb', (gltf) => {
        const grassModel = gltf.scene;
        grassModel.rotation.x = -Math.PI/2;
        grassModel.receiveShadow = true;
        grassModel.castShadow = true;
        // Scale to fit field
        grassModel.scale.set(
            (CONFIG.FIELD_W + 8) / 10,
            1,
            (CONFIG.FIELD_L + 8) / 10
        );
        grassModel.position.y = -0.01;
        scene.add(grassModel);
    }, undefined, (error) => {
        console.warn('Grass model failed to load, using fallback:', error);
        // Fallback to procedural grass if model fails
        const geo = new THREE.PlaneGeometry(CONFIG.FIELD_W + 8, CONFIG.FIELD_L + 8);
        const tex = new THREE.CanvasTexture(generateStripedGrass());
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, color: 0xdddddd });
        const mesh = new THREE.Mesh(geo, mat); mesh.rotation.x = -Math.PI/2; mesh.receiveShadow = true; scene.add(mesh);
    });

    const trackGeo = new THREE.PlaneGeometry(CONFIG.FIELD_W + 30, CONFIG.FIELD_L + 30);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI/2; track.position.y = -0.05; track.receiveShadow = true; scene.add(track);

    const lines = new THREE.Group();
    const matL = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const dl = (w, h, x, z) => { const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), matL); m.rotation.x=-Math.PI/2; m.position.set(x,0.02,z); lines.add(m); };
    dl(0.3, CONFIG.FIELD_L, -CONFIG.FIELD_W/2, 0); dl(0.3, CONFIG.FIELD_L, CONFIG.FIELD_W/2, 0);
    dl(CONFIG.FIELD_W, 0.3, 0, -CONFIG.FIELD_L/2); dl(CONFIG.FIELD_W, 0.3, 0, CONFIG.FIELD_L/2); dl(CONFIG.FIELD_W, 0.3, 0, 0);
    const c = new THREE.Mesh(new THREE.RingGeometry(8,8.3,64), matL); c.rotation.x=-Math.PI/2; c.position.y=0.02; lines.add(c);
    const pb = (z, dir) => { dl(30, 0.3, 0, z + (14 * dir)); dl(0.3, 14, -15, z + (7 * dir)); dl(0.3, 14, 15, z + (7 * dir)); };
    pb(-CONFIG.FIELD_L/2, 1); pb(CONFIG.FIELD_L/2, -1);
    scene.add(lines);
}

function generateStripedGrass() {
    const c = document.createElement('canvas'); c.width=1024; c.height=1024; const ctx=c.getContext('2d');
    ctx.fillStyle = '#2d5a2d'; ctx.fillRect(0,0,1024,1024);
    const numStripes = 18; const h = 1024/numStripes;
    ctx.fillStyle = '#234a23';
    for(let i=0; i<numStripes; i+=2) ctx.fillRect(0, i*h, 1024, h);
    for(let i=0; i<30000; i++) { ctx.fillStyle = Math.random()>0.5 ? '#356835' : '#1e3e1e'; ctx.globalAlpha = 0.3; ctx.fillRect(Math.random()*1024, Math.random()*1024, 2, 2); }
    return c;
}

function createStadium(isNight) {
    const geo = new THREE.CylinderGeometry(95, 85, 25, 64, 1, true);
    const mat = new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.DoubleSide });
    const walls = new THREE.Mesh(geo, mat); walls.position.y = 8; scene.add(walls);
    const roofGeo = new THREE.RingGeometry(85, 110, 64);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide });
    const roof = new THREE.Mesh(roofGeo, roofMat); roof.rotation.x = -Math.PI/2; roof.position.y = 22; scene.add(roof);
}

function createCrowd(isNight) {
    const count = 5000; const crowdGeo = new THREE.BufferGeometry(); const positions = []; const colors = [];
    for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2; const r = 86 + Math.random() * 8; const y = 5 + Math.random() * 15;
        positions.push(Math.cos(angle)*r, y, Math.sin(angle)*r);
        const col = new THREE.Color().setHSL(Math.random(), 0.8, isNight ? 0.3 : 0.6);
        colors.push(col.r, col.g, col.b);
    }
    crowdGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    crowdGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const crowdMat = new THREE.PointsMaterial({ size: 0.8, vertexColors: true });
    crowdPoints = new THREE.Points(crowdGeo, crowdMat);
    crowdPoints.userData = { originalY: positions.filter((_,i)=>i%3===1) };
    scene.add(crowdPoints);
}

function createWeather(type) {
    const count = type === 'rain' ? 3000 : 2000; const geo = new THREE.BufferGeometry(); const pos = [];
    for(let i=0; i<count; i++) pos.push((Math.random()-0.5)*150, Math.random()*60, (Math.random()-0.5)*150);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: type === 'rain' ? 0xaaaaaa : 0xffffff, size: type === 'rain' ? 0.3 : 0.5, transparent: true, opacity: 0.8 });
    const sys = new THREE.Points(geo, mat); sys.userData = { type: type, velocities: [] };
    for(let i=0; i<count; i++) sys.userData.velocities.push(Math.random());
    scene.add(sys); weatherParticles.push(sys);
}

function createGoals() {
    const make = (z) => {
        const g = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({color:0xffffff, roughness: 0.1});
        const post = new THREE.CylinderGeometry(0.12,0.12,CONFIG.GOAL_H);
        const p1 = new THREE.Mesh(post,mat); p1.position.set(-CONFIG.GOAL_W/2, CONFIG.GOAL_H/2, 0);
        const p2 = new THREE.Mesh(post,mat); p2.position.set(CONFIG.GOAL_W/2, CONFIG.GOAL_H/2, 0);
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,CONFIG.GOAL_W), mat); bar.rotation.z=Math.PI/2; bar.position.set(0,CONFIG.GOAL_H,0);
        const net = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.GOAL_W, CONFIG.GOAL_H, 2), new THREE.MeshBasicMaterial({color:0xcccccc, wireframe:true, opacity:0.2, transparent:true}));
        net.position.set(0, CONFIG.GOAL_H/2, z<0?-1:1);
        g.add(p1,p2,bar,net); g.position.z = z; scene.add(g);
    }
    make(-CONFIG.FIELD_L/2); make(CONFIG.FIELD_L/2);
}

function spawnPlayer(x, z, isHome, teamData, isGK, rosterIdx) {
    // Use enhanced 3D player model
    const playerConfig = {
        height: 1.8,
        skinColor: Math.random() > 0.5 ? 0x8d5524 : 0xe0ac69,
        jerseyColor: isGK ? 0xffd700 : parseInt(teamData.color.toString(16), 16),
        shortsColor: 0x000000,
        socksColor: 0xffffff,
        number: String(rosterIdx + 1)
    };
    
    const g = ProceduralModelGenerator.createPlayerModel(playerConfig);
    g.position.set(x, 0, z);
    g.castShadow = true;
    g.receiveShadow = true;

    let speedStat = teamData.mid;
    if(rosterIdx > 3) speedStat = teamData.att; 
    else if(rosterIdx < 2 && !isGK) speedStat = teamData.def;
    const speedMult = 0.8 + (speedStat / 100) * 0.4;
    
    g.userData = { 
        isHome: isHome, isGK: isGK, homePos: new THREE.Vector3(x,0,z), 
        defendZ: isHome?CONFIG.FIELD_L/2:-CONFIG.FIELD_L/2, cooldown: 0, 
        marker: null, // 3D model doesn't need separate marker
        limbs: g.userData.limbs, // Store limb references from procedural model
        torso: g.userData.torso, // Store torso reference from procedural model
        animOffset: Math.random() * 100, gkState: 'idle', gkTimer: 0,
        stats: { speed: speedMult, shotPower: (teamData.att / 100) * CONFIG.SHOOT_POW_MAX, passAcc: (teamData.mid / 100) },
        velocity: new THREE.Vector3(),
        animState: { jumpTimer: 0, throwTimer: 0, diveTimer: 0, diveDir: 1 }
    };
    scene.add(g); players.push(g);
    if(isHome) teams.home.push(g); else teams.away.push(g);
}

function spawnParticles(pos, count) {
    if(!sharedParticleGeo) return;
    for(let i=0; i<count; i++) {
        const m = new THREE.Mesh(sharedParticleGeo, sharedParticleMat); 
        m.position.copy(pos);
        m.userData = { vel: new THREE.Vector3((Math.random()-0.5), Math.random(), (Math.random()-0.5)).multiplyScalar(0.4), life: 1.0, isParticle: true };
        scene.add(m); particles.push(m);
    }
}

function updateEntrance(dt) {
    let allArrived = true;
    players.forEach(p => {
        if(p.userData.isGK) return; 
        const dist = p.position.distanceTo(p.userData.homePos);
        if(dist > 0.5) {
            allArrived = false;
            const dir = new THREE.Vector3().subVectors(p.userData.homePos, p.position).normalize();
            p.position.add(dir.multiplyScalar(5 * dt));
            // Animate legs during walking animation
            if(p.userData.limbs && p.userData.limbs.legL && p.userData.limbs.legR) { 
                const t = Date.now()*0.005; 
                p.userData.limbs.legL.rotation.x = Math.sin(t)*0.5; 
                p.userData.limbs.legR.rotation.x = -Math.sin(t)*0.5; 
            }
        } else {
            p.lookAt(0,0, p.userData.isHome?-50:50);
            // Stop leg animation when arrived
            if(p.userData.limbs && p.userData.limbs.legL && p.userData.limbs.legR) {
                p.userData.limbs.legL.rotation.x = 0; 
                p.userData.limbs.legR.rotation.x = 0;
            }
        }
    });
    if(allArrived) { gameState.matchState = 'kickoff'; if(uiCallbacks.onMessage) uiCallbacks.onMessage("KICK OFF!"); }
}

function updateEffects(dt) {
    if(weatherParticles.length > 0) {
        const wp = weatherParticles[0]; const pos = wp.geometry.attributes.position.array; const isRain = wp.userData.type === 'rain';
        for(let i=0; i<pos.length/3; i++) {
            pos[i*3+1] -= isRain ? 1.0 : 0.2;
            if(!isRain) pos[i*3] += Math.sin(Date.now()*0.001 + i)*0.05;
            if(pos[i*3+1] < 0) { pos[i*3+1] = 50 + Math.random()*10; pos[i*3] = (Math.random()-0.5)*150 + camera.position.x; pos[i*3+2] = (Math.random()-0.5)*150 + camera.position.z; }
        }
        wp.geometry.attributes.position.needsUpdate = true;
    }
    if(ball.userData.vel.length() > 0.5) spawnParticles(ball.position, 1);
    for(let i=particles.length-1; i>=0; i--) {
        const p = particles[i];
        if(p.userData.isParticle) { 
            p.position.add(p.userData.vel); 
            p.userData.life -= 0.05; 
            p.scale.setScalar(p.userData.life); 
            if(p.userData.life <= 0) { scene.remove(p); particles.splice(i,1); } 
        }
        else { const pos = p.geometry.attributes.position.array; for(let j=0; j<400; j++) { pos[j*3] += p.userData.vel[j*3]; pos[j*3+1] += p.userData.vel[j*3+1]; pos[j*3+2] += p.userData.vel[j*3+2]; } p.geometry.attributes.position.needsUpdate = true; p.userData.life -= dt; if(p.userData.life <= 0) { scene.remove(p); particles.splice(i,1); } }
    }
    if(crowdPoints) {
        const pos = crowdPoints.geometry.attributes.position.array; const orig = crowdPoints.userData.originalY; const t = Date.now() * 0.005;
        for(let i=0; i<orig.length; i++) pos[i*3+1] = orig[i] + Math.sin(t + pos[i*3]*0.1) * 0.5;
        crowdPoints.geometry.attributes.position.needsUpdate = true;
    }
    if(gameState.shake > 0) { gameState.shake -= dt * 5; if(gameState.shake < 0) gameState.shake = 0; }
}

function playSound(type) {
    if(!audioCtx) return;
    try {
        const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        if(type==='kick') { o.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.1); g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime+0.1); o.start(); o.stop(audioCtx.currentTime+0.1); }
        if(type==='whistle') { o.type='triangle'; o.frequency.setValueAtTime(1500, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime+0.4); o.start(); o.stop(audioCtx.currentTime+0.4); }
    } catch(e) { console.warn("Audio error", e); }
}

export function resizeGame() {
    if(camera && renderer) {
        camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

export function togglePause() {
    if(gameState.matchState === 'menu') return;
    gameState.isPaused = !gameState.isPaused;
    document.getElementById('pause-menu').style.display = gameState.isPaused ? 'flex' : 'none';
}

export function quitToMenu() {
    gameState.isPlaying = false; gameState.isPaused = false;
    document.getElementById('pause-menu').style.display = 'none';
    document.getElementById('ui-layer').style.display = 'none';
    const c = document.getElementById('game-container'); if(c) c.innerHTML = '';
}