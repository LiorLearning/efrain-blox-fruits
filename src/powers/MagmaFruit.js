/**
 * Magma Fruit power class
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';

export class MagmaFruit extends Fruit {
    constructor(engine, options = {}) {
        super(engine, {
            name: 'Magma Fruit',
            type: 'magma',
            power: options.power || 25,
            attacks: ['Magma Ball', 'Lava Field', 'Volcanic Eruption']
        });
    }
    
    /**
     * Use a basic attack - Magma Ball
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Apply damage to enemies in range
            this.checkEnemiesInRange(pos, 4, fruitStore.getFruit(this.name).damageValues['Basic Attack'], 'magma');
            return true;
        });
    }
    
    /**
     * Use a special attack - Lava Field
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Special Attack', position, direction, (pos, dir) => {
            // Create a lava field in front of the player
            const fieldPosition = new THREE.Vector3(
                pos.x + dir.x * 5,
                pos.y,
                pos.z + dir.z * 5
            );
            
            // Apply damage to enemies in range
            this.checkEnemiesInRange(fieldPosition, 6, fruitStore.getFruit(this.name).damageValues['Special Attack'], 'magma');
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Volcanic Eruption
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ultimate Attack', position, direction, (pos, dir) => {
            // Apply damage to enemies in a wide range
            this.checkEnemiesInRange(pos, 10, fruitStore.getFruit(this.name).damageValues['Ultimate Attack'], 'magma');
            
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