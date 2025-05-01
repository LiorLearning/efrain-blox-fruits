/**
 * Base class for all fruit powers
 */
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';
import { AttackImplementations } from './common/AttackImplementations.js';
import { EffectsManager } from './common/EffectsManager.js';

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
        
        // Log fruit usage clearly
        console.log(`===== FRUIT USAGE: ${this.name} =====`);
        console.log(`Attack: ${attackName}`);
        console.log(`Damage: ${fruitStore.getFruit(this.name).damageValues[attackName]}`);
        console.log(`==================================`);
        
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
            // Default implementation - subclasses should override or use AttackImplementations
            return true;
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
            color: options.color || EffectsManager.getTypeColor(options.type || this.type)
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        projectileGroup.add(mesh);
        
        // Set position
        projectileGroup.position.copy(position);
        
        // Store projectile data
        projectileGroup.userData = {
            direction: direction.clone().normalize(),
            speed: options.speed || 10,
            damage: options.damage || this.power,
            lifetime: options.lifetime || 2, // seconds
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
            opacity: options.opacity || 0.5
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        areaEffectGroup.add(mesh);
        
        // Set position
        areaEffectGroup.position.copy(position);
        
        // Store effect data
        areaEffectGroup.userData = {
            radius: options.radius || 5,
            damage: options.damage || this.power,
            lifetime: options.lifetime || 3, // seconds
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
                    mesh.material.opacity = (options.opacity || 0.5) * remainingLifePercent;
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
            opacity: options.opacity || 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        particleGroup.add(mesh);
        
        // Set position with random offset
        const offsetX = (Math.random() - 0.5) * (options.spread || 1);
        const offsetY = (Math.random() - 0.5) * (options.spread || 1);
        const offsetZ = (Math.random() - 0.5) * (options.spread || 1);
        
        particleGroup.position.set(
            position.x + offsetX,
            position.y + offsetY,
            position.z + offsetZ
        );
        
        // Random direction
        const direction = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        ).normalize();
        
        // Store particle data
        particleGroup.userData = {
            direction: direction,
            speed: options.speed || 2,
            lifetime: options.lifetime || 1, // seconds
            currentLifetime: 0,
            type: options.type || this.type,
            update: function(deltaTime) {
                // Update position
                this.position.x += this.userData.direction.x * this.userData.speed * deltaTime;
                this.position.y += this.userData.direction.y * this.userData.speed * deltaTime;
                this.position.z += this.userData.direction.z * this.userData.speed * deltaTime;
                
                // Update lifetime
                this.userData.currentLifetime += deltaTime;
                
                // Update opacity based on lifetime
                const remainingLifePercent = 1 - (this.userData.currentLifetime / this.userData.lifetime);
                const mesh = this.children[0];
                if (mesh && mesh.material) {
                    mesh.material.opacity = (options.opacity || 0.8) * remainingLifePercent;
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
     * Get player facing direction
     */
    getPlayerFacingDirection() {
        // Get the camera direction
        const camera = this.engine.renderer.camera;
        if (!camera) return new THREE.Vector3(0, 0, -1);
        
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        
        // If we only want horizontal movement, zero out the Y component
        direction.y = 0;
        direction.normalize();
        
        return direction;
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
                    duration: 3,
                    tickDamage: damage * 0.1
                };
            case 'ice':
                return {
                    type: damageType,
                    duration: 2,
                    slowFactor: 0.5
                };
            case 'bomb':
                return {
                    type: damageType,
                    duration: 1,
                    knockback: 5
                };
            case 'light':
                return {
                    type: damageType,
                    duration: 2,
                    blindEffect: true
                };
            default:
                return null;
        }
    }
}