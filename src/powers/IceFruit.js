/**
 * Ice Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';

export class IceFruit extends Fruit {
    constructor(engine, options = {}) {
        // Set default options for Ice Fruit
        const iceOptions = {
            name: options.name || 'Ice Fruit',
            type: 'ice',
            power: options.power || 35,
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
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Check for enemies in range
            this.checkEnemiesInRange(pos, 3, fruitStore.getFruit(this.name).damageValues['Basic Attack'], 'ice');
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Ice Wall
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Special Attack', position, direction, (pos, dir) => {
            // Apply damage to enemies in range
            this.checkEnemiesInRange(wallPos, 4, fruitStore.getFruit(this.name).damageValues['Special Attack'], 'ice');
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Blizzard
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ultimate Attack', position, direction, (pos, dir) => {
            // Apply damage to enemies in range
            this.checkEnemiesInRange(pos, 8, fruitStore.getFruit(this.name).damageValues['Ultimate Attack'], 'ice');
            
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