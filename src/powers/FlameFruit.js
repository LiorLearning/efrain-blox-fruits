/**
 * Flame Fruit power implementation
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';

export class FlameFruit extends Fruit {
    constructor(engine, options = {}) {
        // Set default options for Flame Fruit
        const flameOptions = {
            name: options.name || 'Flame Fruit',
            type: 'flame',
            power: options.power || 20,
            attacks: ['Fireball', 'Flame Wave', 'Inferno'],
            ...options
        };
        
        super(engine, flameOptions);
        
        // Special properties for Flame Fruit
        this.burnDuration = 3; // seconds
        this.burnDamage = 2; // damage per second
    }
    
    /**
     * Use a basic attack - Fireball
     */
    useBasicAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Fireball', position, direction, (pos, dir) => {
            // Create a fireball projectile
            const fireball = this.createProjectile(pos, dir, {
                geometry: new THREE.SphereGeometry(0.5, 8, 8),
                material: new THREE.MeshBasicMaterial({
                    color: 0xff5500, // Orange-red
                    transparent: true,
                    opacity: 0.8
                }),
                speed: 15,
                damage: this.power,
                type: 'fireball'
            });
            
            // Set cooldown
            this.cooldowns['Fireball'] = 1; // 1 second cooldown
            
            return true;
        });
    }
    
    /**
     * Use a special attack - Flame Wave
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Flame Wave', position, direction, (pos, dir) => {
            // Create a 120-degree cone of fire in front of the player
            const numProjectiles = 5; // Number of fireballs in the wave
            const spreadAngle = Math.PI / 3; // 60 degrees (120 degrees total)
            
            // Calculate the base angle
            const baseAngle = Math.atan2(dir.x, dir.z);
            
            // Create multiple fireballs in an arc
            for (let i = 0; i < numProjectiles; i++) {
                // Calculate angle offset from center
                const angleOffset = spreadAngle * (i / (numProjectiles - 1) - 0.5);
                const angle = baseAngle + angleOffset;
                
                // Create direction vector from angle
                const projectileDirection = new THREE.Vector3(
                    Math.sin(angle),
                    0,
                    Math.cos(angle)
                );
                
                // Create a smaller, faster fireball
                const fireball = this.createProjectile(pos, projectileDirection, {
                    geometry: new THREE.SphereGeometry(0.3, 8, 8),
                    material: new THREE.MeshBasicMaterial({
                        color: 0xff3300,
                        transparent: true,
                        opacity: 0.7
                    }),
                    speed: 20,
                    damage: this.power * 0.7, // Less damage per projectile
                    lifetime: 1, // Shorter lifetime
                    type: 'fireball'
                });
                
                // Add special effects
                if (fireball) {
                    // Add a small light to make it glow
                    const light = new THREE.PointLight(0xff3300, 0.7, 3);
                    fireball.add(light);
                }
            }
            
            // Set longer cooldown for special attack
            this.cooldowns['Flame Wave'] = 5; // 5 seconds cooldown
            this.cooldowns['special'] = 5; // General special attack cooldown
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Inferno
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Inferno', position, direction, (pos, dir) => {
            // Create a large area effect of fire
            const inferno = this.createAreaEffect(pos, {
                radius: 8,
                color: 0xff2200,
                damage: this.power * 3,
                lifetime: 5,
                type: 'inferno'
            });
            
            // Set very long cooldown for ultimate
            this.cooldowns['Inferno'] = 30; // 30 seconds cooldown
            
            return true;
        });
    }
    
    /**
     * Create a flame particle for effects (disabled)
     */
    _createFlameParticle(position) {
        // Disabled to remove particle effects
        return null;
    }
}