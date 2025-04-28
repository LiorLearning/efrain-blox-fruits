/**
 * Enemy entity class
 */
import { Entity } from './Entity.js';
import * as THREE from 'three';

export class Enemy extends Entity {
    constructor(engine, options = {}) {
        super(engine);
        
        this.name = options.name || 'Villain';
        this.health = options.health || 50;
        this.maxHealth = options.maxHealth || 50;
        this.speed = options.speed || 3;
        this.attackPower = options.attackPower || 10;
        this.attackRange = options.attackRange || 5; // Attack range in units
        
        // Create 3D representation
        this.object3D = this._createEnemyModel();
        
        // Enemy state
        this.isActive = true;
        this.currentState = 'idle'; // idle, patrol, chase, attack
        
        // Attack range visualization
        this.rangeIndicator = null;
        
        // Health bar
        this.healthBar = null;
        
        // Initialize enemy
        this._init();
    }
    
    /**
     * Initialize the enemy
     */
    _init() {
        // Add enemy to scene
        this.engine.renderer.add(this.object3D);
        
        // Set initial position
        this.object3D.position.y = 0.01; // Just above ground
        
        // Ensure userData exists
        if (!this.object3D.userData) {
            this.object3D.userData = {};
        }
        
        // Create a collision body for the enemy
        this.object3D.userData.collider = {
            radius: 0.7,  // Enemy collision radius
            height: 2.0   // Enemy collision height
        };
        
        // Create health bar
        this._createHealthBar();
    }
    
    /**
     * Create the enemy 3D model
     */
    _createEnemyModel() {
        // Create a group to hold enemy visuals
        const enemyGroup = new THREE.Group();
        
        // Try to get the villain texture
        let enemyTexture;
        try {
            enemyTexture = this.engine.resources.getTexture('villain');
        } catch (e) {
            console.warn("Villain texture not found, using fallback model");
        }
        
        if (enemyTexture) {
            // Create sprite with enemy texture
            const material = new THREE.SpriteMaterial({ 
                map: enemyTexture,
                alphaTest: 0.5,  // Enables transparency
                color: 0xffffff  // White to show texture properly
            });
            
            const enemySprite = new THREE.Sprite(material);
            enemySprite.scale.set(3, 3, 1); // Adjust size
            enemySprite.position.y = 1.5;   // Place at correct height
            enemyGroup.add(enemySprite);
            
            // Add shadow caster
            const shadowPlane = new THREE.Mesh(
                new THREE.CircleGeometry(0.7, 16),
                new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.3,
                    depthWrite: false
                })
            );
            shadowPlane.rotation.x = -Math.PI / 2; // Flat on ground
            shadowPlane.position.y = 0.01; // Slightly above ground to avoid z-fighting
            enemyGroup.add(shadowPlane);
        } else {
            // Fallback to simple 3D model if texture not available
            // Enemy body
            const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff3333 }); // Red
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.75; // Half height
            enemyGroup.add(body);
            
            // Enemy head
            const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
            const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 }); // Skin color
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 1.9; // Above body
            enemyGroup.add(head);
        }
        
        return enemyGroup;
    }
    
    /**
     * Create health bar visualization
     */
    _createHealthBar() {
        const healthBarGroup = new THREE.Group();
        
        // Health bar background
        const bgGeometry = new THREE.PlaneGeometry(1.5, 0.2);
        const bgMaterial = new THREE.MeshBasicMaterial({
            color: 0x222222,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const background = new THREE.Mesh(bgGeometry, bgMaterial);
        healthBarGroup.add(background);
        
        // Health bar foreground (shows health amount)
        const fgGeometry = new THREE.PlaneGeometry(1.5, 0.2);
        const fgMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const foreground = new THREE.Mesh(fgGeometry, fgMaterial);
        foreground.position.z = 0.01; // Slightly in front of background
        healthBarGroup.add(foreground);
        
        // Position the health bar above the enemy
        healthBarGroup.position.y = 3.0;
        
        // Add health bar to enemy object
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
        this.healthBar.foreground.position.x = (healthPercent - 1) * 0.75;
        
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
     * Update enemy state
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update enemy behavior based on current state
        switch (this.currentState) {
            case 'idle':
                this._updateIdle(deltaTime);
                break;
            case 'patrol':
                this._updatePatrol(deltaTime);
                break;
            case 'chase':
                this._updateChase(deltaTime);
                break;
            case 'attack':
                this._updateAttack(deltaTime);
                break;
        }
        
        // Check player proximity to show/hide attack range
        this._updateRangeIndicator();
        
        // Make health bar face the camera
        this._updateHealthBarOrientation();
    }
    
    /**
     * Make health bar always face the camera
     */
    _updateHealthBarOrientation() {
        if (!this.healthBar || !this.healthBar.group) return;
        
        // Get camera from renderer
        const camera = this.engine.renderer.camera;
        if (!camera) return;
        
        // Make health bar face the camera
        this.healthBar.group.lookAt(camera.position);
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
        
        // Add to scene directly rather than as a child of the enemy
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
        const enemyPos = this.getPosition();
        
        if (!playerPos || !enemyPos) return;
        
        // Update indicator position to match enemy position
        this.rangeIndicator.position.x = enemyPos.x;
        this.rangeIndicator.position.z = enemyPos.z;
        
        // Calculate distance to player
        const distance = Math.sqrt(
            Math.pow(playerPos.x - enemyPos.x, 2) + 
            Math.pow(playerPos.z - enemyPos.z, 2)
        );
        
        // Show indicator if player is close (within 3x attack range for better visibility)
        this.rangeIndicator.visible = (distance <= this.attackRange * 3);
    }
    
    /**
     * Update idle behavior
     */
    _updateIdle(deltaTime) {
        // In idle state, the enemy just stands still
        // Check for player nearby to transition to chase
    }
    
    /**
     * Update patrol behavior
     */
    _updatePatrol(deltaTime) {
        // Move along patrol path
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
        // Attack the player
    }
    
    /**
     * Make the enemy take damage
     */
    takeDamage(amount) {
        const oldHealth = this.health;
        this.health -= amount;
        
        console.log(`Enemy ${this.name} Health: ${oldHealth.toFixed(1)} -> ${this.health.toFixed(1)} (damage: ${amount.toFixed(1)})`);
        
        // Show hit effect
        this._showHitEffect();
        
        // Update health bar
        this._updateHealthBar();
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        
        return this.health;
    }
    
    /**
     * Show visual effect when enemy is hit
     */
    _showHitEffect() {
        console.log(`ENEMY HIT EFFECT: ${this.name}`);
        
        // For sprite-based enemies
        const sprites = [];
        this.object3D.traverse(object => {
            if (object instanceof THREE.Sprite) {
                sprites.push(object);
            }
        });
        
        // If we found sprites, handle them directly
        if (sprites.length > 0) {
            sprites.forEach(sprite => {
                console.log("Applying hit effect to sprite");
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
                    console.log("Applying hit effect to regular mesh");
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
     * Enemy death
     */
    die() {
        this.isActive = false;
        
        // Hide health bar
        if (this.healthBar && this.healthBar.group) {
            this.healthBar.group.visible = false;
        }
        
        // Play death animation or effect
        this._playDeathEffect();
        
        // Remove after a delay
        setTimeout(() => {
            this.destroy();
        }, 1000);
    }
    
    /**
     * Play death effect
     */
    _playDeathEffect() {
        // Simple fade out effect
        const fadeDuration = 1000; // ms
        const startTime = Date.now();
        
        // Create animation loop
        const fadeOut = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / fadeDuration, 1);
            
            // Reduce opacity
            this.object3D.traverse((object) => {
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => {
                            mat.transparent = true;
                            mat.opacity = 1 - progress;
                        });
                    } else {
                        object.material.transparent = true;
                        object.material.opacity = 1 - progress;
                    }
                }
            });
            
            if (progress < 1) {
                requestAnimationFrame(fadeOut);
            }
        };
        
        // Start fade out
        fadeOut();
    }
    
    /**
     * Set enemy position
     */
    setPosition(x, y, z) {
        if (this.object3D) {
            this.object3D.position.set(x, y, z);
        }
    }
    
    /**
     * Get enemy position
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