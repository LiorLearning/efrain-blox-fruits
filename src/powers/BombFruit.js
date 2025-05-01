/**
 * Bomb Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';
import { AttackImplementations } from './common/AttackImplementations.js';
import { EffectsManager } from './common/EffectsManager.js';
import { fruitConfigurations } from './common/FruitConfigurations.js';

export class BombFruit extends Fruit {
    constructor(engine, options = {}) {
        // Get bomb fruit configuration
        const config = fruitConfigurations.bomb;
        
        // Set default options for Bomb Fruit
        const bombOptions = {
            name: options.name || config.name,
            type: config.type,
            power: options.power || config.power,
            attacks: config.attacks,
            ...options
        };
        
        super(engine, bombOptions);
        
        // Special properties for Bomb Fruit
        this.explosionRadius = config.specialProperties.explosionRadius;
        this.knockback = config.specialProperties.knockback;
        
        // Store colors for attacks
        this.colors = config.colors;
        
        // Store attack settings
        this.attackSettings = config.attackSettings;
    }
    
    /**
     * Use a basic attack - Bomb Toss
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Basic Attack'];
            
            // Create a bomb projectile using common implementation
            const bomb = AttackImplementations.createProjectileAttack(this, pos, dir, {
                color: this.colors.primary,
                speed: attackSettings.speed,
                lifetime: attackSettings.lifetime,
                type: this.type,
                attackName: 'Basic Attack',
                fruitStore: fruitStore,
                immediateRange: attackSettings.range
            });
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Mine Field
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Special Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Special Attack'];
            
            // Create a mine at player's feet
            const minePosition = new THREE.Vector3(pos.x, 0.05, pos.z);
            
            // Create a mine field area effect using common implementation
            const mineField = AttackImplementations.createAreaEffectAttack(this, pos, {
                color: this.colors.secondary,
                radius: attackSettings.radius,
                lifetime: attackSettings.lifetime,
                opacity: 0.6,
                type: this.type,
                attackName: 'Special Attack',
                fruitStore: fruitStore
            });
            
            // Deploy multiple mines in the area
            this._deployMines(pos, attackSettings.radius, 5);
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Mega Explosion
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ultimate Attack', position, direction, (pos, dir) => {
            // Get attack settings
            const attackSettings = this.attackSettings['Ultimate Attack'];
            
            // Create a mega explosion area effect using common implementation
            const megaExplosion = AttackImplementations.createAreaEffectAttack(this, pos, {
                color: this.colors.ultimate,
                radius: attackSettings.radius,
                lifetime: attackSettings.lifetime,
                opacity: 0.9,
                type: this.type,
                attackName: 'Ultimate Attack',
                fruitStore: fruitStore
            });
            
            // Create explosion particles
            EffectsManager.createParticles(this, pos, {
                count: 40,
                color: this.colors.ultimate,
                type: this.type,
                lifetime: 2.5,
                size: 0.5,
                speed: 5
            });
            
            // Create multiple smaller explosions in a circular pattern
            const explosionCount = 8;
            const radius = attackSettings.radius;
            
            // Set delays for secondary explosions to create a wave effect
            for (let i = 0; i < explosionCount; i++) {
                const angle = (i / explosionCount) * Math.PI * 2;
                const expPos = new THREE.Vector3(
                    pos.x + Math.cos(angle) * (radius / 2),
                    pos.y,
                    pos.z + Math.sin(angle) * (radius / 2)
                );
                
                // Create delayed explosion
                setTimeout(() => {
                    // Create additional particles at explosion points
                    EffectsManager.createParticles(this, expPos, {
                        count: 15,
                        color: this.colors.secondary,
                        type: this.type,
                        lifetime: 1.5,
                        size: 0.3,
                        speed: 3
                    });
                    
                    // Apply damage to enemies in range
                    this.checkEnemiesInRange(
                        expPos, 
                        radius * 0.3, 
                        fruitStore.getFruit(this.name).damageValues['Ultimate Attack'] * 0.5, 
                        this.type
                    );
                }, i * 200); // 200ms delay between explosions
            }
            
            return true;
        });
    }
    
    /**
     * Deploy mines in an area
     */
    _deployMines(position, radius, count) {
        for (let i = 0; i < count; i++) {
            // Random position within radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            const minePos = new THREE.Vector3(
                position.x + Math.cos(angle) * distance,
                0.05,
                position.z + Math.sin(angle) * distance
            );
            
            // Create a small indicator for each mine
            const mineIndicator = this.createAreaEffect(minePos, {
                color: this.colors.secondary,
                radius: 0.5,
                damage: fruitStore.getFruit(this.name).damageValues['Special Attack'] * 0.7,
                lifetime: 10,
                opacity: 0.4,
                type: this.type
            });
            
            // Add trigger logic to the mine
            if (mineIndicator) {
                mineIndicator.userData.isMine = true;
                mineIndicator.userData.armed = false;
                mineIndicator.userData.armingTime = 1; // Arm after 1 second
                
                // Override update logic to include mine behavior
                const originalUpdate = mineIndicator.userData.update;
                mineIndicator.userData.update = function(deltaTime) {
                    // Update standard area effect behavior
                    const result = originalUpdate.call(this, deltaTime);
                    
                    // Handle mine-specific logic
                    if (!this.userData.armed && this.userData.currentLifetime >= this.userData.armingTime) {
                        this.userData.armed = true;
                    }
                    
                    return result;
                }.bind(mineIndicator);
            }
        }
    }
}