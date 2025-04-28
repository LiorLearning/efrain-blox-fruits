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
            // Create an ice spike projectile
            const iceSpike = this.createProjectile(pos, dir, {
                geometry: new THREE.ConeGeometry(0.3, 1.5, 8),
                material: new THREE.MeshBasicMaterial({
                    color: 0xadefff, // Light blue
                    transparent: true,
                    opacity: 0.8
                }),
                speed: 18,
                damage: this.power,
                type: 'iceSpike'
            });
            
            // Add special effects to the ice spike
            if (iceSpike) {
                // Rotate spike to point in direction of travel
                const axis = new THREE.Vector3(0, 1, 0);
                const directionCopy = dir.clone().normalize();
                iceSpike.quaternion.setFromUnitVectors(axis, directionCopy);
                
                // Rotate 90 degrees to align cone properly
                iceSpike.rotateX(Math.PI / 2);
                
                // Add update handler for special effects
                const originalUpdate = iceSpike.userData.update;
                iceSpike.userData.update = function(deltaTime) {
                    // Call the original update
                    const result = originalUpdate(deltaTime);
                    
                    // Add ice trail effect
                    if (Math.random() < 0.2) {
                        this._createIceParticle(iceSpike.position.clone());
                    }
                    
                    return result;
                }.bind(this);
            }
            
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
            // Create a defensive ice wall perpendicular to direction
            const wallWidth = 6;
            const wallHeight = 3;
            const wallDepth = 0.5;
            
            // Calculate wall orientation - perpendicular to direction vector
            const perpendicularDirection = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
            
            // Create the wall mesh
            const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
            const wallMaterial = new THREE.MeshBasicMaterial({
                color: 0x88ceff,
                transparent: true,
                opacity: 0.6
            });
            
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            
            // Position wall in front of player
            const wallPosition = new THREE.Vector3(
                pos.x + dir.x * 3,
                pos.y + wallHeight / 2,
                pos.z + dir.z * 3
            );
            wall.position.copy(wallPosition);
            
            // Orient wall perpendicular to player's direction
            const angle = Math.atan2(dir.x, dir.z);
            wall.rotation.y = angle;
            
            // Add to scene
            this.engine.renderer.scene.add(wall);
            
            // Add wall data
            wall.userData = {
                type: 'iceWall',
                source: 'player',
                damage: 0, // Wall doesn't directly deal damage
                lifetime: 5, // seconds
                currentLifetime: 0,
                update: function(deltaTime) {
                    // Update lifetime
                    this.userData.currentLifetime += deltaTime;
                    
                    // Add ice particles occasionally for effect
                    if (Math.random() < 0.1) {
                        const edgeOffset = (Math.random() - 0.5) * wallWidth;
                        const heightOffset = Math.random() * wallHeight;
                        
                        const particlePos = this.position.clone();
                        particlePos.x += edgeOffset * Math.cos(this.rotation.y);
                        particlePos.z += edgeOffset * Math.sin(this.rotation.y);
                        particlePos.y = heightOffset;
                        
                        this.engine._createIceParticle(particlePos);
                    }
                    
                    // Fade out near end of lifetime
                    const remainingLife = this.userData.lifetime - this.userData.currentLifetime;
                    if (remainingLife < 1) {
                        this.material.opacity = remainingLife * 0.6;
                    }
                    
                    // Destroy if lifetime is exceeded
                    if (this.userData.currentLifetime >= this.userData.lifetime) {
                        this.engine.renderer.scene.remove(this);
                        this.geometry.dispose();
                        this.material.dispose();
                        return false;
                    }
                    
                    return true;
                }.bind(wall)
            };
            
            // Store engine reference for particle effects
            wall.engine = this;
            
            // Add to engine's effects to update
            if (!this.engine.effectsToUpdate) {
                this.engine.effectsToUpdate = [];
            }
            this.engine.effectsToUpdate.push(wall);
            
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
            // Create a large area effect of ice damage
            const blizzard = this.createAreaEffect(pos, {
                radius: 12,
                color: 0x88ccff,
                damage: this.power * 2,
                lifetime: 6,
                type: 'blizzard'
            });
            
            // Add custom effects and behavior
            if (blizzard) {
                const originalUpdate = blizzard.userData.update;
                blizzard.userData.update = function(deltaTime) {
                    // Call the original update
                    const result = originalUpdate(deltaTime);
                    
                    // Create ice particles for visual effect
                    for (let i = 0; i < 3; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const radius = Math.random() * blizzard.userData.radius * 0.9;
                        const height = 1 + Math.random() * 3;
                        
                        const particlePos = new THREE.Vector3(
                            blizzard.position.x + Math.cos(angle) * radius,
                            blizzard.position.y + height,
                            blizzard.position.z + Math.sin(angle) * radius
                        );
                        
                        this._createIceParticle(particlePos);
                    }
                    
                    // Check for enemies in range to apply slow effect
                    this.checkEnemiesInRange(blizzard.position, blizzard.userData.radius, 
                        this.power * 0.3 * deltaTime, 'ice');
                    
                    return result;
                }.bind(this);
            }
            
            // Set cooldown
            this.cooldowns['Blizzard'] = 25; // 25 second cooldown
            
            return true;
        });
    }
    
    /**
     * Create an ice particle for effects
     */
    _createIceParticle(position) {
        // Use the centralized particle creation logic
        return this.createParticle(position, {
            geometry: new THREE.TetrahedronGeometry(0.15), // Ice crystal shape
            color: 0xccffff,
            opacity: 0.8,
            lifetime: 0.8 + Math.random() * 0.7, // 0.8-1.5 seconds
            randomRotation: true,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2, // Small random x movement
                -0.1 - Math.random() * 0.2,  // Slow downward movement
                (Math.random() - 0.5) * 0.2  // Small random z movement
            ),
            spinRate: {
                x: (Math.random() - 0.5) * 0.05,
                y: (Math.random() - 0.5) * 0.05,
                z: (Math.random() - 0.5) * 0.05
            },
            fadeStart: 0.7 // Start fading at 70% of lifetime
        });
    }
}