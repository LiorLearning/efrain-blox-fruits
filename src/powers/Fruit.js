/**
 * Base class for all fruit powers
 */
import * as THREE from 'three';

export class Fruit {
    constructor(engine, options = {}) {
        this.engine = engine;
        this.name = options.name || 'Unknown Fruit';
        this.type = options.type || 'unknown';
        this.power = options.power || 5;
        this.attacks = options.attacks || [];
        this.cooldowns = {};
        
        // Uses remaining for this fruit
        this.usesRemaining = 1;
        
        // Initialize cooldowns for all attacks
        this.attacks.forEach(attack => {
            this.cooldowns[attack] = 0;
        });
        
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
        // Check cooldown
        if (this.isOnCooldown(attackName)) {
            console.log(`${attackName} is on cooldown`);
            return false;
        }
        
        // Check if we have any uses left
        if (this.usesRemaining <= 0) {
            console.log(`No uses remaining for ${this.name}`);
            return false;
        }
        
        // Decrement uses
        this.usesRemaining--;
        
        // Play drop sound
        this.playDropSound();
        
        // Log fruit usage clearly
        console.log(`===== FRUIT USAGE: ${this.name} =====`);
        console.log(`Attack: ${attackName}`);
        console.log(`Remaining uses: ${this.usesRemaining}`);
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
        return this._useAttack('Basic Attack', position, direction);
    }
    
    /**
     * Add more uses to this fruit
     */
    addUses(amount) {
        this.usesRemaining += amount;
        console.log(`Added ${amount} uses to ${this.name}. Now has ${this.usesRemaining} uses remaining.`);
        return this.usesRemaining;
    }
    
    /**
     * Use a special attack
     */
    useSpecialAttack(position, direction) {
        return this._useAttack('Special Attack', position, direction);
    }
    
    /**
     * Use an ultimate attack
     */
    useUltimateAttack(position, direction) {
        return this._useAttack('Ultimate Attack', position, direction);
    }
    
    /**
     * Check if an attack is on cooldown
     */
    isOnCooldown(attackName) {
        return this.cooldowns[attackName] > 0;
    }
    
    /**
     * Update the fruit's state
     */
    update(deltaTime) {
        // Update cooldowns
        for (const attack in this.cooldowns) {
            if (this.cooldowns[attack] > 0) {
                this.cooldowns[attack] -= deltaTime;
                if (this.cooldowns[attack] < 0) {
                    this.cooldowns[attack] = 0;
                }
            }
        }
    }
    
    /**
     * Create a projectile or effect
     */
    createProjectile(position, direction, options = {}) {
        const scene = this.engine.renderer.scene;
        if (!scene) return null;
        
        // Create a projectile group
        const projectileGroup = new THREE.Group();
        
        // Add visual representation
        const geometry = options.geometry || new THREE.SphereGeometry(0.5, 8, 8);
        const material = options.material || new THREE.MeshBasicMaterial({ 
            color: options.color || 0xffffff
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
            type: options.type || 'projectile',
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
     * Create an area effect
     */
    createAreaEffect(position, options = {}) {
        const scene = this.engine.renderer.scene;
        if (!scene) return null;
        
        // Create effect group
        const effectGroup = new THREE.Group();
        
        // Add visual representation - a circle on the ground
        const geometry = options.geometry || new THREE.CircleGeometry(options.radius || 5, 32);
        const material = options.material || new THREE.MeshBasicMaterial({ 
            color: options.color || 0xffffff,
            transparent: true,
            opacity: options.opacity || 0.5
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2; // Make horizontal
        effectGroup.add(mesh);
        
        // Set position
        effectGroup.position.copy(position);
        
        // Store effect data
        effectGroup.userData = {
            damage: options.damage || this.power / 2,
            lifetime: options.lifetime || 3, // seconds
            currentLifetime: 0,
            radius: options.radius || 5,
            type: options.type || 'area',
            source: options.source || 'player',
            update: function(deltaTime) {
                // Pulse effect
                const scale = 1 + 0.1 * Math.sin(this.userData.currentLifetime * 5);
                mesh.scale.set(scale, scale, 1);
                
                // Update lifetime
                this.userData.currentLifetime += deltaTime;
                
                // Destroy if lifetime is exceeded
                if (this.userData.currentLifetime >= this.userData.lifetime) {
                    scene.remove(this);
                    return false;
                }
                
                return true;
            }.bind(effectGroup)
        };
        
        // Add to scene
        scene.add(effectGroup);
        
        // Track the effect in engine
        if (!this.engine.effectsToUpdate) {
            this.engine.effectsToUpdate = [];
        }
        this.engine.effectsToUpdate.push(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Create particle effects (disabled)
     */
    createParticle(position, options = {}) {
        // Disabled to remove all particle effects
        return null;
    }
    
    /**
     * Get player facing direction
     */
    getPlayerFacingDirection() {
        const player = this.engine.player;
        if (!player || !player.object3D) {
            return new THREE.Vector3(0, 0, -1); // Default forward
        }
        
        // Calculate attack direction based on player orientation
        let direction = new THREE.Vector3(0, 0, -1); // Default: forward
        
        // Get facing angle from either the sprite or the 3D model
        let facingAngle = 0;
        if (player.object3D.userData.facingAngle !== undefined) {
            facingAngle = player.object3D.userData.facingAngle;
        } else {
            facingAngle = player.object3D.rotation.y;
        }
        
        // Apply rotation to direction vector
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), facingAngle);
        
        return direction;
    }
    
    /**
     * Check for enemies in attack range
     */
    checkEnemiesInRange(position, range, damage, damageType) {
        const gameState = this.engine.stateManager.getCurrentState();
        if (!gameState || !gameState.enemies || !Array.isArray(gameState.enemies)) {
            return false;
        }
        
        let hitAny = false;
        
        // Check all enemies
        for (const enemy of gameState.enemies) {
            if (!enemy || !enemy.getPosition || !enemy.takeDamage) continue;
            
            const enemyPos = enemy.getPosition();
            if (!enemyPos) continue;
            
            const dist = Math.sqrt(
                Math.pow(position.x - enemyPos.x, 2) + 
                Math.pow(position.z - enemyPos.z, 2)
            );
            
            if (dist <= range) {
                // Calculate damage with falloff
                const falloff = 1 - (dist / range);
                const damageAmount = damage * falloff;
                
                // Apply damage
                enemy.takeDamage(damageAmount, damageType);
                hitAny = true;
            }
        }
        
        // Check boss if exists
        if (gameState.boss && gameState.boss.getPosition && gameState.boss.takeDamage) {
            const bossPos = gameState.boss.getPosition();
            if (bossPos) {
                const dist = Math.sqrt(
                    Math.pow(position.x - bossPos.x, 2) + 
                    Math.pow(position.z - bossPos.z, 2)
                );
                
                if (dist <= range) {
                    // Calculate damage with falloff
                    const falloff = 1 - (dist / range);
                    const damageAmount = damage * falloff;
                    
                    // Apply damage
                    gameState.boss.takeDamage(damageAmount, damageType);
                    hitAny = true;
                }
            }
        }
        
        return hitAny;
    }
}