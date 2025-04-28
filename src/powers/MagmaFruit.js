/**
 * Magma Fruit power class
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';

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
        return this._useAttack('Magma Ball', position, direction, (pos, dir) => {
            // Set cooldown
            this.cooldowns['Magma Ball'] = 1.2; // 1.2 second cooldown
            return true;
        });
    }
    
    /**
     * Use a special attack - Lava Field
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Lava Field', position, direction, (pos, dir) => {
            // Create a lava field in front of the player
            const fieldPosition = new THREE.Vector3(
                pos.x + dir.x * 5,
                pos.y,
                pos.z + dir.z * 5
            );
            
            // Create area effect
            const lavaField = this.createAreaEffect(fieldPosition, {
                radius: 6,
                color: 0xff3300,
                damage: this.power * 0.8,
                lifetime: 5,
                type: 'lavaField'
            });
            
            // Set cooldown
            this.cooldowns['Lava Field'] = 10; // 10 second cooldown
            this.cooldowns['special'] = 10; // General special attack cooldown
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Volcanic Eruption
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Volcanic Eruption', position, direction, (pos, dir) => {
            // Create a volcanic eruption at the player's position
            const eruption = this.createAreaEffect(pos, {
                radius: 15,
                color: 0xff0000,
                damage: this.power * 3,
                lifetime: 8,
                type: 'eruption'
            });
            
            // Set very long cooldown for ultimate
            this.cooldowns['Volcanic Eruption'] = 40; // 40 second cooldown
            
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