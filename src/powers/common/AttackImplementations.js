/**
 * Common attack implementations for all fruits
 */
import * as THREE from 'three';

export class AttackImplementations {
    /**
     * Create a projectile attack
     * @param {Object} fruit - The fruit instance
     * @param {Object} position - Position to create the projectile
     * @param {Object} direction - Direction for the projectile
     * @param {Object} options - Customization options
     */
    static createProjectileAttack(fruit, position, direction, options = {}) {
        const attackName = options.attackName || 'Basic Attack';
        const fruitStore = options.fruitStore;
        
        // Create a projectile with appropriate color and effects
        const projectile = fruit.createProjectile(position, direction, {
            color: options.color || 0xffffff,
            speed: options.speed || 15,
            damage: fruitStore.getFruit(fruit.name).damageValues[attackName],
            type: options.type || fruit.type,
            geometry: options.geometry,
            material: options.material,
            lifetime: options.lifetime || 1,
            opacity: options.opacity || 0.3
        });
        
        // Check for enemies in range if immediate damage is requested
        if (options.immediateRange) {
            fruit.checkEnemiesInRange(
                position, 
                options.immediateRange, 
                fruitStore.getFruit(fruit.name).damageValues[attackName], 
                options.type || fruit.type
            );
        }
        
        return projectile;
    }
    
    /**
     * Create an area effect attack
     * @param {Object} fruit - The fruit instance
     * @param {Object} position - Position to create the area effect
     * @param {Object} options - Customization options
     */
    static createAreaEffectAttack(fruit, position, options = {}) {
        const attackName = options.attackName || 'Special Attack';
        const fruitStore = options.fruitStore;
        
        // Create an area effect with appropriate color and effects
        const areaEffect = fruit.createAreaEffect(position, {
            color: options.color || 0xffffff,
            radius: options.radius || 5,
            damage: fruitStore.getFruit(fruit.name).damageValues[attackName],
            lifetime: options.lifetime || 1,
            opacity: options.opacity || 0.3,
            type: options.type || fruit.type
        });
        
        // Apply immediate damage to enemies in range
        fruit.checkEnemiesInRange(
            position, 
            options.radius || 5, 
            fruitStore.getFruit(fruit.name).damageValues[attackName], 
            options.type || fruit.type
        );
        
        return areaEffect;
    }
    
    /**
     * Create a self-buff attack
     * @param {Object} fruit - The fruit instance
     * @param {Object} position - Position of the player
     * @param {Object} options - Customization options
     */
    static createSelfBuffAttack(fruit, position, options = {}) {
        const attackName = options.attackName || 'Special Attack';
        const fruitStore = options.fruitStore;
        
        // Create visual effect for the buff
        const buffEffect = fruit.createAreaEffect(position, {
            color: options.color || 0xffffff,
            radius: options.radius || 2,
            damage: 0, // No damage for buff
            lifetime: options.duration || 1,
            opacity: options.opacity || 0.3,
            type: options.type || fruit.type
        });
        
        // Apply buff logic here
        if (typeof options.buffCallback === 'function') {
            options.buffCallback(fruit, position, fruitStore.getFruit(fruit.name).damageValues[attackName]);
        }
        
        return buffEffect;
    }
} 