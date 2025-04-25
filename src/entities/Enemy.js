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
        
        // Create 3D representation
        this.object3D = this._createEnemyModel();
        
        // Enemy state
        this.isActive = true;
        this.currentState = 'idle'; // idle, patrol, chase, attack
        
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
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        
        return this.health;
    }
    
    /**
     * Enemy death
     */
    die() {
        this.isActive = false;
        
        // Play death animation or effect
        
        // Remove after a delay
        setTimeout(() => {
            this.destroy();
        }, 1000);
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