/**
 * Flame Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';
import { AttackImplementations } from './common/AttackImplementations.js';
import { EffectsManager } from './common/EffectsManager.js';
import { fruitConfigurations } from './common/FruitConfigurations.js';

export class FlameFruit extends Fruit {
    constructor(engine, options = {}) {
        // Get flame fruit configuration
        const config = fruitConfigurations.flame;
        
        // Set default options for Flame Fruit
        const flameOptions = {
            name: options.name || config.name,
            type: config.type,
            power: options.power || config.power,
            attacks: config.attacks,
            ...options
        };
        
        super(engine, flameOptions);
        
        // Special properties for Flame Fruit
        this.burnDuration = config.specialProperties.burnDuration;
        this.burnDamage = config.specialProperties.burnDamage;
        
        // Store colors for attacks
        this.colors = config.colors;
        
        // Store attack settings
        this.attackSettings = config.attackSettings;
    }
    
    /**
     * Use a basic attack - Fireball
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Basic Attack'];
            
            // Create a fireball projectile using common implementation
            const fireball = AttackImplementations.createProjectileAttack(this, pos, dir, {
                color: this.colors.primary,
                speed: attackSettings.speed,
                lifetime: attackSettings.lifetime,
                type: this.type,
                attackName: 'Basic Attack',
                fruitStore: fruitStore,
                immediateRange: attackSettings.range
            });
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Flame Wave
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Special Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Special Attack'];
            
            // Create a flame wave area effect using common implementation
            const flameWave = AttackImplementations.createAreaEffectAttack(this, pos, {
                color: this.colors.secondary,
                radius: attackSettings.radius,
                lifetime: attackSettings.lifetime,
                opacity: attackSettings.opacity,
                type: this.type,
                attackName: 'Special Attack',
                fruitStore: fruitStore
            });
            
            // Create flame particles with reduced count and lifetime
            EffectsManager.createParticles(this, pos, {
                count: 10, // Reduced from 15
                color: this.colors.secondary,
                type: this.type,
                lifetime: 1, // Reduced from 1.5
                size: 0.3,
                speed: 3
            });
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Inferno
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ultimate Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Ultimate Attack'];
            
            // Create a large inferno area effect using common implementation
            const inferno = AttackImplementations.createAreaEffectAttack(this, pos, {
                color: this.colors.ultimate,
                radius: attackSettings.radius,
                lifetime: attackSettings.lifetime,
                opacity: attackSettings.opacity,
                type: this.type,
                attackName: 'Ultimate Attack',
                fruitStore: fruitStore
            });
            
            // Create flame particles with reduced count and lifetime
            EffectsManager.createParticles(this, pos, {
                count: 20, // Reduced from 30
                color: this.colors.ultimate,
                type: this.type,
                lifetime: 2, // Reduced from 3
                size: 0.4,
                speed: 4
            });
            
            return true;
        });
    }
    
    /**
     * Create a flame particle for effects (disabled)
     */
    _createFlameParticle(position) {
        // Disabled to remove particle effects
        return null;
    }
}