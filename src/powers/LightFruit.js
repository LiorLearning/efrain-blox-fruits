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
        if (this.isOnCooldown('Light Beam')) {
            console.log('Light Beam is on cooldown');
            return false;
        }
        
        // Create a light beam projectile
        const beam = this.createProjectile(position, direction, {
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
            const directionCopy = direction.clone().normalize();
            beam.quaternion.setFromUnitVectors(axis, directionCopy);
            
            // Rotate 90 degrees to align cylinder properly
            beam.rotateX(Math.PI / 2);
            
            // Add a light source at the front of the beam
            const light = new THREE.PointLight(0xffffaa, 1, 5);
            light.position.z = 4; // Position at front of beam
            beam.add(light);
            
            // Add light particles trailing the beam
            const originalUpdate = beam.userData.update;
            beam.userData.update = function(deltaTime) {
                // Call the original update
                const result = originalUpdate(deltaTime);
                
                // Add light particles
                if (Math.random() < 0.3) {
                    const offset = (Math.random() - 0.5) * 0.2;
                    const particlePos = beam.position.clone();
                    particlePos.x += offset;
                    particlePos.y += offset;
                    particlePos.z += offset;
                    this._createLightParticle(particlePos);
                }
                
                return result;
            }.bind(this);
        }
        
        // Set cooldown
        this.cooldowns['Light Beam'] = 0.5; // 0.5 second cooldown
        
        return true;
    }
    
    /**
     * Use a special attack - Flash Step
     */
    useSpecialAttack(position, direction) {
        if (this.isOnCooldown('Flash Step')) {
            console.log('Flash Step is on cooldown');
            return false;
        }
        
        // Handle flash step teleport
        const player = this.engine.player;
        if (player && player.object3D) {
            // Calculate teleport distance
            const teleportDistance = 15;
            const teleportDirection = direction.clone().normalize().multiplyScalar(teleportDistance);
            
            // Store original position for effect
            const startPos = player.object3D.position.clone();
            
            // Create light flash at start position
            this._createLightFlash(startPos, 1);
            
            // Move player forward (teleport)
            player.object3D.position.add(teleportDirection);
            
            // Create light flash at end position
            this._createLightFlash(player.object3D.position.clone(), 1.5);
            
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
        
        return true;
    }
    
    /**
     * Use an ultimate attack - Solar Flare
     */
    useUltimateAttack(position, direction) {
        if (this.isOnCooldown('Solar Flare')) {
            console.log('Solar Flare is on cooldown');
            return false;
        }
        
        // Create a massive light explosion
        const solarFlare = this.createAreaEffect(position, {
            radius: 15,
            color: 0xffffcc,
            damage: this.power * 2,
            lifetime: 2,
            type: 'solarFlare'
        });
        
        if (solarFlare) {
            // Add a powerful light source
            const mainLight = new THREE.PointLight(0xffffcc, 3, 30);
            mainLight.position.y = 5;
            solarFlare.add(mainLight);
            
            // Add light beams shooting outward
            const beamCount = 12;
            for (let i = 0; i < beamCount; i++) {
                const angle = (i / beamCount) * Math.PI * 2;
                const radius = 2;
                const beamPos = new THREE.Vector3(
                    Math.cos(angle) * radius,
                    3, // Height above ground
                    Math.sin(angle) * radius
                );
                
                // Create a beam of light
                const beamGeometry = new THREE.CylinderGeometry(0.2, 0.5, 10, 8);
                const beamMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffaa,
                    transparent: true,
                    opacity: 0.7
                });
                const beam = new THREE.Mesh(beamGeometry, beamMaterial);
                beam.position.copy(beamPos);
                
                // Rotate beam outward
                beam.rotation.x = Math.PI / 2; // Make horizontal
                beam.rotation.z = angle; // Point outward
                
                solarFlare.add(beam);
                
                // Add small light to beam
                const beamLight = new THREE.PointLight(0xffffcc, 0.5, 8);
                beamLight.position.y = 0;
                beam.add(beamLight);
            }
            
            // Add update handler for expanding/fading effect
            const originalUpdate = solarFlare.userData.update;
            solarFlare.userData.update = function(deltaTime) {
                // Call the original update
                const result = originalUpdate(deltaTime);
                
                // Create light particles
                for (let i = 0; i < 5; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 10;
                    const height = Math.random() * 8;
                    const particlePos = new THREE.Vector3(
                        solarFlare.position.x + Math.cos(angle) * radius,
                        solarFlare.position.y + height,
                        solarFlare.position.z + Math.sin(angle) * radius
                    );
                    this._createLightParticle(particlePos, 0.3);
                }
                
                // Pulse the light intensity
                const time = this.engine.time ? this.engine.time.getElapsedTime() : 0;
                mainLight.intensity = 3 + Math.sin(time * 10) * 0.5;
                
                return result;
            }.bind(this);
        }
        
        // Set cooldown
        this.cooldowns['Solar Flare'] = 20; // 20 second cooldown
        
        return true;
    }
    
    /**
     * Create a light particle effect
     */
    _createLightParticle(position, size = 0.2) {
        const scene = this.engine.renderer.scene;
        if (!scene) return null;
        
        // Create a small light particle
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() < 0.5 ? 0xffffcc : 0xffff99,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        // Add data for update
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 1 + 0.5,
                (Math.random() - 0.5) * 2
            ),
            lifetime: Math.random() * 0.5 + 0.3,
            currentLifetime: 0,
            update: function(deltaTime) {
                // Move slightly in velocity direction
                this.position.add(this.userData.velocity.clone().multiplyScalar(deltaTime));
                
                // Fade out
                const lifeRatio = this.userData.currentLifetime / this.userData.lifetime;
                this.material.opacity = 0.8 * (1 - lifeRatio);
                
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
     * Create a light flash effect
     */
    _createLightFlash(position, size = 1) {
        const scene = this.engine.renderer.scene;
        if (!scene) return null;
        
        // Create a light flash group
        const flashGroup = new THREE.Group();
        flashGroup.position.copy(position);
        
        // Create the flash sphere
        const flashGeometry = new THREE.SphereGeometry(size, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffdd,
            transparent: true,
            opacity: 0.9
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flashGroup.add(flash);
        
        // Create a point light
        const light = new THREE.PointLight(0xffffdd, 2, size * 5);
        flashGroup.add(light);
        
        // Add data for update
        flashGroup.userData = {
            lifetime: 0.3, // Short lifetime
            currentLifetime: 0,
            update: function(deltaTime) {
                // Expand slightly
                const lifeRatio = this.userData.currentLifetime / this.userData.lifetime;
                const scale = 1 + lifeRatio;
                flash.scale.set(scale, scale, scale);
                
                // Fade out
                flash.material.opacity = 0.9 * (1 - lifeRatio);
                
                // Fade light
                light.intensity = 2 * (1 - lifeRatio);
                
                // Update lifetime
                this.userData.currentLifetime += deltaTime;
                
                // Destroy if lifetime is exceeded
                if (this.userData.currentLifetime >= this.userData.lifetime) {
                    scene.remove(this);
                    return false;
                }
                
                return true;
            }.bind(flashGroup)
        };
        
        // Add to scene
        scene.add(flashGroup);
        
        // Keep track of all effects to update them
        if (!this.engine.effectsToUpdate) {
            this.engine.effectsToUpdate = [];
        }
        this.engine.effectsToUpdate.push(flashGroup);
        
        return flashGroup;
    }
}