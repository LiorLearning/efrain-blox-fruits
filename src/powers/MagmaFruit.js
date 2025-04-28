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
        // Use the centralized attack logic
        return this._useAttack('Magma Ball', position, direction, (pos, dir) => {
            // Create a magma ball projectile
            const magmaBall = this.createProjectile(pos, dir, {
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
        });
    }
    
    /**
     * Use a special attack - Lava Field
     */
    useSpecialAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Lava Field', position, direction, (pos, dir) => {
            // Create a lava field in front of the player
            const fieldPosition = new THREE.Vector3(
                pos.x + dir.x * 5,
                pos.y,
                pos.z + dir.z * 5
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
                }
                
                // Add update handler for animation and effects
                const originalUpdate = lavaField.userData.update;
                lavaField.userData.update = function(deltaTime) {
                    // Call the original update
                    const result = originalUpdate(deltaTime);
                    
                    // Add magma bubble effect
                    if (Math.random() < 0.2) {
                        const angle = Math.random() * Math.PI * 2;
                        const radius = Math.random() * 5;
                        const bubblePos = new THREE.Vector3(
                            this.position.x + Math.cos(angle) * radius,
                            this.position.y + 0.1,
                            this.position.z + Math.sin(angle) * radius
                        );
                        this._createMagmaBubble(bubblePos);
                    }
                    
                    // Apply damage to enemies in range
                    this.checkEnemiesInRange(this.position, this.userData.radius, 
                        this.userData.damage * deltaTime * 0.5, 'magma');
                    
                    return result;
                }.bind(lavaField);
                
                // Store engine reference for particle effects
                lavaField.engine = this;
            }
            
            // Set cooldown
            this.cooldowns['Lava Field'] = 10; // 10 second cooldown
            this.cooldowns['special'] = 10; // General special attack cooldown
            
            return true;
        });
    }
    
    /**
     * Use an ultimate attack - Volcanic Eruption
     */
    useUltimateAttack(position, direction) {
        // Use the centralized attack logic
        return this._useAttack('Volcanic Eruption', position, direction, (pos, dir) => {
            // Create a massive volcanic eruption at the player's position
            // This will damage all enemies in a wide radius
            const eruption = this.createAreaEffect(pos, {
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
                    
                    // Apply damage to enemies in range
                    this.engine.checkEnemiesInRange(this.position, this.userData.radius, 
                        this.userData.damage * deltaTime * 0.2, 'magma');
                    
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
        });
    }
    
    /**
     * Create a magma particle for effects
     */
    _createMagmaParticle(position, isLarge = false) {
        // Use the centralized particle creation logic
        return this.createParticle(position, {
            size: isLarge ? 0.4 + Math.random() * 0.3 : 0.2 + Math.random() * 0.2,
            color: Math.random() > 0.3 ? 0xff2200 : 0xff5500, // Variation in red/orange
            opacity: 0.9,
            lifetime: isLarge ? 1.0 + Math.random() * 0.5 : 0.5 + Math.random() * 0.3,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2, // Random x movement
                isLarge ? 5 + Math.random() * 3 : -3 - Math.random() * 2, // Up or down based on type
                (Math.random() - 0.5) * 2  // Random z movement
            ),
            gravity: isLarge ? 9.8 : 4.9,
            bounce: true,
            bounceFactor: 0.3,
            createSplash: isLarge ? (splashPos) => {
                for (let i = 0; i < 3; i++) {
                    this._createMagmaParticle(splashPos, false);
                }
            } : null,
            addLight: isLarge,
            lightIntensity: 0.5,
            lightDistance: 3
        });
    }
    
    /**
     * Create a magma bubble effect for lava field
     */
    _createMagmaBubble(position) {
        // Use the centralized particle creation logic with custom update behavior
        const bubble = this.createParticle(position, {
            size: 0.2 + Math.random() * 0.3,
            color: Math.random() > 0.5 ? 0xff4400 : 0xff6600, // Variation in color
            opacity: 0.8,
            lifetime: 0.5 + Math.random() * 0.5, // 0.5-1 second
            velocity: new THREE.Vector3(0, 0.02, 0), // Just rise slowly
            scale: (progress) => {
                // Grow then pop
                if (progress < 0.8) {
                    return 1 + progress * 0.5;
                } else {
                    return 1 + 0.4 - ((progress - 0.8) * 2); // Shrink rapidly at the end
                }
            },
            fadeStart: 0.8 // Start fading at 80% of lifetime
        });
        
        return bubble;
    }
}