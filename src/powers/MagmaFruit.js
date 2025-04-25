/**
 * Magma Fruit power class
 */
import { Fruit } from './Fruit.js';
import * as THREE from 'three';

export class MagmaFruit extends Fruit {
    constructor(engine, options = {}) {
        super(engine, {
            name: 'Magma Fruit',
            type: 'magma',
            power: options.power || 25,
            attacks: ['Magma Ball', 'Lava Field', 'Volcanic Eruption']
        });
    }
    
    /**
     * Use a basic attack - Magma Ball
     */
    useBasicAttack(position, direction) {
        if (this.isOnCooldown('Magma Ball')) {
            console.log('Magma Ball is on cooldown');
            return false;
        }
        
        // Create a magma ball projectile
        const magmaBall = this.createProjectile(position, direction, {
            geometry: new THREE.SphereGeometry(0.6, 12, 12),
            material: new THREE.MeshBasicMaterial({
                color: 0xff2200, // Bright red
                transparent: true,
                opacity: 0.9
            }),
            speed: 12,
            damage: this.power * 1.2,
            type: 'magmaBall'
        });
        
        // Add special effects to the magma ball
        if (magmaBall) {
            // Create a stronger point light to make it glow
            const light = new THREE.PointLight(0xff2200, 1.5, 8);
            magmaBall.add(light);
            
            // Add update handler for special effects
            const originalUpdate = magmaBall.userData.update;
            magmaBall.userData.update = function(deltaTime) {
                // Call the original update
                const result = originalUpdate(deltaTime);
                
                // Add magma drip effect
                if (Math.random() < 0.4) {
                    this._createMagmaParticle(magmaBall.position.clone());
                }
                
                return result;
            }.bind(this);
        }
        
        // Set cooldown
        this.cooldowns['Magma Ball'] = 1.2; // 1.2 second cooldown
        
        return true;
    }
    
    /**
     * Use a special attack - Lava Field
     */
    useSpecialAttack(position, direction) {
        if (this.isOnCooldown('Lava Field')) {
            console.log('Lava Field is on cooldown');
            return false;
        }
        
        // Create a lava field in front of the player
        const fieldPosition = new THREE.Vector3(
            position.x + direction.x * 5,
            position.y,
            position.z + direction.z * 5
        );
        
        // Create area effect
        const lavaField = this.createAreaEffect(fieldPosition, {
            radius: 6,
            color: 0xff3300,
            damage: this.power * 0.8,
            lifetime: 5,
            type: 'lavaField'
        });
        
        // Add custom appearance to lava field
        if (lavaField) {
            // Override the material with a more lava-like appearance
            if (lavaField.children[0] && lavaField.children[0].material) {
                lavaField.children[0].material.color.set(0xff2200);
                
                // Add texture for lava ripple effect (simulated with shader)
                lavaField.children[0].material.onBeforeCompile = (shader) => {
                    shader.uniforms.time = { value: 0 };
                    shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <begin_vertex>',
                        `#include <begin_vertex>
                        float wave = sin(position.x * 2.0 + time * 5.0) * 0.1 + 
                                    cos(position.z * 2.0 + time * 3.0) * 0.1;
                        transformed.y += wave;`
                    );
                    
                    // Store the shader to update time
                    lavaField.userData.shader = shader;
                };
            }
            
            // Add update handler for animation and effects
            const originalUpdate = lavaField.userData.update;
            lavaField.userData.update = function(deltaTime) {
                // Call the original update
                const result = originalUpdate(deltaTime);
                
                // Update shader time if it exists
                if (this.userData.shader && this.userData.shader.uniforms.time) {
                    this.userData.shader.uniforms.time.value += deltaTime;
                }
                
                // Add magma bubble effect
                if (Math.random() < 0.2) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 5;
                    const bubblePos = new THREE.Vector3(
                        this.position.x + Math.cos(angle) * radius,
                        this.position.y + 0.1,
                        this.position.z + Math.sin(angle) * radius
                    );
                    this.engine._createMagmaBubble(bubblePos);
                }
                
                return result;
            }.bind(lavaField);
            
            // Store engine reference for particle effects
            lavaField.engine = this;
        }
        
        // Set cooldown
        this.cooldowns['Lava Field'] = 10; // 10 second cooldown
        this.cooldowns['special'] = 10; // General special attack cooldown
        
        return true;
    }
    
    /**
     * Use an ultimate attack - Volcanic Eruption
     */
    useUltimateAttack(position, direction) {
        if (this.isOnCooldown('Volcanic Eruption')) {
            console.log('Volcanic Eruption is on cooldown');
            return false;
        }
        
        // Create a massive volcanic eruption at the player's position
        // This will damage all enemies in a wide radius
        const eruption = this.createAreaEffect(position, {
            radius: 15,
            color: 0xff0000,
            damage: this.power * 3,
            lifetime: 8,
            type: 'eruption'
        });
        
        // Add visual effects for eruption
        if (eruption) {
            // Create a pillar of lava in the center
            const pillarGeometry = new THREE.CylinderGeometry(1, 3, 15, 12);
            const pillarMaterial = new THREE.MeshBasicMaterial({
                color: 0xff1100,
                transparent: true,
                opacity: 0.8
            });
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.y = 7.5; // Half height
            eruption.add(pillar);
            
            // Add a strong light source
            const light = new THREE.PointLight(0xff3300, 3, 25);
            light.position.y = 5;
            eruption.add(light);
            
            // Add update handler for animation and effects
            const originalUpdate = eruption.userData.update;
            eruption.userData.update = function(deltaTime) {
                // Call the original update
                const result = originalUpdate(deltaTime);
                
                // Add eruption particles
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 3;
                    const particlePos = new THREE.Vector3(
                        this.position.x + Math.cos(angle) * radius,
                        this.position.y + 5 + Math.random() * 5,
                        this.position.z + Math.sin(angle) * radius
                    );
                    this.engine._createMagmaParticle(particlePos, true); // Large particles
                }
                
                // Gradually shrink the pillar as eruption ends
                const remainingLife = this.userData.lifetime - this.userData.currentLifetime;
                if (remainingLife < 2) {
                    const scale = remainingLife / 2;
                    if (pillar) {
                        pillar.scale.set(scale, scale, scale);
                        pillar.material.opacity = 0.8 * scale;
                    }
                    if (light) {
                        light.intensity = 3 * scale;
                    }
                }
                
                return result;
            }.bind(eruption);
            
            // Store engine reference for particle effects
            eruption.engine = this;
        }
        
        // Set very long cooldown for ultimate
        this.cooldowns['Volcanic Eruption'] = 40; // 40 second cooldown
        
        return true;
    }
    
    /**
     * Create a magma particle for effects
     */
    _createMagmaParticle(position, isLarge = false) {
        // Slightly randomize position
        position.x += (Math.random() - 0.5) * 0.3;
        position.z += (Math.random() - 0.5) * 0.3;
        
        // Create a magma droplet
        const size = isLarge ? 0.4 + Math.random() * 0.3 : 0.2 + Math.random() * 0.2;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.3 ? 0xff2200 : 0xff5500, // Variation in red/orange
            transparent: true,
            opacity: 0.9
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        // Add to scene
        this.engine.renderer.scene.add(particle);
        
        // Add a small light for larger particles
        if (isLarge) {
            const light = new THREE.PointLight(0xff3300, 0.5, 3);
            particle.add(light);
        }
        
        // Animate the particle
        const lifetime = isLarge ? 1.0 + Math.random() * 0.5 : 0.5 + Math.random() * 0.3;
        const startTime = Date.now();
        const duration = lifetime * 1000; // Convert to milliseconds
        
        // Add gravity movement
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2, // Random x movement
            isLarge ? 5 + Math.random() * 3 : -3 - Math.random() * 2, // Up or down based on type
            (Math.random() - 0.5) * 2  // Random z movement
        );
        
        // Gravity strength
        const gravity = isLarge ? 9.8 : 4.9;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            const deltaTime = 0.016; // Approx 60fps in seconds
            
            if (progress < 1) {
                // Apply gravity
                velocity.y -= gravity * deltaTime;
                
                // Move particle
                particle.position.x += velocity.x * deltaTime;
                particle.position.y += velocity.y * deltaTime;
                particle.position.z += velocity.z * deltaTime;
                
                // Bounce off ground
                if (particle.position.y <= 0.1 && velocity.y < 0) {
                    velocity.y = -velocity.y * 0.3; // Bounce with energy loss
                    particle.position.y = 0.1; // Prevent going below ground
                    
                    // Create splash effect
                    if (isLarge) {
                        for (let i = 0; i < 3; i++) {
                            const splashPos = particle.position.clone();
                            this._createMagmaParticle(splashPos, false);
                        }
                    }
                }
                
                // Shrink slightly over time
                const scale = 1 - progress * 0.4;
                particle.scale.set(scale, scale, scale);
                
                // Fade out near the end
                if (progress > 0.7) {
                    particle.material.opacity = 0.9 * (1 - ((progress - 0.7) / 0.3));
                    if (particle.children.length > 0 && particle.children[0].isLight) {
                        particle.children[0].intensity = 0.5 * (1 - ((progress - 0.7) / 0.3));
                    }
                }
                
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
    
    /**
     * Create a magma bubble effect for lava field
     */
    _createMagmaBubble(position) {
        // Create a small bubble
        const geometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0xff4400 : 0xff6600, // Variation in color
            transparent: true,
            opacity: 0.8
        });
        
        const bubble = new THREE.Mesh(geometry, material);
        bubble.position.copy(position);
        
        // Add to scene
        this.engine.renderer.scene.add(bubble);
        
        // Animate the bubble
        const lifetime = 0.5 + Math.random() * 0.5; // 0.5-1 second
        const startTime = Date.now();
        const duration = lifetime * 1000; // Convert to milliseconds
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Rise and grow
                bubble.position.y += 0.02;
                
                // Grow then pop
                let scale;
                if (progress < 0.8) {
                    scale = 1 + progress * 0.5;
                } else {
                    scale = 1 + 0.4 - ((progress - 0.8) * 2); // Shrink rapidly at the end
                }
                bubble.scale.set(scale, scale, scale);
                
                // Fade out at the very end
                if (progress > 0.8) {
                    bubble.material.opacity = 0.8 * (1 - ((progress - 0.8) / 0.2));
                }
                
                requestAnimationFrame(animate);
            } else {
                // Remove when animation is complete
                this.engine.renderer.scene.remove(bubble);
                bubble.geometry.dispose();
                bubble.material.dispose();
            }
        };
        
        // Start animation
        animate();
    }
}
