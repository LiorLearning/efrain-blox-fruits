/**
 * Light Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';

export class LightFruit extends Fruit {
    constructor(engine, options = {}) {
        // Set default options for Light Fruit
        const lightOptions = {
            name: options.name || 'Light Fruit',
            type: 'light',
            power: options.power || 7,
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
        return this._useAttack('Light Beam', position, direction, (pos, dir) => {
            // Set cooldown
            this.cooldowns['Light Beam'] = 0.5; // 0.5 second cooldown
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Flash Step
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Flash Step', position, direction, (pos, dir) => {
            // Set cooldown
            this.cooldowns['Flash Step'] = 8; // 8 second cooldown
            this.cooldowns['special'] = 8; // General special cooldown
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Solar Flare
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Solar Flare', position, direction, (pos, dir) => {
            // Set cooldown
            this.cooldowns['Solar Flare'] = 20; // 20 second cooldown
            
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