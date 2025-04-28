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
     * Use a basic attack
     */
    useBasicAttack(position, direction) {
        // Check if we have any uses left
        if (this.usesRemaining <= 0) {
            console.log(`No uses remaining for ${this.name}`);
            return false;
        }
        
        // Decrement uses
        this.usesRemaining--;
        
        // Log fruit usage clearly
        console.log(`===== FRUIT USAGE: ${this.name} =====`);
        console.log(`Attack: Basic Attack`);
        console.log(`Remaining uses: ${this.usesRemaining}`);
        console.log(`==================================`);
        
        // Override in subclasses
        return false;
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
        // Check if we have any uses left
        if (this.usesRemaining <= 0) {
            console.log(`No uses remaining for ${this.name}`);
            return false;
        }
        
        // Decrement uses
        this.usesRemaining--;
        
        // Log fruit usage clearly
        console.log(`===== FRUIT USAGE: ${this.name} =====`);
        console.log(`Attack: Special Attack`);
        console.log(`Remaining uses: ${this.usesRemaining}`);
        console.log(`==================================`);
        
        // Override in subclasses
        return false;
    }
    
    /**
     * Use an ultimate attack
     */
    useUltimateAttack(position, direction) {
        console.log(`Using ultimate attack for ${this.name}`);
        // Override in subclasses
        return false;
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
        
        return effectGroup;
    }
}