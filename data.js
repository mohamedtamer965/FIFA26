// Constant Data and Configurations

export const TEAMS_DB = [
    { id: 'brazil', name: 'Brazil', color: '#ffe100', logo: '🇧🇷', att: 87, mid: 85, def: 83, roster: ['Ederson', 'Marquinhos', 'Casemiro', 'Vinicius', 'Neymar'] },
    { id: 'argentina', name: 'Argentina', color: '#75aadb', logo: '🇦🇷', att: 88, mid: 84, def: 82, roster: ['Martinez', 'Romero', 'De Paul', 'Messi', 'Alvarez'] },
    { id: 'france', name: 'France', color: '#002395', logo: '🇫🇷', att: 89, mid: 86, def: 84, roster: ['Maignan', 'Saliba', 'Tchouameni', 'Griezmann', 'Mbappé'] },
    { id: 'germany', name: 'Germany', color: '#ffffff', logo: '🇩🇪', att: 84, mid: 87, def: 85, roster: ['Neuer', 'Rudiger', 'Kimmich', 'Musiala', 'Havertz'] },
    { id: 'spain', name: 'Spain', color: '#aa151b', logo: '🇪🇸', att: 83, mid: 88, def: 84, roster: ['Simon', 'Laporte', 'Rodri', 'Pedri', 'Morata'] },
    { id: 'custom', name: 'Custom Utd', color: '#c8102e', logo: '🛡️', att: 80, mid: 80, def: 80, roster: ['Keeper', 'Defender', 'Mid', 'Winger', 'Striker'] }
];

export const FORMATIONS = {
    '1-2-1': [[0, 48], [-15, 20], [15, 20], [0, 5], [0, -10]],
    '2-2':   [[0, 48], [-12, 25], [12, 25], [-10, -5], [10, -5]],
    '1-1-2': [[0, 48], [0, 25], [0, 5], [-12, -15], [12, -15]]
};

export const CONFIG = {
    FIELD_W: 60, FIELD_L: 90, 
    GOAL_W: 10, GOAL_H: 3.0, GOAL_DEPTH: 2.5,
    PLAYER_H: 1.8, BALL_RAD: 0.35, // Slightly larger ball for visibility
    
    // Physics
    FRICTION: 0.975, // Grass friction
    GRAVITY: 9.8,
    BOUNCE: 0.6,
    
    // Gameplay
    SHOOT_POW_MAX: 35.0, 
    PASS_POW: 18.0, 
    THROUGH_POW: 22.0,
    DRIBBLE_FORCE: 12.0, // Force applied when touching ball
    CONTROL_DIST: 1.5,   // How close to be to control ball
    
    // Stats
    STAMINA_MAX: 100, STAMINA_DRAIN: 10.0, STAMINA_REGEN: 2.0,
    
    // Animation
    JUMP_HEIGHT: 1.2,
    JUMP_DURATION: 0.8,
    DIVE_DURATION: 1.0,
    THROW_DURATION: 0.8
};