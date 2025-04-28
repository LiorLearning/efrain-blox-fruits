/**
 * Light Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';

export class LightFruit extends Fruit {
    constructor(engine, options = {}) {
        // Set default options for Light Fruit
        const lightOptions = {
            name: options.name || 'Light Fruit',
            type: 'light',
            power: options.power || 7,
            attacks: options.attacks || ['Light Beam', 'Flash Step', 'Solar Flare'],
            ...options
        };
        
        super(engine, lightOptions);
        
        // Special properties for Light Fruit
        this.speedBoost = 2; // Speed multiplier for movement
    }
    
    /**
     * Use a basic attack - Light Beam
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Light Beam', position, direction, (pos, dir) => {
            // Create a light beam projectile
            const beam = this.createProjectile(pos, dir, {
                geometry: new THREE.CylinderGeometry(0.1, 0.1, 8, 8),
                material: new THREE.MeshBasicMaterial({
                    color: 0xffffaa, // Pale yellow
                    transparent: true,
                    opacity: 0.8
                }),
                speed: 30, // Very fast
                damage: this.power * 0.8,
                lifetime: 0.5, // Short lifetime
                type: 'lightBeam'
            });
            
            if (beam) {
                // Rotate beam to point in direction of travel
                const axis = new THREE.Vector3(0, 1, 0);
                const directionCopy = dir.clone().normalize();
                beam.quaternion.setFromUnitVectors(axis, directionCopy);
                
                // Rotate 90 degrees to align cylinder properly
                beam.rotateX(Math.PI / 2);
            }
            
            // Set cooldown
            this.cooldowns['Light Beam'] = 0.5; // 0.5 second cooldown
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Flash Step
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Flash Step', position, direction, (pos, dir) => {
            // Handle flash step teleport
            const player = this.engine.player;
            if (player && player.object3D) {
                // Calculate teleport distance
                const teleportDistance = 15;
                const teleportDirection = dir.clone().normalize().multiplyScalar(teleportDistance);
                
                // Move player forward (teleport)
                player.object3D.position.add(teleportDirection);
                
                // Add speed boost to player for a short duration
                const originalSpeed = player.speed;
                player.speed = originalSpeed * this.speedBoost;
                
                // Reset speed after 2 seconds
                setTimeout(() => {
                    if (player) {
                        player.speed = originalSpeed;
                    }
                }, 2000);
            }
            
            // Set cooldown
            this.cooldowns['Flash Step'] = 8; // 8 second cooldown
            this.cooldowns['special'] = 8; // General special cooldown
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Solar Flare
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Solar Flare', position, direction, (pos, dir) => {
            // Create a massive light explosion
            const solarFlare = this.createAreaEffect(pos, {
                radius: 15,
                color: 0xffffcc,
                damage: this.power * 2,
                lifetime: 2,
                type: 'solarFlare'
            });
            
            // Set cooldown
            this.cooldowns['Solar Flare'] = 20; // 20 second cooldown
            
            return true;
        });
    }
    
    /**
     * Create a light particle effect (disabled)
     */
    _createLightParticle(position, size = 0.2) {
        // Disabled to remove particle effects
        return null;
    }
    
    /**
     * Create a light flash effect (disabled)
     */
    _createLightFlash(position, size = 1) {
        // Disabled to remove flash effects
        return null;
    }
}