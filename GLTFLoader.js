// GLTFLoader - Using Three.js from global scope
// This is a shim that makes GLTFLoader available when loaded via script tag
if (typeof THREE !== 'undefined' && THREE.GLTFLoader) {
    // GLTFLoader is available from the global THREE object
    window.GLTFLoader = THREE.GLTFLoader;
}
