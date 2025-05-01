/**
 * Light Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';
import { AttackImplementations } from './common/AttackImplementations.js';
import { EffectsManager } from './common/EffectsManager.js';
import { fruitConfigurations } from './common/FruitConfigurations.js';

export class LightFruit extends Fruit {
    constructor(engine, options = {}) {
        // Get light fruit configuration
        const config = fruitConfigurations.light;
        
        // Set default options for Light Fruit
        const lightOptions = {
            name: options.name || config.name,
            type: config.type,
            power: options.power || config.power,
            attacks: config.attacks,
            ...options
        };
        
        super(engine, lightOptions);
        
        // Special properties for Light Fruit
        this.blindDuration = config.specialProperties.blindDuration;
        this.speedBoost = config.specialProperties.speedBoost;
        
        // Store colors for attacks
        this.colors = config.colors;
        
        // Store attack settings
        this.attackSettings = config.attackSettings;
    }
    
    /**
     * Use a basic attack - Light Beam
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Basic Attack'];
            
            // Create a light beam projectile using common implementation
            const lightBeam = AttackImplementations.createProjectileAttack(this, pos, dir, {
                color: this.colors.primary,
                speed: attackSettings.speed,
                lifetime: attackSettings.lifetime,
                type: this.type,
                attackName: 'Basic Attack',
                fruitStore: fruitStore,
                immediateRange: attackSettings.range
            });
            
            // Create light particles with reduced count and lifetime
            EffectsManager.createParticles(this, pos, {
                count: 8, // Reduced from 12
                color: this.colors.primary,
                type: this.type,
                lifetime: 0.7, // Reduced from 1
                size: 0.2,
                speed: 4
            });
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Flash Step
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Special Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Special Attack'];
            
            // Create a flash step self-buff using common implementation
            const flashStep = AttackImplementations.createSelfBuffAttack(this, pos, {
                color: this.colors.secondary,
                radius: attackSettings.radius,
                duration: attackSettings.lifetime,
                opacity: attackSettings.opacity,
                type: this.type,
                attackName: 'Special Attack',
                fruitStore: fruitStore,
                buffCallback: (fruit, position, damage) => {
                    // Apply the teleport/speed boost logic here
                    // Calculate new position based on direction
                    const teleportDistance = 5; // 5 units forward
                    const newPos = new THREE.Vector3(
                        position.x + dir.x * teleportDistance,
                        position.y + dir.y * teleportDistance,
                        position.z + dir.z * teleportDistance
                    );
                    
                    // Check for enemies at destination
                    fruit.checkEnemiesInRange(newPos, 3, damage, fruit.type);
                    
                    // Apply speed boost to player (would be handled by game logic)
                    console.log(`Speed boost applied: ${this.speedBoost}x for ${attackSettings.lifetime} seconds`);
                }
            });
            
            // Create light particles at origin with reduced count and lifetime
            EffectsManager.createParticles(this, pos, {
                count: 15, // Reduced from 20
                color: this.colors.secondary,
                type: this.type,
                lifetime: 0.3, // Reduced from 0.5
                size: 0.3,
                speed: 3
            });
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Solar Flare
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ultimate Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Ultimate Attack'];
            
            // Create a solar flare area effect using common implementation
            const solarFlare = AttackImplementations.createAreaEffectAttack(this, pos, {
                color: this.colors.ultimate,
                radius: attackSettings.radius,
                lifetime: attackSettings.lifetime,
                opacity: attackSettings.opacity,
                type: this.type,
                attackName: 'Ultimate Attack',
                fruitStore: fruitStore
            });
            
            // Create intense light particles with reduced count and lifetime
            EffectsManager.createParticles(this, pos, {
                count: 30, // Reduced from 50
                color: this.colors.ultimate,
                type: this.type,
                lifetime: 1.2, // Reduced from 2
                size: 0.4,
                speed: 6
            });
            
            return true;
        });
    }
    
    /**
     * Create a light particle effect (disabled)
     */
    _createLightParticle(position, size = 0.2) {
        // Disabled to remove particle effects
        return null;
    }
    
    /**
     * Create a light flash effect (disabled)
     */
    _createLightFlash(position, size = 1) {
        // Disabled to remove flash effects
        return null;
    }
}