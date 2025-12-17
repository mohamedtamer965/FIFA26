// Model Utilities - Helper functions for working with 3D models
// Note: THREE is loaded globally via <script> tags in index.html
import { ASSETS_CONFIG } from './assetsConfig.js';

export class ModelUtilities {
    /**
     * Apply team colors to a player model
     */
    static applyTeamColors(playerModel, jerseyColor, shortsColor = 0x000000, socksColor = 0xffffff) {
        playerModel.traverse(child => {
            if (child.isMesh) {
                if (child.material.name === 'jersey' || child.name.includes('body')) {
                    const mat = child.material.clone();
                    mat.color.setHex(jerseyColor);
                    child.material = mat;
                } else if (child.name.includes('short')) {
                    const mat = child.material.clone();
                    mat.color.setHex(shortsColor);
                    child.material = mat;
                } else if (child.name.includes('sock')) {
                    const mat = child.material.clone();
                    mat.color.setHex(socksColor);
                    child.material = mat;
                }
            }
        });
    }

    /**
     * Scale a model to match FIFA standard dimensions
     */
    static scaleToFIFAStandards(model, playerHeight = 1.8) {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const currentHeight = size.y;
        const scale = playerHeight / currentHeight;
        
        model.scale.multiplyScalar(scale);
        return scale;
    }

    /**
     * Setup model for optimized rendering
     */
    static optimizeForRendering(model) {
        let meshCount = 0;
        let triCount = 0;

        model.traverse(child => {
            if (child.isMesh) {
                meshCount++;
                
                // Enable shadows
                if (ASSETS_CONFIG.PLAYER.CAST_SHADOWS) child.castShadow = true;
                if (ASSETS_CONFIG.PLAYER.RECEIVE_SHADOWS) child.receiveShadow = true;

                // Count triangles
                if (child.geometry.index) {
                    triCount += child.geometry.index.count / 3;
                } else {
                    triCount += child.geometry.attributes.position.count / 3;
                }

                // Freeze transform for better performance
                if (child.geometry.attributes.position.usage === THREE.StaticDrawUsage) {
                    // Already optimized
                } else {
                    child.geometry.computeBoundingBox();
                }
            }
        });

        if (ASSETS_CONFIG.DEBUG.LOG_ASSET_LOADING) {
            console.log(`Model optimized: ${meshCount} meshes, ~${Math.round(triCount)} triangles`);
        }

        return { meshCount, triCount };
    }

    /**
     * Create LOD (Level of Detail) version of a model
     */
    static createLODModel(originalModel) {
        const lod = new THREE.LOD();
        
        // High detail (0-50 units)
        lod.addLevel(originalModel.clone(), 0);
        
        // Medium detail (50-150 units)
        const simplifiedMedium = this.simplifyModel(originalModel, 0.7);
        lod.addLevel(simplifiedMedium, 50);
        
        // Low detail (150+ units)
        const simplifiedLow = this.simplifyModel(originalModel, 0.3);
        lod.addLevel(simplifiedLow, 150);
        
        return lod;
    }

    /**
     * Simplify model geometry (removes vertices)
     */
    static simplifyModel(model, simplificationRatio = 0.5) {
        const simplified = model.clone();
        
        simplified.traverse(child => {
            if (child.isMesh && child.geometry) {
                // Remove every nth vertex based on simplification ratio
                const positions = child.geometry.attributes.position.array;
                const newPositions = [];
                const stride = Math.ceil(1 / simplificationRatio);
                
                for (let i = 0; i < positions.length; i += stride * 3) {
                    newPositions.push(positions[i], positions[i + 1], positions[i + 2]);
                }
                
                // Update geometry (simplified version)
                child.geometry.setAttribute('position', 
                    new THREE.BufferAttribute(new Float32Array(newPositions), 3));
                child.geometry.computeVertexNormals();
            }
        });
        
        return simplified;
    }

    /**
     * Create a low-poly version of a model for performance
     */
    static createLowPolyVersion(model) {
        const lowPoly = model.clone();
        
        lowPoly.traverse(child => {
            if (child.isMesh) {
                // Combine all meshes into single geometry
                if (lowPoly.children.length > 1) {
                    const merger = new THREE.BufferGeometry();
                    let combined = new THREE.Mesh(merger);
                    
                    lowPoly.children.forEach(mesh => {
                        if (mesh.isMesh) {
                            combined.geometry.merge(mesh.geometry);
                        }
                    });
                }
                
                // Reduce shadow complexity
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        
        return lowPoly;
    }

    /**
     * Apply animation to a mesh (non-skeletal)
     */
    static applySimpleAnimation(mesh, animationType, duration = 1.0, intensity = 1.0) {
        mesh.userData.animation = {
            type: animationType,
            duration: duration,
            intensity: intensity,
            elapsed: 0,
            isPlaying: true
        };

        return mesh;
    }

    /**
     * Update simple animations
     */
    static updateAnimations(meshArray, deltaTime) {
        meshArray.forEach(mesh => {
            if (mesh.userData.animation && mesh.userData.animation.isPlaying) {
                const anim = mesh.userData.animation;
                anim.elapsed += deltaTime;
                
                if (anim.elapsed > anim.duration) {
                    anim.elapsed = 0;
                }
                
                const progress = anim.elapsed / anim.duration;
                const factor = Math.sin(progress * Math.PI * 2);
                
                switch (anim.type) {
                    case 'walk':
                        // Legs swing
                        if (mesh.children[4]) {
                            mesh.children[4].rotation.x = factor * 0.5 * anim.intensity;
                        }
                        if (mesh.children[5]) {
                            mesh.children[5].rotation.x = -factor * 0.5 * anim.intensity;
                        }
                        break;
                        
                    case 'celebrate':
                        // Arms up and rotate
                        if (mesh.children[0]) {
                            mesh.children[0].rotation.z = factor * 0.3 * anim.intensity;
                        }
                        if (mesh.children[1]) {
                            mesh.children[1].rotation.z = -factor * 0.3 * anim.intensity;
                        }
                        mesh.position.y = Math.abs(factor) * 0.1 * anim.intensity;
                        break;
                        
                    case 'idle':
                        // Subtle sway
                        mesh.rotation.y = factor * 0.1 * anim.intensity;
                        break;
                }
            }
        });
    }

    /**
     * Apply material to entire model
     */
    static applyMaterialToModel(model, material) {
        model.traverse(child => {
            if (child.isMesh) {
                child.material = material.clone();
            }
        });
    }

    /**
     * Get bounding box of model
     */
    static getBoundingBox(model) {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        return { box, size, center };
    }

    /**
     * Freeze model for better performance
     */
    static freezeModel(model) {
        model.traverse(child => {
            if (child.isMesh) {
                child.geometry.attributes.position.usage = THREE.StaticDrawUsage;
                child.geometry.attributes.position.needsUpdate = false;
                
                if (child.geometry.attributes.normal) {
                    child.geometry.attributes.normal.usage = THREE.StaticDrawUsage;
                    child.geometry.attributes.normal.needsUpdate = false;
                }
            }
        });
    }

    /**
     * Create wireframe preview of model
     */
    static createWireframePreview(model) {
        const wireframe = model.clone();
        
        wireframe.traverse(child => {
            if (child.isMesh) {
                child.material = new THREE.MeshBasicMaterial({
                    wireframe: true,
                    color: 0x00ff00
                });
            }
        });
        
        return wireframe;
    }

    /**
     * Export model statistics
     */
    static getModelStats(model) {
        let meshCount = 0;
        let triCount = 0;
        let materialCount = 0;
        let textureCount = 0;
        const materials = new Set();
        const textures = new Set();

        model.traverse(child => {
            if (child.isMesh) {
                meshCount++;
                
                // Count triangles
                if (child.geometry.index) {
                    triCount += child.geometry.index.count / 3;
                } else {
                    triCount += child.geometry.attributes.position.count / 3;
                }

                // Count materials and textures
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        materials.add(mat.uuid);
                        if (mat.map) textures.add(mat.map.uuid);
                    });
                } else if (child.material) {
                    materials.add(child.material.uuid);
                    if (child.material.map) textures.add(child.material.map.uuid);
                }
            }
        });

        return {
            meshCount,
            triCount: Math.round(triCount),
            materialCount: materials.size,
            textureCount: textures.size,
            boundingBox: this.getBoundingBox(model)
        };
    }

    /**
     * Clone and batch models for performance
     */
    static batchCloneModels(model, count) {
        const batch = [];
        
        for (let i = 0; i < count; i++) {
            const clone = model.clone();
            batch.push(clone);
        }
        
        return batch;
    }

    /**
     * Convert a model to use instancing for better performance with many copies
     */
    static convertToInstanced(model, count) {
        const instanced = new THREE.InstancedMesh(
            model.geometry,
            model.material,
            count
        );

        for (let i = 0; i < count; i++) {
            const matrix = new THREE.Matrix4();
            matrix.makeTranslation(
                Math.random() * 100 - 50,
                0,
                Math.random() * 100 - 50
            );
            instanced.setMatrixAt(i, matrix);
        }

        return instanced;
    }

    /**
     * Add outline to model (useful for player highlighting)
     */
    static addOutline(model, outlineColor = 0x00ff00, outlineWidth = 0.02) {
        const outlinePass = {
            selectedObjects: [model]
        };
        
        // Apply simple outline by duplicating geometry with scale
        model.traverse(child => {
            if (child.isMesh) {
                const outlineGeo = child.geometry.clone();
                const outlineMat = new THREE.MeshBasicMaterial({
                    color: outlineColor,
                    side: THREE.BackSide
                });
                
                const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
                outlineMesh.scale.multiplyScalar(1 + outlineWidth);
                
                child.add(outlineMesh);
            }
        });
        
        return model;
    }
}

// Export a quick setup function for common tasks
export function quickSetupModel(model, config = {}) {
    const {
        scale = 1.0,
        optimize = true,
        addOutline = false,
        outlineColor = 0x00ff00,
        freeze = true,
        teamColors = null
    } = config;

    if (scale !== 1.0) {
        model.scale.multiplyScalar(scale);
    }

    if (optimize) {
        ModelUtilities.optimizeForRendering(model);
    }

    if (teamColors) {
        ModelUtilities.applyTeamColors(
            model,
            teamColors.jersey,
            teamColors.shorts,
            teamColors.socks
        );
    }

    if (addOutline) {
        ModelUtilities.addOutline(model, outlineColor);
    }

    if (freeze) {
        ModelUtilities.freezeModel(model);
    }

    return model;
}
