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
            power: options.power || 10,
            attacks: options.attacks || ['Fireball', 'Flame Dash', 'Inferno'],
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
     * Use a special attack - Flame Dash
     */
    useSpecialAttack(position, direction) {
        if (this.isOnCooldown('Flame Dash')) {
            console.log('Flame Dash is on cooldown');
            return false;
        }
        
        // Handle dash movement
        const player = this.engine.player;
        if (player && player.object3D) {
            // Calculate dash distance
            const dashDistance = 8;
            const dashDirection = direction.clone().normalize().multiplyScalar(dashDistance);
            
            // Store original position for effect
            const startPos = player.object3D.position.clone();
            
            // Move player forward
            player.object3D.position.add(dashDirection);
            
            // Create flame trail between start and end position
            const trailCount = 10;
            for (let i = 0; i < trailCount; i++) {
                const t = i / (trailCount - 1);
                const trailPos = new THREE.Vector3().lerpVectors(startPos, player.object3D.position, t);
                this._createFlameParticle(trailPos, 1.5); // larger flame for dash
            }
            
            // Create area damage at destination
            this.createAreaEffect(player.object3D.position, {
                radius: 3,
                color: 0xff3300,
                damage: this.power * 0.8,
                lifetime: 0.5,
                type: 'flameDash'
            });
        }
        
        // Set cooldown
        this.cooldowns['Flame Dash'] = 5; // 5 second cooldown
        
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
        
        // Create a massive area effect
        const inferno = this.createAreaEffect(position, {
            radius: 10,
            color: 0xff0000,
            damage: this.power * 2,
            lifetime: 4,
            type: 'inferno'
        });
        
        if (inferno) {
            // Add a light source
            const light = new THREE.PointLight(0xff3300, 2, 15);
            light.position.y = 3;
            inferno.add(light);
            
            // Add fire columns
            const columns = 8;
            for (let i = 0; i < columns; i++) {
                const angle = (i / columns) * Math.PI * 2;
                const radius = 7;
                const columnPos = new THREE.Vector3(
                    Math.cos(angle) * radius,
                    0,
                    Math.sin(angle) * radius
                );
                
                // Create a fire column
                const columnGeometry = new THREE.CylinderGeometry(0.5, 1, 5, 8);
                const columnMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff5500,
                    transparent: true,
                    opacity: 0.7
                });
                const column = new THREE.Mesh(columnGeometry, columnMaterial);
                column.position.copy(columnPos);
                column.position.y = 2.5; // Place at half height
                
                inferno.add(column);
                
                // Add small light to column
                const columnLight = new THREE.PointLight(0xff5500, 0.5, 5);
                columnLight.position.y = 3;
                column.add(columnLight);
            }
            
            // Add update handler for special effects
            const originalUpdate = inferno.userData.update;
            inferno.userData.update = function(deltaTime) {
                // Call the original update
                const result = originalUpdate(deltaTime);
                
                // Add flame particles
                if (Math.random() < 0.3) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 10;
                    const particlePos = new THREE.Vector3(
                        inferno.position.x + Math.cos(angle) * radius,
                        inferno.position.y,
                        inferno.position.z + Math.sin(angle) * radius
                    );
                    this._createFlameParticle(particlePos);
                }
                
                return result;
            }.bind(this);
        }
        
        // Set cooldown
        this.cooldowns['Inferno'] = 15; // 15 second cooldown
        
        return true;
    }
    
    /**
     * Create a flame particle effect
     */
    _createFlameParticle(position, size = 1) {
        const scene = this.engine.renderer.scene;
        if (!scene) return null;
        
        // Create a small flame particle
        const geometry = new THREE.SphereGeometry(0.2 * size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() < 0.5 ? 0xff5500 : 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.position.y += 0.5; // Slight offset from ground
        
        // Add random movement
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2 + 2,
                (Math.random() - 0.5) * 2
            ),
            lifetime: Math.random() * 0.5 + 0.5,
            currentLifetime: 0,
            update: function(deltaTime) {
                // Move upward
                this.position.add(this.userData.velocity.clone().multiplyScalar(deltaTime));
                
                // Shrink as it rises
                const lifeRatio = this.userData.currentLifetime / this.userData.lifetime;
                const scale = 1 - lifeRatio;
                this.scale.set(scale, scale, scale);
                
                // Fade out
                this.material.opacity = 0.7 * (1 - lifeRatio);
                
                // Update lifetime
                this.userData.currentLifetime += deltaTime;
                
                // Destroy if lifetime is exceeded
                if (this.userData.currentLifetime >= this.userData.lifetime) {
                    scene.remove(this);
                    return false;
                }
                
                return true;
            }.bind(particle)
        };
        
        // Add to scene
        scene.add(particle);
        
        // Keep track of all effects to update them
        if (!this.engine.effectsToUpdate) {
            this.engine.effectsToUpdate = [];
        }
        this.engine.effectsToUpdate.push(particle);
        
        return particle;
    }
}