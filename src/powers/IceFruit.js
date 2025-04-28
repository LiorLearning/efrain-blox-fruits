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
            
            // Set cooldown
            this.cooldowns['Blizzard'] = 25; // 25 second cooldown
            
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