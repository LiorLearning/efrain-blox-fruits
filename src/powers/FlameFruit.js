/**
 * Flame Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';

export class FlameFruit extends Fruit {
    constructor(engine, options = {}) {
        // Set default options for Flame Fruit
        const flameOptions = {
            name: options.name || 'Flame Fruit',
            type: 'flame',
            power: options.power || 20,
            attacks: ['Fireball', 'Flame Wave', 'Inferno'],
            ...options
        };
        
        super(engine, flameOptions);
        
        // Special properties for Flame Fruit
        this.burnDuration = 3; // seconds
        this.burnDamage = 2; // damage per second
    }
    
    /**
     * Use a basic attack - Fireball
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Fireball', position, direction, (pos, dir) => {
            // Set cooldown
            this.cooldowns['Fireball'] = 1; // 1 second cooldown
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Flame Wave
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Flame Wave', position, direction, (pos, dir) => {
            // Set longer cooldown for special attack
            this.cooldowns['Flame Wave'] = 5; // 5 seconds cooldown
            this.cooldowns['special'] = 5; // General special attack cooldown
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Inferno
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Inferno', position, direction, (pos, dir) => {
            // Set very long cooldown for ultimate
            this.cooldowns['Inferno'] = 30; // 30 seconds cooldown
            
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