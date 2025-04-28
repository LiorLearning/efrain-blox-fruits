/**
 * Flame Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';

export class FlameFruit extends Fruit {
    constructor(engine, options = {}) {
        // Set default options for Flame Fruit
        const flameOptions = {
            name: options.name || 'Flame Fruit',
            type: 'flame',
            power: options.power || 40,
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
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Create a fireball projectile
            // // const fireball = this.createProjectile(pos, dir, {
            // //     color: 0xff5500,
            // //     speed: 15,
            // //     damage: fruitStore.getFruit(this.name).damageValues['Basic Attack'],
            // //     type: 'flame'
            // });
            
            // Check for enemies in range (will be done during projectile update)
            return true;
        });
    }
    
    /**
     * Use a special attack - Flame Wave
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Special Attack', position, direction, (pos, dir) => {
            // Create a flame wave area effect
            // const flameWave = this.createAreaEffect(pos, {
            //     color: 0xff3300,
            //     radius: 5,
            //     damage: fruitStore.getFruit(this.name).damageValues['Special Attack'],
            //     lifetime: 2,
            //     opacity: 0.7,
            //     type: 'flame'
            // });
            
            // Apply immediate damage to enemies in range
            this.checkEnemiesInRange(pos, 5, fruitStore.getFruit(this.name).damageValues['Special Attack'], 'flame');
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Inferno
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ultimate Attack', position, direction, (pos, dir) => {
            // Create a large inferno area effect
            // const inferno = this.createAreaEffect(pos, {
            //     color: 0xff0000,
            //     radius: 8,
            //     damage: fruitStore.getFruit(this.name).damageValues['Ultimate Attack'],
            //     lifetime: 5,
            //     opacity: 0.8,
            //     type: 'flame'
            // });
            
            // Apply immediate damage to enemies in range
            this.checkEnemiesInRange(pos, 8, fruitStore.getFruit(this.name).damageValues['Ultimate Attack'], 'flame');
            
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