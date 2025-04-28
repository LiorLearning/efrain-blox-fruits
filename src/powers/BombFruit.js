/**
 * Bomb Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';

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
        return this._useAttack('Bomb Toss', position, direction, (pos, dir) => {
            // Create a bomb projectile
            const bomb = this.createProjectile(pos, dir, {
                geometry: new THREE.SphereGeometry(0.4, 8, 8),
                material: new THREE.MeshBasicMaterial({
                    color: 0x202020, // Dark gray
                    transparent: false,
                    opacity: 1.0
                }),
                speed: 12,
                damage: this.power * 1.2,
                lifetime: 2,
                type: 'bomb'
            });
            
            if (bomb) {
                // Add trajectory arc (bombs are affected by gravity)
                const originalUpdate = bomb.userData.update;
                bomb.userData.update = function(deltaTime) {
                    // Apply gravity
                    this.userData.direction.y -= 9.8 * deltaTime;
                    
                    // Call the original update
                    const result = originalUpdate(deltaTime);
                    
                    // Check if hit ground
                    if (this.position.y <= 0.1) {
                        this.position.y = 0.1; // Keep slightly above ground
                        this.parent.remove(this);
                        return false;
                    }
                    
                    return result;
                }.bind(bomb);
            }
            
            // Set cooldown
            this.cooldowns['Bomb Toss'] = 1.5; // 1.5 second cooldown
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Mine
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Mine', position, direction, (pos, dir) => {
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
                        this.engine.checkEnemiesInRange(this.position, this.userData.triggerRadius, 0, this.type);
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
            mineGroup._createExplosion = this._createExplosion.bind(this);
            
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
            
            // Set cooldown
            this.cooldowns['Mine'] = 8; // 8 second cooldown
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Mega Explosion
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Mega Explosion', position, direction, (pos, dir) => {
            
            // Create multiple smaller explosions in a circular pattern
            const explosionCount = 8;
            const radius = 10;
            
            // Set delays for secondary explosions to create a wave effect
            for (let i = 0; i < explosionCount; i++) {
                const angle = (i / explosionCount) * Math.PI * 2;
                const expPos = new THREE.Vector3(
                    pos.x + Math.cos(angle) * radius,
                    pos.y,
                    pos.z + Math.sin(angle) * radius
                );
            }
            
            // Set cooldown
            this.cooldowns['Mega Explosion'] = 25; // 25 second cooldown
            
            return true;
        });
    }
    
    /**
     * Create an explosion effect at the specified position
     */
    _createExplosion(position, damage, radius = 4) {
        // Disabled to remove explosion effects
        return null;
    }
}