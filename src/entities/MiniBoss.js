/**
 * MiniBoss entity class
 */
import { Entity } from './Entity.js';
import * as THREE from 'three';

export class MiniBoss extends Entity {
    constructor(engine, options = {}) {
        super(engine);
        
        this.name = options.name || 'Boss';
        this.health = options.health || 200;
        this.maxHealth = options.maxHealth || 200;
        this.speed = options.speed || 2;
        this.attackPower = options.attackPower || 25;
        this.attackRange = options.attackRange || 8; // Attack range in units (larger than enemy)
        
        // Boss abilities
        this.abilities = options.abilities || [];
        this.currentAbilityIndex = 0;
        this.abilityRechargeTime = 5; // seconds
        this.abilityTimer = 0;
        
        // Create 3D representation
        this.object3D = this._createBossModel();
        
        // Boss state
        this.isActive = true;
        this.currentState = 'idle'; // idle, roam, chase, attack, special
        
        // Attack range visualization
        this.rangeIndicator = null;
        
        // Initialize boss
        this._init();
    }
    
    /**
     * Initialize the boss
     */
    _init() {
        // Add boss to scene
        this.engine.renderer.add(this.object3D);
        
        // Set initial position
        this.object3D.position.y = 0.01; // Just above ground
        
        // Create a collision body for the boss
        if (this.object3D && !this.object3D.userData) {
            this.object3D.userData = {};
        }
        
        if (this.object3D && this.object3D.userData) {
            this.object3D.userData.collider = {
                radius: 1.2,  // Boss collision radius (larger than enemies)
                height: 3.0   // Boss collision height
            };
        }
        
        // Create health bar
        this._createHealthBar();
    }
    
    /**
     * Create health bar visualization
     */
    _createHealthBar() {
        const healthBarGroup = new THREE.Group();
        
        // Health bar background
        const bgGeometry = new THREE.PlaneGeometry(2.0, 0.3);
        const bgMaterial = new THREE.MeshBasicMaterial({
            color: 0x222222,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const background = new THREE.Mesh(bgGeometry, bgMaterial);
        healthBarGroup.add(background);
        
        // Health bar foreground (shows health amount)
        const fgGeometry = new THREE.PlaneGeometry(2.0, 0.3);
        const fgMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const foreground = new THREE.Mesh(fgGeometry, fgMaterial);
        foreground.position.z = 0.01; // Slightly in front of background
        healthBarGroup.add(foreground);
        
        // Position the health bar above the boss
        healthBarGroup.position.y = 4.5;
        
        // Add health bar to boss object
        this.object3D.add(healthBarGroup);
        
        // Store reference to update later
        this.healthBar = {
            group: healthBarGroup,
            background: background,
            foreground: foreground
        };
        
        // Update health bar initial state
        this._updateHealthBar();
    }
    
    /**
     * Update health bar to reflect current health
     */
    _updateHealthBar() {
        if (!this.healthBar) return;
        
        // Calculate health percentage
        const healthPercent = this.health / this.maxHealth;
        
        // Update foreground width based on health percentage
        this.healthBar.foreground.scale.x = healthPercent;
        // Move the pivot point to the left
        this.healthBar.foreground.position.x = (healthPercent - 1) * 1.0;
        
        // Update color based on health (red to yellow to green)
        if (healthPercent > 0.6) {
            // Green for high health
            this.healthBar.foreground.material.color.setHex(0x00ff00);
        } else if (healthPercent > 0.3) {
            // Yellow for medium health
            this.healthBar.foreground.material.color.setHex(0xffff00);
        } else {
            // Red for low health
            this.healthBar.foreground.material.color.setHex(0xff0000);
        }
    }
    
    /**
     * Create the boss 3D model
     */
    _createBossModel() {
        // Create a group to hold boss visuals
        const bossGroup = new THREE.Group();
        
        // Try to get the boss texture
        let bossTexture;
        try {
            bossTexture = this.engine.resources.getTexture('boss');
        } catch (e) {
            console.warn("Boss texture not found, using fallback model");
        }
        
        if (bossTexture) {
            // Create sprite with boss texture
            const material = new THREE.SpriteMaterial({ 
                map: bossTexture,
                alphaTest: 0.5,  // Enables transparency
                color: 0xffffff  // White to show texture properly
            });
            
            const bossSprite = new THREE.Sprite(material);
            bossSprite.scale.set(5, 5, 1); // Larger size for boss
            bossSprite.position.y = 2.5;   // Place at correct height
            bossGroup.add(bossSprite);
            
            // Add shadow caster
            const shadowPlane = new THREE.Mesh(
                new THREE.CircleGeometry(1.2, 16),
                new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.4,
                    depthWrite: false
                })
            );
            shadowPlane.rotation.x = -Math.PI / 2; // Flat on ground
            shadowPlane.position.y = 0.01; // Slightly above ground to avoid z-fighting
            bossGroup.add(shadowPlane);
        } else {
            // Fallback to simple 3D model if texture not available
            // Boss body
            const bodyGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x800000 }); // Dark red
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 1.5; // Half height
            bossGroup.add(body);
            
            // Boss head
            const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
            const headMaterial = new THREE.MeshStandardMaterial({ color: 0x660000 }); // Darker red
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 3.5; // Above body
            bossGroup.add(head);
            
            // Boss horns
            const hornGeometry = new THREE.ConeGeometry(0.3, 1, 8);
            const hornMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Dark gray
            
            const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            leftHorn.position.set(-0.6, 4, 0);
            leftHorn.rotation.z = Math.PI / 6; // Tilt outward
            bossGroup.add(leftHorn);
            
            const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            rightHorn.position.set(0.6, 4, 0);
            rightHorn.rotation.z = -Math.PI / 6; // Tilt outward
            bossGroup.add(rightHorn);
        }
        
        return bossGroup;
    }
    
    /**
     * Update boss state
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update ability timer
        this.abilityTimer += deltaTime;
        
        // Update boss behavior based on current state
        switch (this.currentState) {
            case 'idle':
                this._updateIdle(deltaTime);
                break;
            case 'roam':
                this._updateRoam(deltaTime);
                break;
            case 'chase':
                this._updateChase(deltaTime);
                break;
            case 'attack':
                this._updateAttack(deltaTime);
                break;
            case 'special':
                this._updateSpecial(deltaTime);
                break;
        }
        
        // Check player proximity to show/hide attack range
        this._updateRangeIndicator();
    }
    
    /**
     * Create attack range indicator
     */
    _createRangeIndicator() {
        // Create a translucent red circle to indicate attack range
        const geometry = new THREE.CircleGeometry(this.attackRange, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5, // Increased opacity for better visibility
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const indicator = new THREE.Mesh(geometry, material);
        indicator.rotation.x = -Math.PI / 2; // Flat on ground
        indicator.position.y = 0.1; // Higher above ground to avoid z-fighting
        
        // Add to scene directly rather than as a child of the boss
        this.engine.renderer.scene.add(indicator);
        
        // Store reference
        this.rangeIndicator = indicator;
        
        // Initially hidden
        this.rangeIndicator.visible = false;
    }
    
    /**
     * Update attack range indicator visibility based on player proximity
     */
    _updateRangeIndicator() {
        // Create indicator if it doesn't exist
        if (!this.rangeIndicator) {
            this._createRangeIndicator();
        }
        
        // Get player from the game state
        const gameState = this.engine.stateManager.getCurrentState();
        if (!gameState || !gameState.player) return;
        
        const player = gameState.player;
        const playerPos = player.getPosition();
        const bossPos = this.getPosition();
        
        if (!playerPos || !bossPos) return;
        
        // Update indicator position to match boss position
        this.rangeIndicator.position.x = bossPos.x;
        this.rangeIndicator.position.z = bossPos.z;
        
        // Calculate distance to player
        const distance = Math.sqrt(
            Math.pow(playerPos.x - bossPos.x, 2) + 
            Math.pow(playerPos.z - bossPos.z, 2)
        );
        
        // Show indicator if player is close (within 3x attack range for better visibility)
        this.rangeIndicator.visible = (distance <= this.attackRange * 3);
    }
    
    /**
     * Update idle behavior
     */
    _updateIdle(deltaTime) {
        // In idle state, the boss just stands still
        // Potentially transition to roam or chase
    }
    
    /**
     * Update roam behavior
     */
    _updateRoam(deltaTime) {
        // Move around the island randomly
    }
    
    /**
     * Update chase behavior
     */
    _updateChase(deltaTime) {
        // Chase the player
    }
    
    /**
     * Update attack behavior
     */
    _updateAttack(deltaTime) {
        // Basic attack against the player
    }
    
    /**
     * Update special ability behavior
     */
    _updateSpecial(deltaTime) {
        // Execute a special attack
    }
    
    /**
     * Try to use a special ability
     */
    useSpecialAbility() {
        if (this.abilities.length === 0 || this.abilityTimer < this.abilityRechargeTime) {
            return false;
        }
        
        // Use the current ability
        const ability = this.abilities[this.currentAbilityIndex];
        
        // Reset timer
        this.abilityTimer = 0;
        
        // Move to next ability
        this.currentAbilityIndex = (this.currentAbilityIndex + 1) % this.abilities.length;
        
        // Change state to special
        this.currentState = 'special';
        
        return true;
    }
    
    /**
     * Make the boss take damage
     */
    takeDamage(amount) {
        const oldHealth = this.health;
        this.health -= amount;
        
        console.log(`Boss ${this.name} Health: ${oldHealth.toFixed(1)} -> ${this.health.toFixed(1)} (damage: ${amount.toFixed(1)})`);
        
        // Show hit effect (flash red)
        this._showHitEffect();
        
        // Update health bar
        this._updateHealthBar();
        
        // Boss becomes more aggressive when health is low
        if (this.health < this.maxHealth * 0.3) {
            this.speed *= 1.2; // Increase speed when low health
        }
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        
        return this.health;
    }
    
    /**
     * Show visual effect when boss is hit
     */
    _showHitEffect() {
        console.log(`BOSS HIT EFFECT: ${this.name}`);
        
        // For sprite-based bosses
        const sprites = [];
        this.object3D.traverse(object => {
            if (object instanceof THREE.Sprite) {
                sprites.push(object);
            }
        });
        
        // If we found sprites, handle them directly
        if (sprites.length > 0) {
            sprites.forEach(sprite => {
                console.log("Applying hit effect to boss sprite");
                // Store original color
                if (!sprite.userData) sprite.userData = {};
                if (!sprite.userData.originalColor) {
                    sprite.userData.originalColor = sprite.material.color.clone();
                }
                
                // Set to bright red
                sprite.material.color.set(0xff0000);
                
                // Create a brief flash effect
                setTimeout(() => {
                    if (sprite.userData.originalColor) {
                        sprite.material.color.copy(sprite.userData.originalColor);
                    }
                }, 200);
            });
        } else {
            // Handle regular meshes
            this.object3D.traverse((object) => {
                if (object.material) {
                    console.log("Applying hit effect to boss mesh");
                    // Store original color
                    if (!object.userData) object.userData = {};
                    if (!object.userData.originalColor && object.material.color) {
                        object.userData.originalColor = object.material.color.clone();
                    }
                    
                    // Set to red
                    object.material.color.set(0xff0000);
                    
                    // Revert back after a short delay
                    setTimeout(() => {
                        if (object.userData.originalColor) {
                            object.material.color.copy(object.userData.originalColor);
                        }
                    }, 200);
                }
            });
        }
    }
    
    /**
     * Boss death
     */
    die() {
        this.isActive = false;
        
        // Play death animation or effect
        
        // Remove after a delay
        setTimeout(() => {
            this.destroy();
        }, 2000); // Longer delay for boss death animation
    }
    
    /**
     * Set boss position
     */
    setPosition(x, y, z) {
        if (this.object3D) {
            this.object3D.position.set(x, y, z);
        }
    }
    
    /**
     * Get boss position
     */
    getPosition() {
        if (this.object3D) {
            return {
                x: this.object3D.position.x,
                y: this.object3D.position.y,
                z: this.object3D.position.z
            };
        }
        return null;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Dispose of range indicator first
        if (this.rangeIndicator) {
            if (this.rangeIndicator.geometry) {
                this.rangeIndicator.geometry.dispose();
            }
            if (this.rangeIndicator.material) {
                this.rangeIndicator.material.dispose();
            }
            // Remove from scene
            if (this.engine && this.engine.renderer && this.engine.renderer.scene) {
                this.engine.renderer.scene.remove(this.rangeIndicator);
            }
            this.rangeIndicator = null;
        }
        
        // Remove from scene
        if (this.object3D && this.object3D.parent) {
            this.object3D.parent.remove(this.object3D);
        }
        
        // Dispose of geometries and materials
        if (this.object3D) {
            this.object3D.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
    }
    
    /**
     * Handle player being nearby
     */
    onPlayerNearby(distance) {
        // If the player is within attack range, start chasing/attacking
        if (distance <= this.attackRange * 1.2) {
            // Switch to chase/attack mode
            if (this.currentState !== 'chase' && this.currentState !== 'attack') {
                this.currentState = 'chase';
                console.log(`${this.name} is now chasing player!`);
            }
        }
        
        // Always show range indicator when player is nearby
        if (this.rangeIndicator) {
            this.rangeIndicator.visible = true;
        }
    }
}