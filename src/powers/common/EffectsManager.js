/**
 * Common effects manager for all fruits
 */
import * as THREE from 'three';
import { EffectsUpdateManager } from '../../core/EffectsUpdateManager.js';

export class EffectsManager {
    /**
     * Create particles for a specific effect
     * @param {Object} fruit - The fruit instance
     * @param {Object} position - Position to create the particles
     * @param {Object} options - Customization options
     */
    static createParticles(fruit, position, options = {}) {
        const engine = fruit.engine;
        const scene = engine?.renderer?.scene;
        if (!scene) return [];
        
        // Always use player position instead of the provided position
        const player = engine?.gameState?.player;
        const playerPosition = player?.getPosition() || position;
        
        const particles = [];
        const count = options.count || 10;
        const type = options.type || fruit.type;
        const color = options.color || this.getTypeColor(type);
        
        // Create limited number of particles to prevent performance issues
        const actualCount = Math.min(count, 20); // Cap the max particles
        
        for (let i = 0; i < actualCount; i++) {
            const particle = fruit.createParticle(playerPosition, {
                color,
                size: options.size || Math.random() * 0.3 + 0.1,
                lifetime: options.lifetime || Math.random() * 0.5 + 0.2, // Reduced lifetime
                speed: 0, // Set speed to 0 to make particles stationary
                opacity: options.opacity || 0.4,
                type,
                stationary: true // Flag to indicate particles should be stationary
            });
            
            if (particle) {
                particles.push(particle);
            }
        }
        
        return particles;
    }
    
    /**
     * Create a status effect on an entity
     * @param {Object} fruit - The fruit instance
     * @param {Object} entity - The entity to apply the effect to
     * @param {Object} options - Effect options
     */
    static applyStatusEffect(fruit, entity, options = {}) {
        if (!entity || !entity.userData) return false;
        
        // Add status effect to entity
        const effect = {
            type: options.type || fruit.type,
            duration: options.duration || 1,
            remainingTime: options.duration || 1,
            tickDamage: options.tickDamage || 0,
            slowFactor: options.slowFactor || 1,
            source: options.source || 'player'
        };
        
        // Set a maximum duration for any status effect to ensure temporariness
        effect.duration = Math.min(effect.duration, 2); // Cap at 2 seconds max (reduced from 5)
        effect.remainingTime = effect.duration;
        
        // Store effects on entity
        if (!entity.userData.statusEffects) {
            entity.userData.statusEffects = [];
        }
        
        // Add effect if not already present
        const existingEffect = entity.userData.statusEffects.find(e => e.type === effect.type);
        if (existingEffect) {
            // Refresh duration if already exists
            existingEffect.remainingTime = effect.duration;
            if (effect.tickDamage > existingEffect.tickDamage) {
                existingEffect.tickDamage = effect.tickDamage;
            }
            if (effect.slowFactor < existingEffect.slowFactor) {
                existingEffect.slowFactor = effect.slowFactor;
            }
        } else {
            entity.userData.statusEffects.push(effect);
        }
        
        return true;
    }
    
    /**
     * Get a color based on fruit type
     * @param {String} type - The fruit type
     */
    static getTypeColor(type) {
        const colorMap = {
            'flame': 0xff5500,
            'ice': 0x00ccff,
            'bomb': 0x777700,
            'light': 0xffffaa,
            'magma': 0xff3300
        };
        
        return colorMap[type] || 0xffffff;
    }
    
    /**
     * Get particle geometry for a fruit type
     * @param {String} type - The fruit type
     */
    static getTypeGeometry(type) {
        // Each fruit type can have a different particle shape
        switch (type) {
            case 'flame':
                return new THREE.TetrahedronGeometry(0.5, 0);
            case 'ice':
                return new THREE.OctahedronGeometry(0.5, 0);
            case 'bomb':
                return new THREE.SphereGeometry(0.5, 8, 8);
            case 'light':
                return new THREE.DodecahedronGeometry(0.5, 0);
            case 'magma':
                return new THREE.IcosahedronGeometry(0.5, 0);
            default:
                return new THREE.SphereGeometry(0.5, 8, 8);
        }
    }
    
    /**
     * Clean up all active effects
     * @param {Object} engine - Game engine instance
     */
    static cleanupAllEffects(engine) {
        EffectsUpdateManager.cleanupAllEffects(engine);
    }
} 