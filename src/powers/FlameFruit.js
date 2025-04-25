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
        if (this.isOnCooldown('Fireball')) {
            console.log('Fireball is on cooldown');
            return false;
        }
        
        // Create a fireball projectile
        const fireball = this.createProjectile(position, direction, {
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
        
        // Add special effects to the fireball
        if (fireball) {
            // Create a point light to make it glow
            const light = new THREE.PointLight(0xff5500, 1, 5);
            fireball.add(light);
            
            // Add update handler for special effects
            const originalUpdate = fireball.userData.update;
            fireball.userData.update = function(deltaTime) {
                // Call the original update
                const result = originalUpdate(deltaTime);
                
                // Add flame trail effect
                if (Math.random() < 0.3) {
                    this._createFlameParticle(fireball.position.clone());
                }
                
                return result;
            }.bind(this);
        }
        
        // Set cooldown
        this.cooldowns['Fireball'] = 1; // 1 second cooldown
        
        return true;
    }
    
    /**
     * Use a special attack - Flame Wave
     */
    useSpecialAttack(position, direction) {
        if (this.isOnCooldown('Flame Wave')) {
            console.log('Flame Wave is on cooldown');
            return false;
        }
        
        // Create a 120-degree cone of fire in front of the player
        const numProjectiles = 5; // Number of fireballs in the wave
        const spreadAngle = Math.PI / 3; // 60 degrees (120 degrees total)
        
        // Calculate the base angle
        const baseAngle = Math.atan2(direction.x, direction.z);
        
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
            const fireball = this.createProjectile(position, projectileDirection, {
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
    }
    
    /**
     * Use an ultimate attack - Inferno
     */
    useUltimateAttack(position, direction) {
        if (this.isOnCooldown('Inferno')) {
            console.log('Inferno is on cooldown');
            return false;
        }
        
        // Create a large area effect of fire
        const inferno = this.createAreaEffect(position, {
            radius: 8,
            color: 0xff2200,
            damage: this.power * 3,
            lifetime: 5,
            type: 'inferno'
        });
        
        // Set very long cooldown for ultimate
        this.cooldowns['Inferno'] = 30; // 30 seconds cooldown
        
        return true;
    }
    
    /**
     * Create a flame particle for effects
     */
    _createFlameParticle(position) {
        // Slightly randomize position
        position.x += (Math.random() - 0.5) * 0.3;
        position.y += (Math.random() - 0.5) * 0.3;
        position.z += (Math.random() - 0.5) * 0.3;
        
        // Create a small flame particle
        const geometry = new THREE.SphereGeometry(0.2, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0xff9900 : 0xff5500, // Orange/red variation
            transparent: true,
            opacity: 0.7
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        // Add to scene
        this.engine.renderer.scene.add(particle);
        
        // Animate the particle
        const lifetime = 0.3 + Math.random() * 0.3; // 0.3-0.6 seconds
        const startTime = Date.now();
        const duration = lifetime * 1000; // Convert to milliseconds
        
        // Add a small upward velocity
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5, // Small random x movement
            1 + Math.random(),           // Upward movement
            (Math.random() - 0.5) * 0.5  // Small random z movement
        );
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Move upward and fade
                particle.position.x += velocity.x * 0.01;
                particle.position.y += velocity.y * 0.01;
                particle.position.z += velocity.z * 0.01;
                
                // Shrink slightly as it rises
                const scale = 1 - progress * 0.5;
                particle.scale.set(scale, scale, scale);
                
                // Fade out
                particle.material.opacity = 0.7 * (1 - progress);
                
                requestAnimationFrame(animate);
            } else {
                // Remove when animation is complete
                this.engine.renderer.scene.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
            }
        };
        
        // Start animation
        animate();
    }
}