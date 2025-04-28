/**
 * Bomb Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';

export class BombFruit extends Fruit {
    constructor(engine, options = {}) {
        // Set default options for Bomb Fruit
        const bombOptions = {
            name: options.name || 'Bomb Fruit',
            type: 'bomb',
            power: options.power || 15,
            attacks: options.attacks || ['Bomb Toss', 'Mine', 'Mega Explosion'],
            ...options
        };
        
        super(engine, bombOptions);
    }
    
    /**
     * Use a basic attack - Bomb Toss
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Create a bomb projectile
            const bomb = this.createProjectile(pos, dir, {
                color: 0x9c27b0,
                speed: 12,
                damage: fruitStore.getFruit(this.name).damageValues['Basic Attack'],
                type: 'bomb'
            });
            
            // Apply damage to enemies in range
            this.checkEnemiesInRange(pos, 3, fruitStore.getFruit(this.name).damageValues['Basic Attack'], 'bomb');
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Mine
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Special Attack', position, direction, (pos, dir) => {
            // Create a mine at player's feet
            const minePosition = new THREE.Vector3(pos.x, 0.05, pos.z);
            
            // Create mine object
            const mineGroup = new THREE.Group();
            mineGroup.position.copy(minePosition);
            
            // Create mine body
            const mineGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
            const mineMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
            const mineBody = new THREE.Mesh(mineGeometry, mineMaterial);
            mineBody.rotation.x = Math.PI / 2; // Lay flat
            mineGroup.add(mineBody);
            
            // Add mine trigger/sensor (top part)
            const sensorGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8);
            const sensorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
            sensor.position.y = 0.15;
            mineGroup.add(sensor);
            
            // Add data for update
            mineGroup.userData = {
                type: 'mine',
                damage: this.power * 1.5,
                lifetime: 10, // 10 second lifetime
                currentLifetime: 0,
                armed: false,
                armingTime: 1, // 1 second to arm
                triggerRadius: 3,
                source: 'player',
                update: function(deltaTime) {
                    // Update lifetime
                    this.userData.currentLifetime += deltaTime;
                    
                    // Check if mine should be armed
                    if (!this.userData.armed && this.userData.currentLifetime >= this.userData.armingTime) {
                        this.userData.armed = true;
                        // Change sensor color to indicate armed state
                        sensor.material.color.set(0x00ff00);
                        
                        // Add blinking effect
                        if (!this.userData.blinkInterval) {
                            this.userData.blinkInterval = setInterval(() => {
                                sensor.visible = !sensor.visible;
                            }, 500);
                        }
                    }
                    
                    // Check for nearby enemies if armed
                    if (this.userData.armed) {
                        this.checkEnemiesInRange(this.position, this.userData.triggerRadius, this.userData.damage, 'bomb');
                    }
                    
                    // Destroy if lifetime is exceeded
                    if (this.userData.currentLifetime >= this.userData.lifetime) {
                        // Clean up and remove mine
                        if (this.userData.blinkInterval) {
                            clearInterval(this.userData.blinkInterval);
                        }
                        
                        if (this.parent) {
                            this.parent.remove(this);
                        }
                        
                        return false;
                    }
                    
                    return true;
                }.bind(mineGroup)
            };
            
            // Store reference to the engine for enemy detection
            mineGroup.engine = this;
            
            // Add _createExplosion method to the mine
            // mineGroup._createExplosion = this._createExplosion.bind(this);
            
            // Add checkEnemiesInRange method to the mine
            mineGroup.checkEnemiesInRange = this.checkEnemiesInRange.bind(this);
            
            // Add mine to scene
            const scene = this.engine.renderer.scene;
            if (scene) {
                scene.add(mineGroup);
                
                // Keep track of all effects to update them
                if (!this.engine.effectsToUpdate) {
                    this.engine.effectsToUpdate = [];
                }
                this.engine.effectsToUpdate.push(mineGroup);
            }
            
            // The cooldown is now managed by the FruitStore
            // No need to set this.cooldowns directly
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Mega Explosion
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Ultimate Attack', position, direction, (pos, dir) => {
            
            // Create multiple smaller explosions in a circular pattern
            const explosionCount = 8;
            const radius = 10;
            
            // Create main explosion at player position
            // const mainExplosion = this._createExplosion(pos, this.power * 2, radius * 0.5);
            
            // Set delays for secondary explosions to create a wave effect
            for (let i = 0; i < explosionCount; i++) {
                const angle = (i / explosionCount) * Math.PI * 2;
                const expPos = new THREE.Vector3(
                    pos.x + Math.cos(angle) * radius,
                    pos.y,
                    pos.z + Math.sin(angle) * radius
                );
                
                // Create delayed explosion
                setTimeout(() => {
                    // const explosion = this._createExplosion(expPos, this.power * 1.5, radius * 0.3);
                    
                    // Apply damage to enemies in range
                    this.checkEnemiesInRange(expPos, radius * 0.3, this.power * 1.5, 'bomb');
                }, i * 200); // 200ms delay between explosions
            }
            
            // The cooldown is now managed by the FruitStore
            // No need to set this.cooldowns directly
            
            return true;
        });
    }
    
    /**
     * Create an explosion effect at the specified position
     */
    _createExplosion(position, damage, radius = 4) {
        return null;
    }
}