import { CONFIG } from './data.js';
import { Animator } from './animator.js';

// AI STATE CONSTANTS
const STATE = {
    IDLE: 0,
    POSITIONING: 1, // Moving to formation spot
    CHASE: 2,       // Running to ball
    ATTACK: 3,      // Dribbling towards goal
    DEFEND: 4,      // Marking/Intercepting
    GK_IDLE: 10,
    GK_TRACK: 11,   // Following ball lateral
    GK_SAVE: 12     // Diving
};

export class AI {
    
    static update(player, dt, ball, gameState, allPlayers) {
        if (!player.userData.aiState) player.userData.aiState = STATE.IDLE;
        
        // Decide State based on context
        const distToBall = player.position.distanceTo(ball.position);
        const isTeammateWithBall = gameState.ballOwner && (gameState.ballOwner.userData.isHome === player.userData.isHome);
        const isEnemyWithBall = gameState.ballOwner && (gameState.ballOwner.userData.isHome !== player.userData.isHome);
        
        // --- GOALKEEPER LOGIC ---
        if (player.userData.isGK) {
            this.updateGK(player, dt, ball, gameState);
            return;
        }

        // --- FIELD PLAYER LOGIC ---
        
        // 1. STATE TRANSITIONS
        let nextState = player.userData.aiState;

        if (gameState.ballOwner === player) {
            nextState = STATE.ATTACK;
        } else if (distToBall < 10.0 && !gameState.ballOwner) {
            // Loose ball nearby -> Chase
            nextState = STATE.CHASE;
        } else if (isTeammateWithBall) {
            // Teammate has it -> Support
            nextState = STATE.POSITIONING;
        } else {
            // Enemy has it or ball far away -> Defend/Return
            nextState = STATE.DEFEND;
        }

        player.userData.aiState = nextState;

        // 2. STATE EXECUTION
        switch (player.userData.aiState) {
            case STATE.CHASE:
                this.movePlayer(player, ball.position, dt, 1.0);
                break;

            case STATE.ATTACK:
                this.handleAttack(player, ball, dt, gameState);
                break;

            case STATE.POSITIONING:
                this.handleSupport(player, dt);
                break;

            case STATE.DEFEND:
                this.handleDefense(player, ball, dt);
                break;
                
            default: // IDLE
                this.movePlayer(player, player.userData.homePos, dt, 0.5);
                break;
        }
        
        // Cooldown management
        if(player.userData.cooldown > 0) player.userData.cooldown--;
    }

    static movePlayer(player, targetPos, dt, speedMult = 1.0) {
        const stats = player.userData.stats || { speed: 1.0 };
        const speed = stats.speed * 7.0 * speedMult;
        
        const dir = new THREE.Vector3().subVectors(targetPos, player.position);
        dir.y = 0;
        
        if (dir.length() > 0.2) {
            dir.normalize();
            const move = dir.multiplyScalar(speed * dt);
            player.position.add(move);
            player.lookAt(player.position.clone().add(dir));
            player.userData.velocity = move; // For Animator
        } else {
            player.userData.velocity.set(0,0,0);
        }
    }

    static handleAttack(player, ball, dt, gameState) {
        // Dribble towards enemy goal
        const goalZ = player.userData.isHome ? CONFIG.FIELD_L/2 : -CONFIG.FIELD_L/2;
        const goalPos = new THREE.Vector3(0, 0, goalZ);
        
        // Simple logic: Run straight to goal, maybe shoot if close
        const distToGoal = player.position.distanceTo(goalPos);
        
        if (distToGoal < 20 && player.userData.cooldown <= 0) {
            // SHOOT LOGIC
            // Chance to shoot based on AI difficulty
            if (Math.random() < 0.05 * gameState.aiDiff) {
                // Return data for the game loop to execute the shot (keeping physics there)
                player.userData.wantsToShoot = true;
                return; 
            }
        }

        // Dribble move
        this.movePlayer(player, goalPos, dt, 0.9); // Dribble slightly slower
    }

    static handleSupport(player, dt) {
        // Move to formation position but slightly forward
        const target = player.userData.homePos.clone();
        target.z += player.userData.isHome ? 5 : -5; // Push upfield
        this.movePlayer(player, target, dt, 0.8);
    }

    static handleDefense(player, ball, dt) {
        // Return to formation BUT shift towards ball side
        const target = player.userData.homePos.clone();
        
        // Shift laterally to block
        const ballX = ball.position.x;
        target.x = target.x * 0.5 + ballX * 0.5;
        
        this.movePlayer(player, target, dt, 0.8);
    }

    static updateGK(player, dt, ball, gameState) {
        const goalZ = player.userData.defendZ;
        // Clamp GK movement to goal box width
        const targetX = Math.max(-3.5, Math.min(3.5, ball.position.x * 0.8));
        const targetZ = goalZ + (player.userData.isHome ? -1 : 1);
        
        const targetPos = new THREE.Vector3(targetX, 0, targetZ);
        
        // Lerp towards position
        const dx = (targetX - player.position.x) * 4.0 * dt;
        const dz = (targetZ - player.position.z) * 4.0 * dt;
        
        player.position.x += dx;
        player.position.z += dz;
        player.lookAt(ball.position.x, 0, ball.position.z);
        
        // DIVE LOGIC
        if (player.userData.animState.diveTimer <= 0) {
            const dist = player.position.distanceTo(ball.position);
            // If ball is fast, close, and moving towards goal
            if (dist < 4.0 && ball.userData.vel.length() > 10.0) {
                 // Check if ball is moving towards goal line
                 const movingToGoal = (player.userData.isHome && ball.userData.vel.z > 0) || 
                                      (!player.userData.isHome && ball.userData.vel.z < 0);
                 
                 if (movingToGoal) {
                     // Determine Side
                     const dir = ball.position.x > player.position.x ? 1 : -1;
                     Animator.triggerDive(player, dir);
                     
                     // Helper: notify game loop to bounce ball
                     player.userData.madeSave = true;
                 }
            }
        }
    }
}