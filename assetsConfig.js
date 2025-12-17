// 3D Assets Configuration - Customize appearance and behavior
export const ASSETS_CONFIG = {
    // Enable/disable features
    USE_PROCEDURAL_MODELS: true,        // Use procedurally generated models
    USE_CUSTOM_MODELS: false,           // Load custom GLB models (set to true when models are ready)
    ENABLE_ADVANCED_MATERIALS: true,    // Use PBR materials
    ENABLE_ANIMATIONS: true,            // Enable player animations
    ENABLE_CROWD: true,                 // Show crowd
    
    // Player model settings
    PLAYER: {
        MODEL_QUALITY: 'high',          // 'low', 'medium', 'high'
        CAST_SHADOWS: true,
        RECEIVE_SHADOWS: true,
        WIREFRAME: false,
        
        // Skin tones (can use custom hex colors)
        SKIN_TONES: [
            0xf4a460,    // Light
            0xe0ac69,    // Medium
            0x8d5524,    // Dark
            0xd4a574     // Tan
        ],
        
        // Default dimensions
        HEIGHT: 1.8,
        HEAD_SIZE: 0.24,
        BODY_WIDTH: 0.4,
        BODY_HEIGHT: 0.65,
        BODY_DEPTH: 0.25,
        
        // Animation settings
        ANIMATION: {
            ENABLED: true,
            WALK_SPEED: 1.2,
            RUN_SPEED: 2.0,
            KICK_DURATION: 0.5,
            STRIDE_LENGTH: 0.3
        }
    },

    // Ball settings
    BALL: {
        MODEL_TYPE: 'procedural',       // 'procedural' or 'custom'
        RADIUS: 0.22,
        CAST_SHADOWS: true,
        RECEIVE_SHADOWS: true,
        
        // Material properties
        MATERIAL: {
            ROUGHNESS: 0.3,
            METALNESS: 0.1,
            TEXTURE_QUALITY: 'high'    // 'low', 'medium', 'high'
        }
    },

    // Stadium settings
    STADIUM: {
        ENABLE_GOALS: true,
        ENABLE_CORNER_FLAGS: true,
        ENABLE_CROWD: true,
        ENABLE_LIGHTING: true,
        
        // Crowd settings
        CROWD: {
            DENSITY: 'medium',          // 'low', 'medium', 'high'
            ENABLE_WAVE_ANIMATION: true,
            ANIMATION_SPEED: 0.8,
            ENABLE_CHANTS: false        // Audio would be added here
        },
        
        // Lighting
        LIGHTING: {
            FLOODLIGHT_INTENSITY: 2.0,
            AMBIENT_INTENSITY: 0.5,
            ENABLE_SHADOW_MAP: true,
            SHADOW_MAP_SIZE: 2048
        },
        
        // Stadium appearance
        GRASS_COLOR: 0x2d5016,
        GRASS_ROUGHNESS: 0.9,
        FIELD_LINES_COLOR: 0xffffff,
        ENABLE_WEATHER: true
    },

    // Weather effects
    WEATHER: {
        RAIN: {
            FOG_DENSITY: 0.008,
            SKY_COLOR: 0x556677,
            PARTICLE_COUNT: 1000,
            DROPLET_SPEED: 15
        },
        SNOW: {
            FOG_DENSITY: 0.012,
            SKY_COLOR: 0xdddddd,
            PARTICLE_COUNT: 500,
            FLAKE_SPEED: 3
        },
        FOG: {
            FOG_DENSITY: 0.02,
            SKY_COLOR: 0x999999
        },
        NIGHT: {
            FOG_DENSITY: 0.008,
            SKY_COLOR: 0x050510,
            AMBIENT_INTENSITY: 0.2,
            FLOODLIGHT_BOOST: 1.5
        },
        CLEAR: {
            FOG_DENSITY: 0.002,
            SKY_COLOR: 0x87ceeb,
            AMBIENT_INTENSITY: 0.6
        }
    },

    // Custom model paths (when USE_CUSTOM_MODELS is true)
    CUSTOM_MODELS: {
        PLAYER_HOME: 'assets/models/player_home.glb',
        PLAYER_AWAY: 'assets/models/player_away.glb',
        GOALKEEPER: 'assets/models/goalkeeper.glb',
        BALL: 'assets/models/ball.glb',
        STADIUM: 'assets/models/stadium.glb',
        CROWD: 'assets/models/crowd.glb'
    },

    // Texture paths
    TEXTURES: {
        GRASS: 'assets/textures/grass.jpg',
        BALL_PATTERN: 'assets/textures/ball_pattern.png',
        PLAYER_JERSEY: 'assets/textures/jersey.jpg',
        STADIUM_ENVIRONMENT: 'assets/textures/stadium_env.jpg'
    },

    // Performance settings
    PERFORMANCE: {
        // Use LOD (Level of Detail) for crowd
        USE_LOD: true,
        
        // Maximum number of shadows
        MAX_SHADOW_LIGHTS: 4,
        
        // Draw distance for crowd
        CROWD_DRAW_DISTANCE: 150,
        
        // Disable shadows on certain objects
        DISABLE_SHADOWS_ON: ['crowd', 'distant_elements'],
        
        // Use simplified models for distant players
        SIMPLIFY_DISTANT_PLAYERS: true,
        SIMPLIFICATION_DISTANCE: 100,
        
        // Maximum render quality (affects resolution)
        MAX_PIXEL_RATIO: 2.0,
        
        // Enable Adaptive Performance (auto-reduce quality on low FPS)
        ADAPTIVE_QUALITY: false,
        ADAPTIVE_QUALITY_THRESHOLD: 30 // FPS threshold
    },

    // Debug settings
    DEBUG: {
        SHOW_WIREFRAME: false,
        SHOW_BOUNDING_BOXES: false,
        SHOW_LIGHT_HELPERS: false,
        SHOW_CAMERA_HELPERS: false,
        LOG_ASSET_LOADING: true,
        LOG_PERFORMANCE: false,
        RENDER_STATS: false
    }
};

// Helper function to get theme colors for custom teams
export const TEAM_COLOR_PRESETS = {
    RED: 0xff0000,
    BLUE: 0x0000ff,
    WHITE: 0xffffff,
    BLACK: 0x000000,
    YELLOW: 0xffff00,
    GREEN: 0x00cc00,
    ORANGE: 0xff8800,
    PURPLE: 0x8800ff,
    PINK: 0xff00ff,
    CYAN: 0x00ffff,
    
    // Popular team colors
    MANCHESTER_RED: 0xda291c,
    MANCHESTER_BLUE: 0x003399,
    LIVERPOOL_RED: 0xc8102e,
    ARSENAL_RED: 0xef0107,
    CHELSEA_BLUE: 0x0051ba,
    JUVENTUS_BIANCONERO: 0x000000,  // Combined with white
    BARCELONA_BLAUGRANA: 0x004d98,   // Combined with red
    REAL_MADRID_WHITE: 0xffffff,
    PSG_NAVY: 0x004494,
    BAYERN_RED: 0xdc052d
};

// Material presets for quick setup
export const MATERIAL_PRESETS = {
    JERSEY_MATTE: {
        roughness: 0.6,
        metalness: 0.0,
        side: 'FrontSide'
    },
    SKIN_REALISTIC: {
        roughness: 0.4,
        metalness: 0.0,
        side: 'FrontSide',
        subsurfaceScattering: true
    },
    BOOT_LEATHER: {
        roughness: 0.3,
        metalness: 0.2,
        side: 'FrontSide'
    },
    METAL_CHROMED: {
        roughness: 0.2,
        metalness: 0.9,
        side: 'DoubleSide'
    },
    GRASS_FIELD: {
        roughness: 0.9,
        metalness: 0.0,
        side: 'FrontSide',
        map: 'grass_texture',
        normalMap: 'grass_normal'
    }
};

// Animation presets for player movements
export const ANIMATION_PRESETS = {
    IDLE: {
        duration: 2.0,
        loop: true,
        intensity: 0.1
    },
    WALK: {
        duration: 1.2,
        loop: true,
        intensity: 0.3
    },
    RUN: {
        duration: 0.8,
        loop: true,
        intensity: 0.5
    },
    SPRINT: {
        duration: 0.6,
        loop: true,
        intensity: 0.7
    },
    KICK: {
        duration: 0.5,
        loop: false,
        intensity: 1.0
    },
    JUMP: {
        duration: 1.0,
        loop: false,
        intensity: 1.0
    },
    CELEBRATE: {
        duration: 2.0,
        loop: false,
        intensity: 0.8
    }
};

// Export a function to validate and apply configuration
export function validateAndApplyConfig() {
    // Add any validation logic here
    console.log('3D Assets Configuration loaded:', ASSETS_CONFIG);
    return ASSETS_CONFIG;
}

// Export a function to enable/disable features at runtime
export function toggleFeature(featureName, enabled) {
    const path = featureName.split('.');
    let obj = ASSETS_CONFIG;
    
    for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
    }
    
    obj[path[path.length - 1]] = enabled;
    console.log(`Feature ${featureName} set to ${enabled}`);
}
