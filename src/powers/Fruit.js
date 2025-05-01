/**
 * Base class for all fruit powers
 */
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';
import { AttackImplementations } from './common/AttackImplementations.js';
import { EffectsManager } from './common/EffectsManager.js';
import { EffectsUpdateManager } from '../core/EffectsUpdateManager.js';

export class Fruit {
    constructor(engine, options = {}) {
        this.engine = engine;
        this.name = options.name || 'Unknown Fruit';
        this.type = options.type || 'unknown';
        this.power = options.power || 25;
        this.attacks = options.attacks || [];
        
        // Store this fruit in the shared store if not already there
        if (!fruitStore.getFruit(this.name)) {
            fruitStore.addFruit({
                name: this.name,
                type: this.type,
                power: this.power,
                attacks: this.attacks
            });
        }
        
        // Texture for the fruit
        this.texture = null;
        this._loadTexture();
        
        // Audio setup
        this.audioListener = null;
        this._setupAudio();
        
        // Clean up any existing effects when a new fruit is created
        if (engine?.effectsToUpdate?.length > 0) {
            // Use the EffectsUpdateManager to clean up
            EffectsUpdateManager.cleanupAllEffects(engine);
        }
    }
    
    /**
     * Set up audio
     */
    _setupAudio() {
        // If there's a current state with an audio listener, use it
        const currentState = this.engine.stateManager.getCurrentStateInstance();
        if (currentState && currentState.audioListener) {
            this.audioListener = currentState.audioListener;
        } else if (this.engine.renderer && this.engine.renderer.camera) {
            // Create a new audio listener if none exists
            this.audioListener = new THREE.AudioListener();
            this.engine.renderer.camera.add(this.audioListener);
        }
    }
    
    /**
     * Play the drop sound
     */
    playDropSound() {
        // Only play if sound is enabled
        if (!this.engine.soundEnabled) return;
        
        // Need audio listener
        if (!this.audioListener) {
            this._setupAudio();
            if (!this.audioListener) return;
        }
        
        // Create audio source
        const sound = new THREE.Audio(this.audioListener);
        
        // Get drop sound buffer
        const dropSoundBuffer = this.engine.resources.getSound('dropSound');
        
        if (dropSoundBuffer) {
            // Set buffer to audio source
            sound.setBuffer(dropSoundBuffer);
            // Set volume
            sound.setVolume(0.5);
            // Play sound
            sound.play();
        }
    }
    
    /**
     * Load the fruit's texture
     */
    _loadTexture() {
        try {
            // Try to get the texture based on the fruit type
            const textureName = `${this.type}Fruit`;
            this.texture = this.engine.resources.getTexture(textureName);
        } catch(e) {
            console.warn(`Texture for ${this.name} not found:`, e);
        }
    }
    
    /**
     * Core attack usage logic for all fruits
     * This is the centralized method that handles common logic for all attacks
     */
    _useAttack(attackName, position, direction, attackFunction) {
        // Use the shared fruit store to check cooldown and uses
        if (!fruitStore.useAttack(this.name, attackName)) {
            return false;
        }
        
        // Play drop sound
        this.playDropSound();

        // Execute the attack-specific logic if provided
        let result = true;
        if (typeof attackFunction === 'function') {
            result = attackFunction(position, direction);
        }
        
        return result;
    }
    
    /**
     * Use a basic attack
     */
    useBasicAttack(position, direction) {
        return this._useAttack('Basic Attack', position, direction, (pos, dir) => {
            // Default implementation - subclasses should override or use AttackImplementations
            return true;
        });
    }
    
    /**
     * Add more uses to this fruit
     */
    addUses(amount) {
        fruitStore.addUses(this.name, amount);
        const uses = fruitStore.getFruit(this.name).usesRemaining;
        return uses;
    }
    
    /**
     * Use a special attack
     */
    useSpecialAttack(position, direction) {
        return this._useAttack('Special Attack', position, direction, (pos, dir) => {
            // Create an area effect at the player's position
            const range = 10; // Default range of 10 units
            const damage = this.power * 1.5; // Special attack does 1.5x more damage than normal
            
            // Create visual area effect
            const areaEffect = this.createAreaEffect(pos, {
                radius: range,
                damage: damage,
                type: this.type,
                lifetime: 1.5, // Lasts 1.5 seconds
                opacity: 0.4
            });
            
            // Apply damage to all enemies in range
            const affectedEnemies = this.checkEnemiesInRange(pos, range, damage, this.type);
            
            // Create particle effects for visual feedback
            for (let i = 0; i < 20; i++) {
                this.createParticle(pos, {
                    type: this.type,
                    spread: range * 0.8, // Particles spread within 80% of the range
                    lifetime: 1.2,
                    size: 0.3
                });
            }
            
            return affectedEnemies.length > 0;
        });
    }
    
    /**
     * Use an ultimate attack
     */
    useUltimateAttack(position, direction) {
        return this._useAttack('Ultimate Attack', position, direction, (pos, dir) => {
            // Default implementation - subclasses should override or use AttackImplementations
            return true;
        });
    }
    
    /**
     * Check if an attack is on cooldown
     */
    isOnCooldown(attackName) {
        const fruit = fruitStore.getFruit(this.name);
        if (!fruit) return true;
        
        return fruit.currentCooldowns[attackName] > 0;
    }
    
    /**
     * Get cooldown percentage for an attack
     */
    getCooldownPercentage(attackName) {
        return fruitStore.getCooldownPercentage(this.name, attackName);
    }
    
    /**
     * Get cooldown time remaining for an attack
     */
    getCooldownTimeRemaining(attackName) {
        const fruit = fruitStore.getFruit(this.name);
        if (!fruit) return 0;
        
        return fruit.currentCooldowns[attackName];
    }
    
    /**
     * Update the fruit's state
     */
    update(deltaTime) {
        // The actual cooldown updates are now handled by the FruitStore
    }
    
    /**
     * Create a projectile or effect - leveraging common implementations
     */
    createProjectile(position, direction, options = {}) {
        const scene = this.engine.renderer.scene;
        if (!scene) return null;
        
        // Create a projectile group
        const projectileGroup = new THREE.Group();
        
        // Add visual representation
        const geometry = options.geometry || EffectsManager.getTypeGeometry(options.type || this.type);
        const material = options.material || new THREE.MeshBasicMaterial({ 
            color: options.color || EffectsManager.getTypeColor(options.type || this.type),
            transparent: true,
            opacity: options.opacity || 0.3
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        projectileGroup.add(mesh);
        
        // Set position
        projectileGroup.position.copy(position);
        
        // Store projectile data
        projectileGroup.userData = {
            direction: direction ? direction.clone().normalize() : new THREE.Vector3(0, 0, 0),
            speed: options.speed || 10,
            damage: options.damage || this.power,
            lifetime: options.lifetime || 1, // reduced from 2 seconds to 1 second
            currentLifetime: 0,
            type: options.type || this.type,
            source: options.source || 'player',
            update: function(deltaTime) {
                // Update position
                this.position.x += this.userData.direction.x * this.userData.speed * deltaTime;
                this.position.y += this.userData.direction.y * this.userData.speed * deltaTime;
                this.position.z += this.userData.direction.z * this.userData.speed * deltaTime;
                
                // Update lifetime
                this.userData.currentLifetime += deltaTime;
                
                // Destroy if lifetime is exceeded
                if (this.userData.currentLifetime >= this.userData.lifetime) {
                    scene.remove(this);
                    return false;
                }
                
                return true;
            }.bind(projectileGroup)
        };
        
        // Add to scene
        scene.add(projectileGroup);
        
        // Track the projectile in engine effects
        if (!this.engine.effectsToUpdate) {
            this.engine.effectsToUpdate = [];
        }
        this.engine.effectsToUpdate.push(projectileGroup);
        
        return projectileGroup;
    }
    
    /**
     * Create an area effect - leveraging common implementations
     */
    createAreaEffect(position, options = {}) {
        const scene = this.engine.renderer.scene;
        if (!scene) return null;
        
        // Create an area effect group
        const areaEffectGroup = new THREE.Group();
        
        // Create a visual representation
        const geometry = new THREE.SphereGeometry(options.radius || 5, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: options.color || EffectsManager.getTypeColor(options.type || this.type),
            transparent: true,
            opacity: options.opacity || 0.3
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        areaEffectGroup.add(mesh);
        
        // Set position
        areaEffectGroup.position.copy(position);
        
        // Store effect data
        areaEffectGroup.userData = {
            radius: options.radius || 5,
            damage: options.damage || this.power,
            lifetime: options.lifetime || 1, // reduced from 3 seconds to 1 second
            currentLifetime: 0,
            type: options.type || this.type,
            source: options.source || 'player',
            update: function(deltaTime) {
                // Update lifetime
                this.userData.currentLifetime += deltaTime;
                
                // Update opacity based on lifetime
                const remainingLifePercent = 1 - (this.userData.currentLifetime / this.userData.lifetime);
                const mesh = this.children[0];
                if (mesh && mesh.material) {
                    mesh.material.opacity = (options.opacity || 0.3) * remainingLifePercent;
                }
                
                // Apply damage to enemies in range
                // This would be handled by game logic elsewhere
                
                // Destroy if lifetime is exceeded
                if (this.userData.currentLifetime >= this.userData.lifetime) {
                    scene.remove(this);
                    return false;
                }
                
                return true;
            }.bind(areaEffectGroup)
        };
        
        // Add to scene
        scene.add(areaEffectGroup);
        
        // Track the effect in engine effects
        if (!this.engine.effectsToUpdate) {
            this.engine.effectsToUpdate = [];
        }
        this.engine.effectsToUpdate.push(areaEffectGroup);
        
        return areaEffectGroup;
    }
    
    /**
     * Create a particle - leveraging common implementations 
     */
    createParticle(position, options = {}) {
        const scene = this.engine.renderer.scene;
        if (!scene) return null;
        
        // Create a particle
        const particleGroup = new THREE.Group();
        
        // Add visual representation
        const geometry = options.geometry || new THREE.SphereGeometry(options.size || 0.2, 8, 8);
        const material = options.material || new THREE.MeshBasicMaterial({ 
            color: options.color || EffectsManager.getTypeColor(options.type || this.type),
            transparent: true,
            opacity: options.opacity || 0.4
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        particleGroup.add(mesh);
        
        // Set position - if stationary, don't add random offset
        if (options.stationary) {
            particleGroup.position.set(
                position.x,
                position.y,
                position.z
            );
        } else {
            // Set position with random offset
            const offsetX = (Math.random() - 0.5) * (options.spread || 1);
            const offsetY = (Math.random() - 0.5) * (options.spread || 1);
            const offsetZ = (Math.random() - 0.5) * (options.spread || 1);
            
            particleGroup.position.set(
                position.x + offsetX,
                position.y + offsetY,
                position.z + offsetZ
            );
        }
        
        // Store particle data
        particleGroup.userData = {
            direction: new THREE.Vector3(0, 0, 0), // Zero direction for stationary particles
            speed: options.speed || 0, // Default to 0 speed for stationary
            lifetime: options.lifetime || 0.5, // reduced from 1 second to 0.5 seconds
            currentLifetime: 0,
            type: options.type || this.type,
            update: function(deltaTime) {
                // Update lifetime
                this.userData.currentLifetime += deltaTime;
                
                // Update opacity based on lifetime
                const remainingLifePercent = 1 - (this.userData.currentLifetime / this.userData.lifetime);
                const mesh = this.children[0];
                if (mesh && mesh.material) {
                    mesh.material.opacity = (options.opacity || 0.4) * remainingLifePercent;
                }
                
                // Destroy if lifetime is exceeded
                if (this.userData.currentLifetime >= this.userData.lifetime) {
                    scene.remove(this);
                    return false;
                }
                
                return true;
            }.bind(particleGroup)
        };
        
        // Add to scene
        scene.add(particleGroup);
        
        // Track the particle in engine effects
        if (!this.engine.effectsToUpdate) {
            this.engine.effectsToUpdate = [];
        }
        this.engine.effectsToUpdate.push(particleGroup);
        
        return particleGroup;
    }
    
    /**
     * Check enemies in range - common implementation 
     */
    checkEnemiesInRange(position, range, damage, damageType) {
        // This would be implemented by the game's collision system
        // Stub implementation for now
        console.log(`Checking enemies in range ${range}, damage ${damage}, type ${damageType}`);
        
        // Get all objects in the scene
        const scene = this.engine.renderer.scene;
        if (!scene) return [];
        
        const affectedEnemies = [];
        
        // Check distance to each object
        scene.traverse(object => {
            // Only consider objects with userData.type === 'enemy'
            if (object.userData && object.userData.type === 'enemy') {
                // Calculate distance
                const distance = position.distanceTo(object.position);
                
                // If within range, apply damage
                if (distance <= range) {
                    // Add to affected enemies
                    affectedEnemies.push(object);
                    
                    // Apply status effect based on damage type
                    if (damageType) {
                        const statusEffectOptions = this._getStatusEffectForType(damageType, damage);
                        if (statusEffectOptions) {
                            EffectsManager.applyStatusEffect(this, object, statusEffectOptions);
                        }
                    }
                    
                    // Apply damage
                    if (object.userData.takeDamage) {
                        object.userData.takeDamage(damage, damageType);
                    } else {
                        // Default damage handling
                        if (!object.userData.health) {
                            object.userData.health = 100;
                        }
                        object.userData.health -= damage;
                        console.log(`Enemy took ${damage} damage, health: ${object.userData.health}`);
                    }
                }
            }
        });
        
        return affectedEnemies;
    }
    
    /**
     * Get the appropriate status effect based on damage type
     */
    _getStatusEffectForType(damageType, damage) {
        switch (damageType) {
            case 'flame':
            case 'magma':
                return {
                    type: damageType,
                    duration: 1,
                    tickDamage: damage * 0.1
                };
            case 'ice':
                return {
                    type: damageType,
                    duration: 1,
                    slowFactor: 0.5
                };
            case 'bomb':
                return {
                    type: damageType,
                    duration: 0.5,
                    knockback: 5
                };
            case 'light':
                return {
                    type: damageType,
                    duration: 1,
                    blindEffect: true
                };
            default:
                return null;
        }
    }
    
    /**
     * Clean up all effects created by this fruit
     */
    _cleanupEffects() {
        EffectsUpdateManager.cleanupAllEffects(this.engine);
    }
}