/**
 * Ice Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';

export class IceFruit extends Fruit {
    constructor(engine, options = {}) {
        // Set default options for Ice Fruit
        const iceOptions = {
            name: options.name || 'Ice Fruit',
            type: 'ice',
            power: options.power || 15,
            attacks: ['Ice Spike', 'Ice Wall', 'Blizzard'],
            ...options
        };
        
        super(engine, iceOptions);
        
        // Special properties for Ice Fruit
        this.freezeDuration = 2; // seconds
        this.slowEffect = 0.5; // 50% speed reduction
    }
    
    /**
     * Use a basic attack - Ice Spike
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ice Spike', position, direction, (pos, dir) => {
            // Set cooldown
            this.cooldowns['Ice Spike'] = 0.8; // 0.8 second cooldown
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Ice Wall
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ice Wall', position, direction, (pos, dir) => {
            // Set cooldown
            this.cooldowns['Ice Wall'] = 8; // 8 second cooldown
            this.cooldowns['special'] = 8; // General special attack cooldown
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Blizzard
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Blizzard', position, direction, (pos, dir) => {
            
            // Set cooldown
            this.cooldowns['Blizzard'] = 25; // 25 second cooldown
            
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