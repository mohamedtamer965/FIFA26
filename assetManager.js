// Asset Manager - Handle loading and caching 3D models and textures
// Note: THREE is loaded globally via <script> tags in index.html

const gltfLoader = new THREE.GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const objLoader = new THREE.OBJLoader();

class AssetManager {
    constructor() {
        this.models = new Map();
        this.textures = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Load a GLB/GLTF model
     */
    async loadModel(modelPath, modelName = '') {
        const cacheKey = modelName || modelPath;
        
        // Return cached model if exists
        if (this.models.has(cacheKey)) {
            return this.cloneModel(this.models.get(cacheKey));
        }

        // Return existing loading promise to avoid duplicate loads
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        // Create new loading promise
        const loadPromise = new Promise((resolve, reject) => {
            gltfLoader.load(
                modelPath,
                (gltf) => {
                    const model = gltf.scene;
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    this.models.set(cacheKey, model);
                    this.loadingPromises.delete(cacheKey);
                    resolve(this.cloneModel(model));
                },
                (progress) => {
                    // console.log(`Loading ${cacheKey}: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
                },
                (error) => {
                    console.error(`Failed to load model ${modelPath}:`, error);
                    this.loadingPromises.delete(cacheKey);
                    reject(error);
                }
            );
        });

        this.loadingPromises.set(cacheKey, loadPromise);
        return loadPromise;
    }

    /**
     * Load a texture
     */
    async loadTexture(texturePath, textureName = '') {
        const cacheKey = textureName || texturePath;

        if (this.textures.has(cacheKey)) {
            return this.textures.get(cacheKey);
        }

        return new Promise((resolve, reject) => {
            textureLoader.load(
                texturePath,
                (texture) => {
                    this.textures.set(cacheKey, texture);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error(`Failed to load texture ${texturePath}:`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Clone a model (prevents mutation of original)
     */
    cloneModel(model) {
        return model.clone(true);
    }

    /**
     * Get cached model without loading
     */
    getModel(modelName) {
        return this.models.get(modelName);
    }

    /**
     * Get cached texture
     */
    getTexture(textureName) {
        return this.textures.get(textureName);
    }

    /**
     * Clear all assets
     */
    clear() {
        this.models.clear();
        this.textures.clear();
        this.loadingPromises.clear();
    }

    /**
     * Remove specific asset
     */
    removeAsset(assetName) {
        this.models.delete(assetName);
        this.textures.delete(assetName);
    }
}

export const assetManager = new AssetManager();
