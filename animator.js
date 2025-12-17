import { CONFIG } from './data.js';

export class Animator {
    static update(player, dt) {
        const ud = player.userData;
        const limbs = ud.limbs;
        if (!limbs) return;

        // --- 1. HANDLE ACTION TIMERS ---
        if (ud.animState.jumpTimer > 0) {
            ud.animState.jumpTimer -= dt;
            this.applyJump(player, ud.animState.jumpTimer);
            return; // Jumping overrides running
        }
        
        if (ud.animState.diveTimer > 0) {
            ud.animState.diveTimer -= dt;
            this.applyDive(player, ud.animState.diveTimer);
            return; // Diving overrides everything
        }

        if (ud.animState.throwTimer > 0) {
            ud.animState.throwTimer -= dt;
            this.applyThrowIn(player, ud.animState.throwTimer);
            return;
        }

        // --- 2. STANDARD LOCOMOTION ---
        // Reset vertical position if not jumping
        player.position.y = 0; 
        player.rotation.z = 0; // Reset dive rotation
        player.rotation.x = 0;

        const isMoving = ud.velocity.length() > 0.1;
        const isSprinting = isMoving && ud.velocity.length() > 6.0;

        if (isMoving) {
            const speedFactor = isSprinting ? 15 : 10;
            const t = Date.now() * 0.001 * speedFactor + ud.animOffset;
            
            // Run Cycle
            limbs.legL.rotation.x = Math.sin(t);
            limbs.legR.rotation.x = -Math.sin(t);
            limbs.armL.rotation.x = -Math.sin(t) * 0.8;
            limbs.armR.rotation.x = Math.sin(t) * 0.8;
            
            // Torso Lean
            ud.torso.rotation.x = isSprinting ? 0.3 : 0.1;
            
            // Reset arms Z (prevent "T-pose" stuck from celebration)
            limbs.armL.rotation.z = 0;
            limbs.armR.rotation.z = 0;

        } else {
            // Idle Breathing
            const t = Date.now() * 0.003 + ud.animOffset;
            ud.torso.rotation.x = Math.sin(t) * 0.05;
            limbs.armL.rotation.x = Math.sin(t) * 0.05;
            limbs.armR.rotation.x = Math.sin(t) * 0.05;
            limbs.legL.rotation.x = 0;
            limbs.legR.rotation.x = 0;
            
            // GK Ready Stance
            if (ud.isGK) {
                limbs.armL.rotation.z = 0.5;
                limbs.armR.rotation.z = -0.5;
                limbs.legL.rotation.x = 0.2;
                limbs.legR.rotation.x = -0.2;
            }
        }
    }

    static applyJump(player, timer) {
        // Parabolic arc for jump height
        const progress = 1 - (timer / CONFIG.JUMP_DURATION); // 0 to 1
        const h = Math.sin(progress * Math.PI) * CONFIG.JUMP_HEIGHT;
        player.position.y = h;

        // Arms up
        const limbs = player.userData.limbs;
        limbs.armL.rotation.x = -2.5;
        limbs.armR.rotation.x = -2.5;
        
        // Legs tucked
        limbs.legL.rotation.x = -0.5;
        limbs.legR.rotation.x = -1.0;
    }

    static applyThrowIn(player, timer) {
        const limbs = player.userData.limbs;
        const progress = 1 - (timer / CONFIG.THROW_DURATION);
        
        // Wind up then throw
        if (progress < 0.5) {
            // Hands back behind head
            limbs.armL.rotation.x = -Math.PI - 0.5;
            limbs.armR.rotation.x = -Math.PI - 0.5;
            player.userData.torso.rotation.x = -0.5; // Lean back
        } else {
            // Snap forward
            limbs.armL.rotation.x = -1.0;
            limbs.armR.rotation.x = -1.0;
            player.userData.torso.rotation.x = 0.5; // Lean forward
        }
    }

    static applyDive(player, timer) {
        const ud = player.userData;
        const progress = 1 - (timer / CONFIG.DIVE_DURATION);
        
        // Horizontal rotation
        player.rotation.z = ud.animState.diveDir * (Math.PI / 2.2); 
        
        // Move body slightly in air
        const h = Math.sin(progress * Math.PI) * 0.5;
        player.position.y = h;
        
        // Arms reaching
        ud.limbs.armL.rotation.z = 2.8;
        ud.limbs.armR.rotation.z = -2.8;
    }

    // Call this to trigger animations
    static triggerJump(player) {
        if (player.userData.animState.jumpTimer <= 0) {
            player.userData.animState.jumpTimer = CONFIG.JUMP_DURATION;
        }
    }

    static triggerThrow(player) {
        player.userData.animState.throwTimer = CONFIG.THROW_DURATION;
    }

    static triggerDive(player, direction) { // direction: 1 (left) or -1 (right)
        player.userData.animState.diveTimer = CONFIG.DIVE_DURATION;
        player.userData.animState.diveDir = direction;
    }
}