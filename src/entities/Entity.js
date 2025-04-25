/**
 * Base entity class for all game entities
 */
import * as THREE from 'three';

export class Entity {
    constructor(engine) {
        this.engine = engine;
        this.object3D = null;
        this.id = Entity.generateId();
        this.tags = [];
        this.active = true;
    }
    
    /**
     * Generate a unique ID for the entity
     */
    static generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Initialize the entity
     */
    init() {
        // Override in subclasses
    }
    
    /**
     * Update the entity
     */
    update(deltaTime) {
        // Override in subclasses
    }
    
    /**
     * Set entity position
     */
    setPosition(x, y, z) {
        if (this.object3D) {
            this.object3D.position.set(x, y, z);
        }
    }
    
    /**
     * Get entity position
     */
    getPosition() {
        if (this.object3D && this.object3D.position) {
            return this.object3D.position.clone();
        }
        return null;
    }
    
    /**
     * Set entity rotation
     */
    setRotation(x, y, z) {
        if (this.object3D) {
            this.object3D.rotation.set(x, y, z);
        }
    }
    
    /**
     * Get entity rotation
     */
    getRotation() {
        if (this.object3D) {
            return this.object3D.rotation.clone();
        }
        return null;
    }
    
    /**
     * Set entity scale
     */
    setScale(x, y, z) {
        if (this.object3D) {
            this.object3D.scale.set(x, y, z);
        }
    }
    
    /**
     * Add a tag to the entity
     */
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
        }
    }
    
    /**
     * Check if entity has a tag
     */
    hasTag(tag) {
        return this.tags.includes(tag);
    }
    
    /**
     * Remove a tag from the entity
     */
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index !== -1) {
            this.tags.splice(index, 1);
        }
    }
    
    /**
     * Activate the entity
     */
    activate() {
        this.active = true;
        if (this.object3D) {
            this.object3D.visible = true;
        }
    }
    
    /**
     * Deactivate the entity
     */
    deactivate() {
        this.active = false;
        if (this.object3D) {
            this.object3D.visible = false;
        }
    }
    
    /**
     * Destroy the entity and clean up resources
     */
    destroy() {
        // Override in subclasses
        // Make sure to dispose of geometries and materials
        if (this.object3D && this.object3D.parent) {
            this.object3D.parent.remove(this.object3D);
        }
    }
}