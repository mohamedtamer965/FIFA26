// Example: How to Use the 3D Asset System
// This file shows practical examples of integrating 3D assets
// Note: THREE is loaded globally via <script> tags in index.html

import { assetManager } from './loaders/assetManager.js';
import { ProceduralModelGenerator } from './loaders/proceduralModels.js';
import { advancedAssetSystem } from './loaders/advanced3DAssets.js';
import { ModelUtilities, quickSetupModel } from './loaders/modelUtilities.js';
import { ASSETS_CONFIG, TEAM_COLOR_PRESETS, toggleFeature } from './loaders/assetsConfig.js';

// ============================================================
// EXAMPLE 1: Create Procedural Player (Currently Used)
// ============================================================
export function exampleCreateProceduralPlayer() {
    const playerModel = ProceduralModelGenerator.createPlayerModel({
        height: 1.8,
        skinColor: 0xf4a460,           // Light skin tone
        jerseyColor: TEAM_COLOR_PRESETS.MANCHESTER_RED,
        shortsColor: 0x000000,
        socksColor: 0xffffff,
        number: '7'
    });

    return playerModel;
}

// ============================================================
// EXAMPLE 2: Load Custom 3D Model (When available)
// ============================================================
export async function exampleLoadCustomPlayer() {
    try {
        // Load model from assets folder
        const playerModel = await assetManager.loadModel(
            'assets/models/player.glb',
            'custom_player'
        );

        // Setup the model
        quickSetupModel(playerModel, {
            scale: 1.0,
            optimize: true,
            addOutline: true,
            teamColors: {
                jersey: TEAM_COLOR_PRESETS.LIVERPOOL_RED,
                shorts: 0x000000,
                socks: 0xffffff
            },
            freeze: true
        });

        return playerModel;
    } catch (error) {
        console.error('Failed to load custom player model:', error);
        // Fall back to procedural model
        return exampleCreateProceduralPlayer();
    }
}

// ============================================================
// EXAMPLE 3: Create Ball
// ============================================================
export function exampleCreateBall() {
    // Procedural ball (current)
    const ball = ProceduralModelGenerator.createSoccerBall(0.22);

    // Or load custom ball model:
    // const ball = await assetManager.loadModel('assets/models/ball.glb', 'soccer_ball');

    return ball;
}

// ============================================================
// EXAMPLE 4: Setup Stadium with All Elements
// ============================================================
export function exampleSetupStadium(scene) {
    // Create goal posts
    const homeGoal = ProceduralModelGenerator.createGoalPost();
    homeGoal.position.z = -52.5; // At goal line
    scene.add(homeGoal);

    const awayGoal = ProceduralModelGenerator.createGoalPost();
    awayGoal.position.z = 52.5;
    scene.add(awayGoal);

    // Add corner flags
    const corners = [
        { x: -52.5, z: -34 },
        { x: 52.5, z: -34 },
        { x: -52.5, z: 34 },
        { x: 52.5, z: 34 }
    ];

    corners.forEach(corner => {
        const flag = ProceduralModelGenerator.createCornerFlag();
        flag.position.set(corner.x, 0, corner.z);
        scene.add(flag);
    });

    // Add crowd
    if (ASSETS_CONFIG.STADIUM.ENABLE_CROWD) {
        const crowd = advancedAssetSystem.createAdvancedCrowd(30, 10);
        crowd.position.set(-60, 0, 0);
        scene.add(crowd);
    }

    // Add stadium lighting
    if (ASSETS_CONFIG.STADIUM.ENABLE_LIGHTING) {
        const lights = ProceduralModelGenerator.createLightingRig();
        scene.add(lights);
    }
}

// ============================================================
// EXAMPLE 5: Setup Complete Scene with 3D Assets
// ============================================================
export async function exampleSetupCompleteScene(scene, camera, renderer) {
    // Apply weather effects
    advancedAssetSystem.applyWeatherEffects(scene, 'clear');

    // Create environment map for reflections
    const envMap = advancedAssetSystem.generateEnvironmentMap(512);
    scene.environment = envMap;

    // Setup stadium elements
    exampleSetupStadium(scene);

    // Create and add players (example)
    const homePlayers = [];
    const awayPlayers = [];

    // Home team
    for (let i = 0; i < 11; i++) {
        let player;

        // Try to load custom model first, fallback to procedural
        if (ASSETS_CONFIG.USE_CUSTOM_MODELS) {
            player = await exampleLoadCustomPlayer();
        } else {
            player = exampleCreateProceduralPlayer();
        }

        player.position.set(
            (i % 2) * 30 - 15,
            0,
            -Math.floor(i / 2) * 8 - 5
        );

        scene.add(player);
        homePlayers.push(player);
    }

    // Away team (clone and modify)
    homePlayers.forEach((homePlayer, i) => {
        const awayPlayer = homePlayer.clone();

        // Change colors for away team
        ModelUtilities.applyTeamColors(
            awayPlayer,
            TEAM_COLOR_PRESETS.ARSENAL_RED,
            0xffffff,
            0xffffff
        );

        awayPlayer.position.z = -awayPlayer.position.z;

        scene.add(awayPlayer);
        awayPlayers.push(awayPlayer);
    });

    // Add ball
    const ball = exampleCreateBall();
    ball.position.set(0, 0.22, 0);
    scene.add(ball);

    return { homePlayers, awayPlayers, ball };
}

// ============================================================
// EXAMPLE 6: Animate Players
// ============================================================
export function exampleAnimatePlayers(players, deltaTime) {
    players.forEach((player, index) => {
        // Simple walk animation
        player.traverse(child => {
            if (child.isMesh) {
                // Rotate limbs for walking effect
                const time = performance.now() * 0.001 + index;

                if (child.name.includes('leg') || child.parent.name.includes('leg')) {
                    child.rotation.x = Math.sin(time * 2) * 0.4;
                } else if (child.name.includes('arm') || child.parent.name.includes('arm')) {
                    child.rotation.x = Math.sin(time * 2 + Math.PI) * 0.3;
                }
            }
        });
    });
}

// ============================================================
// EXAMPLE 7: Highlight Active Player
// ============================================================
export function exampleHighlightPlayer(player, isActive = true) {
    if (isActive) {
        ModelUtilities.addOutline(player, 0xffff00, 0.03);
    } else {
        // Remove outline by removing the last added outline mesh
        player.children.forEach((child, index) => {
            if (child.userData.isOutline) {
                player.remove(child);
            }
        });
    }
}

// ============================================================
// EXAMPLE 8: Performance Monitoring
// ============================================================
export function exampleMonitorPerformance(scene, renderer) {
    const stats = {
        meshCount: 0,
        triangles: 0,
        materials: 0,
        textures: 0,
        memoryUsage: 0
    };

    scene.traverse(child => {
        if (child.isMesh) {
            stats.meshCount++;

            if (child.geometry.index) {
                stats.triangles += child.geometry.index.count / 3;
            } else {
                stats.triangles += child.geometry.attributes.position.count / 3;
            }

            if (Array.isArray(child.material)) {
                stats.materials += child.material.length;
            } else {
                stats.materials += 1;
            }
        }
    });

    // Get memory info if available
    if (performance.memory) {
        stats.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
    }

    // Get FPS
    const framerate = renderer.info.render.frame;

    return {
        ...stats,
        fps: Math.round(1000 / renderer.deltaTime) || 60,
        renderInfo: renderer.info.render
    };
}

// ============================================================
// EXAMPLE 9: Toggle Between Procedural and Custom Models
// ============================================================
export async function exampleToggleAssetMode(useCustom = false) {
    if (useCustom) {
        console.log('Switching to custom 3D models...');
        toggleFeature('USE_PROCEDURAL_MODELS', false);
        toggleFeature('USE_CUSTOM_MODELS', true);

        // Verify models exist
        try {
            const testModel = await assetManager.loadModel(
                'assets/models/player.glb'
            );
            console.log('✓ Custom models ready');
            return true;
        } catch (error) {
            console.error('✗ Custom models not available, falling back to procedural');
            toggleFeature('USE_PROCEDURAL_MODELS', true);
            toggleFeature('USE_CUSTOM_MODELS', false);
            return false;
        }
    } else {
        console.log('Switching to procedural models...');
        toggleFeature('USE_PROCEDURAL_MODELS', true);
        toggleFeature('USE_CUSTOM_MODELS', false);
        return true;
    }
}

// ============================================================
// EXAMPLE 10: LOD System Setup
// ============================================================
export function exampleSetupLODSystem(players) {
    return players.map(player => ModelUtilities.createLODModel(player));
}

// ============================================================
// EXAMPLE 11: Batch Create Models for Performance
// ============================================================
export function exampleBatchCreatePlayers(baseModel, count) {
    const players = ModelUtilities.batchCloneModels(baseModel, count);

    // Optimize all clones
    players.forEach(player => {
        ModelUtilities.optimizeForRendering(player);
    });

    return players;
}

// ============================================================
// EXAMPLE 12: Export Scene Statistics
// ============================================================
export function exampleGetSceneStats(scene) {
    const stats = {
        totalMeshes: 0,
        totalTriangles: 0,
        boundingBox: null,
        models: []
    };

    scene.traverse(child => {
        if (child.isMesh && child.name.startsWith('player_')) {
            const modelStats = ModelUtilities.getModelStats(child);
            stats.models.push({
                name: child.name,
                ...modelStats
            });
            stats.totalMeshes += modelStats.meshCount;
            stats.totalTriangles += modelStats.triCount;
        }
    });

    stats.boundingBox = ModelUtilities.getBoundingBox(scene);
    return stats;
}

// ============================================================
// Main: How to integrate everything
// ============================================================
export async function exampleIntegrationFlow() {
    // 1. Check configuration
    console.log('Current Config:', ASSETS_CONFIG);

    // 2. Determine which models to use
    const useCustomModels = ASSETS_CONFIG.USE_CUSTOM_MODELS;

    // 3. Create or load player
    let playerModel;
    if (useCustomModels) {
        playerModel = await exampleLoadCustomPlayer();
    } else {
        playerModel = exampleCreateProceduralPlayer();
    }

    // 4. Setup and optimize
    quickSetupModel(playerModel, {
        optimize: true,
        addOutline: true,
        freeze: true
    });

    // 5. Get statistics
    const stats = ModelUtilities.getModelStats(playerModel);
    console.log('Model stats:', stats);

    // 6. Create batch for team
    const teamPlayers = exampleBatchCreatePlayers(playerModel, 11);

    return teamPlayers;
}

// Export all examples
export const Examples = {
    exampleCreateProceduralPlayer,
    exampleLoadCustomPlayer,
    exampleCreateBall,
    exampleSetupStadium,
    exampleSetupCompleteScene,
    exampleAnimatePlayers,
    exampleHighlightPlayer,
    exampleMonitorPerformance,
    exampleToggleAssetMode,
    exampleSetupLODSystem,
    exampleBatchCreatePlayers,
    exampleGetSceneStats,
    exampleIntegrationFlow
};
