/**
 * Manager for updating and managing all visual effects in the game
 */
import * as THREE from 'three';

export class EffectsUpdateManager {
    /**
     * Update all effects
     * @param {Object} engine - The game engine
     * @param {Number} deltaTime - Time since last frame in seconds
     */
    static updateEffects(engine, deltaTime) {
        if (!engine || !engine.effectsToUpdate || !Array.isArray(engine.effectsToUpdate)) {
            return;
        }

        // Process effects from end to start to safely remove items
        for (let i = engine.effectsToUpdate.length - 1; i >= 0; i--) {
            const effect = engine.effectsToUpdate[i];
            
            // Skip invalid effects
            if (!effect || !effect.userData || typeof effect.userData.update !== 'function') {
                engine.effectsToUpdate.splice(i, 1);
                continue;
            }
            
            // Update effect and remove if it returns false
            const keepEffect = effect.userData.update(deltaTime);
            if (!keepEffect) {
                engine.effectsToUpdate.splice(i, 1);
            }
        }
    }
    
    /**
     * Clean up all effects
     * @param {Object} engine - The game engine
     */
    static cleanupAllEffects(engine) {
        if (!engine || !engine.effectsToUpdate || !Array.isArray(engine.effectsToUpdate)) {
            return;
        }
        
        const scene = engine.renderer?.scene;
        if (!scene) return;
        
        // Remove all effects from the scene
        for (let i = engine.effectsToUpdate.length - 1; i >= 0; i--) {
            const effect = engine.effectsToUpdate[i];
            if (effect) {
                scene.remove(effect);
                
                // Dispose geometries and materials
                if (effect.geometry) effect.geometry.dispose();
                if (effect.material) {
                    if (Array.isArray(effect.material)) {
                        effect.material.forEach(material => material.dispose());
                    } else {
                        effect.material.dispose();
                    }
                }
            }
            engine.effectsToUpdate.splice(i, 1);
        }
    }
} 