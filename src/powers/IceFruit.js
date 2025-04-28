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
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Create an ice spike projectile
            const iceSpike = this.createProjectile(pos, dir, {
                color: 0x2196f3,
                speed: 15,
                damage: fruitStore.getFruit(this.name).damageValues['Basic Attack'],
                type: 'ice'
            });
            
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
            // Create an ice wall in front of the player
            const wallPos = new THREE.Vector3(
                pos.x + dir.x * 3,
                pos.y,
                pos.z + dir.z * 3
            );
            
            // Create a wall area effect
            const iceWall = this.createAreaEffect(wallPos, {
                color: 0x90caf9,
                radius: 4,
                damage: fruitStore.getFruit(this.name).damageValues['Special Attack'],
                lifetime: 3,
                opacity: 0.6,
                type: 'ice'
            });
            
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
            // Create a large blizzard area effect
            const blizzard = this.createAreaEffect(pos, {
                color: 0xb3e5fc,
                radius: 8,
                damage: fruitStore.getFruit(this.name).damageValues['Ultimate Attack'],
                lifetime: 5,
                opacity: 0.7,
                type: 'ice'
            });
            
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