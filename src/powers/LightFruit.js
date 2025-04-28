/**
 * Light Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';

export class LightFruit extends Fruit {
    constructor(engine, options = {}) {
        // Set default options for Light Fruit
        const lightOptions = {
            name: options.name || 'Light Fruit',
            type: 'light',
            power: options.power || 32,
            attacks: options.attacks || ['Light Beam', 'Flash Step', 'Solar Flare'],
            ...options
        };
        
        super(engine, lightOptions);
        
        // Special properties for Light Fruit
        this.speedBoost = 2; // Speed multiplier for movement
    }
    
    /**
     * Use a basic attack - Light Beam
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Apply damage to enemies in a straight line
            this.checkEnemiesInRange(pos, 6, fruitStore.getFruit(this.name).damageValues['Basic Attack'], 'light');
            return true;
        });
    }
    
    /**
     * Use a special attack - Flash Step
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Special Attack', position, direction, (pos, dir) => {
            // Apply damage to enemies around the player
            this.checkEnemiesInRange(pos, 5, fruitStore.getFruit(this.name).damageValues['Special Attack'], 'light');
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Solar Flare
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ultimate Attack', position, direction, (pos, dir) => {
            // Apply damage to all enemies in a wide area
            this.checkEnemiesInRange(pos, 15, fruitStore.getFruit(this.name).damageValues['Ultimate Attack'], 'light');
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