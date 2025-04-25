/**
 * Player entity class
 */
import { Entity } from './Entity.js';
import * as THREE from 'three';

export class Player extends Entity {
    constructor(engine, options = {}) {
        super(engine);
        
        this.name = options.name || 'Efrain';
        this.health = options.health || 100;
        this.maxHealth = options.maxHealth || 100;
        this.speed = options.speed || 5;
        this.jumpPower = options.jumpPower || 10;
        
        // Store selected fruits (powers)
        this.fruits = options.fruits || [];
        this.activeFruitIndex = 0;
        
        // Create 3D representation
        this.object3D = this._createPlayerModel();
        
        // Flag to check if player is moving
        this.isMoving = false;
        
        // Current velocity
        this.velocity = { x: 0, y: 0, z: 0 };
        
        // Initialize player
        this._init();
    }
    
    /**
     * Initialize the player
     */
    _init() {
        // Add player to scene
        this.engine.renderer.add(this.object3D);
        
        // Set initial position
        this.object3D.position.y = 0.01; // Just above ground
        
        // Ensure userData exists
        if (!this.object3D.userData) {
            this.object3D.userData = {};
        }
        
        // Create a collision body for the player
        this.object3D.userData.collider = {
            radius: 0.7,  // Player collision radius
            height: 2.0   // Player collision height
        };
    }
    
    /**
     * Create the player 3D model
     */
    _createPlayerModel() {
        // Create a player using billboard technique with the loaded texture
        const playerGroup = new THREE.Group();
        
        // Try to get the player texture
        let playerTexture;
        try {
            playerTexture = this.engine.resources.getTexture('player');
        } catch (e) {
            console.warn("Player texture not found, using fallback color");
        }
        
        if (playerTexture) {
            // Create sprite with player texture
            const material = new THREE.SpriteMaterial({ 
                map: playerTexture,
                alphaTest: 0.5,  // Enables transparency
                color: 0xffffff  // White to show texture properly
            });
            
            const playerSprite = new THREE.Sprite(material);
            playerSprite.scale.set(3, 3, 1); // Adjust size
            playerSprite.position.y = 1.5;   // Place at correct height
            playerGroup.add(playerSprite);
            
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
            playerGroup.add(shadowPlane);
        } else {
            // Fallback to simple 3D model if texture not available
            // Player body
            const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3333ff }); // Blue jacket
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.75; // Half height
            playerGroup.add(body);
            
            // Player head
            const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
            const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 }); // Skin color
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 1.9; // Above body
            playerGroup.add(head);
            
            // Player cap
            const capGeometry = new THREE.ConeGeometry(0.45, 0.4, 8);
            const capMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red cap
            const cap = new THREE.Mesh(capGeometry, capMaterial);
            cap.position.y = 2.2; // Above head
            cap.rotation.x = Math.PI / 8; // Tilt forward slightly
            playerGroup.add(cap);
        }
        
        return playerGroup;
    }
    
    /**
     * Update player state
     */
    update(deltaTime) {
        // Process movement
        this._updateMovement(deltaTime);
        
        // Update animations (if any)
        this._updateAnimations(deltaTime);
    }
    
    /**
     * Update player movement based on input
     */
    _updateMovement(deltaTime) {
        const input = this.engine.input;
        const speed = this.speed * deltaTime;
        
        // Get movement direction
        let moveX = 0;
        let moveZ = 0;
        
        // Standard WASD/Arrow keys movement
        if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) {
            moveZ -= speed;
        }
        
        if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) {
            moveZ += speed;
        }
        
        if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) {
            moveX -= speed;
        }
        
        if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) {
            moveX += speed;
        }
        
        // Update moving state
        this.isMoving = (moveX !== 0 || moveZ !== 0);
        
        // Adjust movement for isometric view
        if (this.isMoving) {
            // Convert grid-aligned movement to isometric movement
            const isoAngle = Math.PI / 4; // 45 degrees - standard for isometric
            const isoX = (moveX - moveZ) * Math.cos(isoAngle);
            const isoZ = (moveX + moveZ) * Math.sin(isoAngle);
            
            // Apply movement
            this.object3D.position.x += isoX;
            this.object3D.position.z += isoZ;
            
            // Rotate player to face movement direction
            const angle = Math.atan2(moveX, moveZ);
            
            // For sprite-based character, just store the facing angle
            if (this.object3D.children.length > 0 && this.object3D.children[0] instanceof THREE.Sprite) {
                this.object3D.userData.facingAngle = angle;
            } else {
                // For 3D model, rotate the player
                this.object3D.rotation.y = angle;
            }
        }
        
        // Keep player within island bounds
        const distanceFromCenter = Math.sqrt(
            this.object3D.position.x * this.object3D.position.x + 
            this.object3D.position.z * this.object3D.position.z
        );
        
        if (distanceFromCenter > 29) {
            // Player is too close to edge, push back
            const angle = Math.atan2(this.object3D.position.x, this.object3D.position.z);
            this.object3D.position.x = Math.sin(angle) * 29;
            this.object3D.position.z = Math.cos(angle) * 29;
        }
    }
    
    /**
     * Update any animations
     */
    _updateAnimations(deltaTime) {
        // Implement animations if needed
    }
    
    /**
     * Get the current active fruit
     */
    getActiveFruit() {
        if (this.fruits.length === 0) return null;
        return this.fruits[this.activeFruitIndex];
    }
    
    /**
     * Switch to a different fruit
     */
    switchFruit(index) {
        if (index >= 0 && index < this.fruits.length) {
            this.activeFruitIndex = index;
            return true;
        }
        return false;
    }
    
    /**
     * Take damage
     */
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        return this.health;
    }
    
    /**
     * Heal player
     */
    heal(amount) {
        this.health += amount;
        if (this.health > this.maxHealth) this.health = this.maxHealth;
        return this.health;
    }
    
    /**
     * Get health as percentage
     */
    getHealthPercentage() {
        return (this.health / this.maxHealth) * 100;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
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
}