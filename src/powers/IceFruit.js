/**
 * Ice Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';
import { AttackImplementations } from './common/AttackImplementations.js';
import { EffectsManager } from './common/EffectsManager.js';
import { fruitConfigurations } from './common/FruitConfigurations.js';

export class IceFruit extends Fruit {
    constructor(engine, options = {}) {
        // Get ice fruit configuration
        const config = fruitConfigurations.ice;
        
        // Set default options for Ice Fruit
        const iceOptions = {
            name: options.name || config.name,
            type: config.type,
            power: options.power || config.power,
            attacks: config.attacks,
            ...options
        };
        
        super(engine, iceOptions);
        
        // Special properties for Ice Fruit
        this.freezeDuration = config.specialProperties.freezeDuration;
        this.slowEffect = config.specialProperties.slowEffect;
        
        // Store colors for attacks
        this.colors = config.colors;
        
        // Store attack settings
        this.attackSettings = config.attackSettings;
    }
    
    /**
     * Use a basic attack - Ice Spike
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Basic Attack'];
            
            // Create an ice spike projectile using common implementation
            const iceSpike = AttackImplementations.createProjectileAttack(this, pos, dir, {
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
     * Use a special attack - Ice Wall
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Special Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Special Attack'];
            
            // Create an ice wall area effect using common implementation
            const iceWall = AttackImplementations.createAreaEffectAttack(this, pos, {
                color: this.colors.secondary,
                radius: attackSettings.radius,
                lifetime: attackSettings.lifetime,
                opacity: attackSettings.opacity,
                type: this.type,
                attackName: 'Special Attack',
                fruitStore: fruitStore
            });
            
            // Create ice particles
            EffectsManager.createParticles(this, pos, {
                count: 10,
                color: this.colors.secondary,
                type: this.type,
                lifetime: 1.2,
                size: 0.25,
                speed: 2
            });
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Blizzard
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ultimate Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Ultimate Attack'];
            
            // Create a blizzard area effect using common implementation
            const blizzard = AttackImplementations.createAreaEffectAttack(this, pos, {
                color: this.colors.ultimate,
                radius: attackSettings.radius,
                lifetime: attackSettings.lifetime,
                opacity: attackSettings.opacity,
                type: this.type,
                attackName: 'Ultimate Attack',
                fruitStore: fruitStore
            });
            
            // Create ice particles
            EffectsManager.createParticles(this, pos, {
                count: 25,
                color: this.colors.ultimate,
                type: this.type,
                lifetime: 2,
                size: 0.3,
                speed: 3.5
            });
            
            return true;
        });
    }
    
    /**
     * Create an ice particle for effects (disabled)
     */
    _createIceParticle(position) {
        // Disabled to remove particle effects
        return null;
    }
}