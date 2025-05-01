/**
 * Magma Fruit power class
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';
import { AttackImplementations } from './common/AttackImplementations.js';
import { EffectsManager } from './common/EffectsManager.js';
import { fruitConfigurations } from './common/FruitConfigurations.js';

export class MagmaFruit extends Fruit {
    constructor(engine, options = {}) {
        // Get magma fruit configuration
        const config = fruitConfigurations.magma;
        
        // Set default options for Magma Fruit
        const magmaOptions = {
            name: options.name || config.name,
            type: config.type,
            power: options.power || config.power,
            attacks: config.attacks,
            ...options
        };
        
        super(engine, magmaOptions);
        
        // Special properties for Magma Fruit
        this.burnDuration = config.specialProperties.burnDuration;
        this.burnDamage = config.specialProperties.burnDamage;
        this.terrainDamage = config.specialProperties.terrainDamage;
        
        // Store colors for attacks
        this.colors = config.colors;
        
        // Store attack settings
        this.attackSettings = config.attackSettings;
    }
    
    /**
     * Use a basic attack - Magma Ball
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Basic Attack'];
            
            // Create a magma ball projectile using common implementation
            const magmaBall = AttackImplementations.createProjectileAttack(this, pos, dir, {
                color: this.colors.primary,
                speed: attackSettings.speed,
                lifetime: attackSettings.lifetime,
                type: this.type,
                attackName: 'Basic Attack',
                fruitStore: fruitStore,
                immediateRange: attackSettings.range
            });
            
            // Create magma particles
            EffectsManager.createParticles(this, pos, {
                count: 8,
                color: this.colors.primary,
                type: this.type,
                lifetime: 1.5,
                size: 0.35,
                speed: 2
            });
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Lava Slam
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Special Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Special Attack'];
            
            // Create a lava field in front of the player
            const fieldPosition = new THREE.Vector3(
                pos.x + dir.x * 5,
                pos.y,
                pos.z + dir.z * 5
            );
            
            // Create a lava field area effect using common implementation
            const lavaField = AttackImplementations.createAreaEffectAttack(this, fieldPosition, {
                color: this.colors.secondary,
                radius: attackSettings.radius,
                lifetime: attackSettings.lifetime,
                opacity: 0.7,
                type: this.type,
                attackName: 'Special Attack',
                fruitStore: fruitStore
            });
            
            // Create magma particles
            EffectsManager.createParticles(this, fieldPosition, {
                count: 20,
                color: this.colors.secondary,
                type: this.type,
                lifetime: 2,
                size: 0.4,
                speed: 1.5
            });
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Volcanic Eruption
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ultimate Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Ultimate Attack'];
            
            // Create a volcanic eruption area effect using common implementation
            const volcanicEruption = AttackImplementations.createAreaEffectAttack(this, pos, {
                color: this.colors.ultimate,
                radius: attackSettings.radius,
                lifetime: attackSettings.lifetime,
                opacity: 0.8,
                type: this.type,
                attackName: 'Ultimate Attack',
                fruitStore: fruitStore
            });
            
            // Create intense magma particles erupting upward
            EffectsManager.createParticles(this, pos, {
                count: 35,
                color: this.colors.ultimate,
                type: this.type,
                lifetime: 3,
                size: 0.5,
                speed: 4
            });
            
            // Create secondary eruption points
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * (attackSettings.radius * 0.7);
                
                const eruptionPos = new THREE.Vector3(
                    pos.x + Math.cos(angle) * distance,
                    pos.y,
                    pos.z + Math.sin(angle) * distance
                );
                
                // Delayed secondary eruptions
                setTimeout(() => {
                    EffectsManager.createParticles(this, eruptionPos, {
                        count: 15,
                        color: this.colors.secondary,
                        type: this.type,
                        lifetime: 2,
                        size: 0.4,
                        speed: 3
                    });
                }, i * 300); // Staggered timing
            }
            
            return true;
        });
    }
    
    /**
     * Create a magma particle for effects (disabled)
     */
    _createMagmaParticle(position, isLarge = false) {
        // Disabled to remove particle effects
        return null;
    }
    
    /**
     * Create a magma bubble effect for lava field (disabled)
     */
    _createMagmaBubble(position) {
        // Disabled to remove particle effects
        return null;
    }
}