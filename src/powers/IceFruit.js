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
            power: options.power || 8,
            attacks: options.attacks || ['Ice Spike', 'Freeze', 'Blizzard'],
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
        if (this.isOnCooldown('Ice Spike')) {
            console.log('Ice Spike is on cooldown');
            return false;
        }
        
        // Create an ice spike projectile
        const iceSpike = this.createProjectile(position, direction, {
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
            const directionCopy = direction.clone().normalize();
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
    }
    
    /**
     * Use a special attack - Freeze
     */
    useSpecialAttack(position, direction) {
        if (this.isOnCooldown('Freeze')) {
            console.log('Freeze is on cooldown');
            return false;
        }
        
        // Create a freezing wave
        const freezeRadius = 5;
        const freezeEffect = this.createAreaEffect(position, {
            radius: freezeRadius,
            color: 0x88ccff,
            damage: this.power * 0.6,
            lifetime: 1.5,
            type: 'freeze'
        });
        
        if (freezeEffect) {
            // Create ice crystals in the area
            const crystalCount = 12;
            for (let i = 0; i < crystalCount; i++) {
                const angle = (i / crystalCount) * Math.PI * 2;
                const radius = Math.random() * freezeRadius * 0.8;
                const crystalPos = new THREE.Vector3(
                    position.x + Math.cos(angle) * radius,
                    position.y,
                    position.z + Math.sin(angle) * radius
                );
                
                // Create an ice crystal
                const crystalGeometry = new THREE.ConeGeometry(0.2, Math.random() * 1 + 0.5, 5);
                const crystalMaterial = new THREE.MeshBasicMaterial({
                    color: 0xadefff,
                    transparent: true,
                    opacity: 0.8
                });
                const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
                crystal.position.copy(crystalPos);
                crystal.rotation.x = Math.PI / 2; // Point upward
                crystal.rotation.z = Math.random() * Math.PI; // Random rotation
                
                // Add crystal to the effect
                freezeEffect.add(crystal);
            }
            
            // Add a light source
            const light = new THREE.PointLight(0xadefff, 1, 10);
            light.position.y = 2;
            freezeEffect.add(light);
        }
        
        // Set cooldown
        this.cooldowns['Freeze'] = 6; // 6 second cooldown
        
        return true;
    }
    
    /**
     * Use an ultimate attack - Blizzard
     */
    useUltimateAttack(position, direction) {
        if (this.isOnCooldown('Blizzard')) {
            console.log('Blizzard is on cooldown');
            return false;
        }
        
        // Create a massive blizzard effect
        const blizzard = this.createAreaEffect(position, {
            radius: 12,
            color: 0x88ccff,
            damage: this.power * 1.5,
            lifetime: 5,
            type: 'blizzard'
        });
        
        if (blizzard) {
            // Add a light source
            const light = new THREE.PointLight(0xadefff, 1.5, 18);
            light.position.y = 5;
            blizzard.add(light);
            
            // Add update handler for spawning snowflakes
            const originalUpdate = blizzard.userData.update;
            blizzard.userData.update = function(deltaTime) {
                // Call the original update
                const result = originalUpdate(deltaTime);
                
                // Create snowflakes
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 12;
                    const snowPos = new THREE.Vector3(
                        blizzard.position.x + Math.cos(angle) * radius,
                        blizzard.position.y + 5 + Math.random() * 3, // Start above
                        blizzard.position.z + Math.sin(angle) * radius
                    );
                    this._createSnowflake(snowPos);
                }
                
                return result;
            }.bind(this);
        }
        
        // Set cooldown
        this.cooldowns['Blizzard'] = 20; // 20 second cooldown
        
        return true;
    }
    
    /**
     * Create an ice particle effect
     */
    _createIceParticle(position) {
        const scene = this.engine.renderer.scene;
        if (!scene) return null;
        
        // Create a small ice particle
        const geometry = new THREE.OctahedronGeometry(0.15, 0);
        const material = new THREE.MeshBasicMaterial({
            color: 0xadefff,
            transparent: true,
            opacity: 0.7
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        // Add some random rotation
        particle.rotation.x = Math.random() * Math.PI;
        particle.rotation.y = Math.random() * Math.PI;
        particle.rotation.z = Math.random() * Math.PI;
        
        // Add data for update
        particle.userData = {
            lifetime: Math.random() * 0.5 + 0.3,
            currentLifetime: 0,
            update: function(deltaTime) {
                // Slow fade out
                const lifeRatio = this.userData.currentLifetime / this.userData.lifetime;
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
    
    /**
     * Create a snowflake effect for blizzard
     */
    _createSnowflake(position) {
        const scene = this.engine.renderer.scene;
        if (!scene) return null;
        
        // Create a small snowflake
        const size = Math.random() * 0.1 + 0.05;
        const geometry = new THREE.CircleGeometry(size, 6);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7
        });
        
        const snowflake = new THREE.Mesh(geometry, material);
        snowflake.position.copy(position);
        
        // Make sure snowflake faces camera
        snowflake.rotation.x = -Math.PI / 2;
        
        // Add data for update
        snowflake.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                -(Math.random() * 2 + 1), // Fall downward
                (Math.random() - 0.5) * 2
            ),
            rotationSpeed: Math.random() * 5,
            lifetime: Math.random() * 2 + 1,
            currentLifetime: 0,
            update: function(deltaTime) {
                // Move downward with some drift
                this.position.add(this.userData.velocity.clone().multiplyScalar(deltaTime));
                
                // Rotate snowflake
                this.rotation.z += this.userData.rotationSpeed * deltaTime;
                
                // Update lifetime
                this.userData.currentLifetime += deltaTime;
                
                // Destroy if lifetime is exceeded or if it hits the ground
                if (this.userData.currentLifetime >= this.userData.lifetime || this.position.y <= 0.1) {
                    scene.remove(this);
                    return false;
                }
                
                return true;
            }.bind(snowflake)
        };
        
        // Add to scene
        scene.add(snowflake);
        
        // Keep track of all effects to update them
        if (!this.engine.effectsToUpdate) {
            this.engine.effectsToUpdate = [];
        }
        this.engine.effectsToUpdate.push(snowflake);
        
        return snowflake;
    }
}