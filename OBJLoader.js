// OBJLoader - Using Three.js from global scope
// This is a shim that makes OBJLoader available when loaded via script tag
if (typeof THREE !== 'undefined' && THREE.OBJLoader) {
    // OBJLoader is available from the global THREE object
    window.OBJLoader = THREE.OBJLoader;
}
