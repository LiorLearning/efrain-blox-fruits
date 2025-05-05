/**
 * Enemy entity class
 */
import { Entity } from './Entity.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';

export class Enemy extends Entity {
    constructor(engine, options = {}) {
        super(engine);
        
        this.name = options.name || 'Villain';
        this.health = options.health || 50;
        this.maxHealth = options.maxHealth || 50;
        this.speed = options.speed || 3;
        this.attackPower = options.attackPower || 10;
        this.attackRange = options.attackRange || 4; // Increased attack range from 5 to 8 units
        
        // Create 3D representation
        this.object3D = this._createEnemyModel();
        
        // Enemy state
        this.isActive = true;
        this.currentState = 'idle'; // idle, patrol, chase, attack
        
        // Patrol settings
        this.patrolRadius = options.patrolRadius || 5;
        this.patrolSpeed = options.patrolSpeed || this.speed * 0.5;
        this.patrolTarget = null;
        
        // Attack settings
        this.attackCooldown = 0;
        this.attackCooldownTime = 2; // seconds
        
        // Player proximity timer for delayed attacks - not used anymore since we attack immediately
        this.playerProximityTimer = 0;
        this.attackDelay = 0; // Set to 0 to attack immediately when in range
        this.playerInRange = false;
        
        // Attack range visualization
        this.rangeIndicator = null;
        
        // Health bar
        this.healthBar = null;
        
        // Assign a random fruit to the enemy
        this._assignRandomFruit();
        
        // Initialize enemy
        this._init();
    }
    
    /**
     * Assign a random fruit to the enemy
     */
    _assignRandomFruit() {
        const fruitTypes = ['flame', 'ice', 'bomb', 'light', 'magma', 'dark', 'gas'];
        const randomType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        
        // Create a random name for the fruit
        const fruitName = `${randomType.charAt(0).toUpperCase() + randomType.slice(1)} Fruit`;
        
        this.fruit = {
            name: fruitName,
            type: randomType,
            power: 5 + Math.floor(Math.random() * 10), // Random power between 5-15
            attacks: ['Basic Attack', 'Special Attack']
        };
        
        // Register fruit with the fruitStore if it's not already there
        if (!fruitStore.getFruit(fruitName)) {
            fruitStore.addFruit(this.fruit);
        }
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
            enemySprite.scale.set(4, 4, 1); // Increased size
            enemySprite.position.y = 2;     // Raised height to match larger size
            enemyGroup.add(enemySprite);
            
            // Store reference to sprite for flipping
            this.enemySprite = enemySprite;
            // Initialize facing direction (1 for right, -1 for left)
            this.facingDirection = 1;
            
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
        
        // Position correction - move the center of the bar based on scaling
        // When scale is less than 1, center the bar by offsetting by half the difference
        const offsetX = (1 - healthPercent) * 0.75;
        this.healthBar.foreground.position.x = -offsetX;
        
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
        
        // Check player proximity on every update to determine if they're in range
        this._checkPlayerProximity();
        
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
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown < 0) {
                this.attackCooldown = 0;
            }
        }
        
        // If player is in range and we're not already attacking, switch to attack state
        if (this.playerInRange && this.currentState !== 'attack' && this.attackCooldown <= 0) {
            this.currentState = 'attack';
            this._performAttack();
        } else if (!this.playerInRange && this.currentState === 'attack') {
            // If player leaves range while we're attacking, go back to chase
            this.currentState = 'chase';
        }
    }
    
    /**
     * Check if player is within attack range
     */
    _checkPlayerProximity() {
        // Get the game state to access player
        const gameState = this.engine.stateManager.getCurrentState();
        if (!gameState || !gameState.player) return;
        
        const player = gameState.player;
        const playerPos = player.getPosition();
        const enemyPos = this.getPosition();
        
        if (!playerPos || !enemyPos) return;
        
        // Calculate distance to player
        const distance = Math.sqrt(
            Math.pow(playerPos.x - enemyPos.x, 2) + 
            Math.pow(playerPos.z - enemyPos.z, 2)
        );
        
        // Update playerInRange flag based on distance
        const wasInRange = this.playerInRange;
        this.playerInRange = (distance <= this.attackRange);
        
        // If player is nearby but not in range, chase them
        if (!this.playerInRange && distance < 10 && this.currentState !== 'chase') {
            this.currentState = 'chase';
        }
        
        // Log when player enters/exits range
        if (this.playerInRange && !wasInRange) {
            console.log(`Player entered ${this.name}'s attack range`);
        } else if (!this.playerInRange && wasInRange) {
            console.log(`Player left ${this.name}'s attack range`);
        }
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
            opacity: 0.3, // Lower opacity for better visibility
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
        // Show range indicator
        if (this.rangeIndicator) {
            // Create range indicator if it doesn't exist
            if (!this.rangeIndicator) {
                this._createRangeIndicator();
            }
            
            // Make the indicator visible
            this.rangeIndicator.visible = true;
            
            // Update indicator position to follow the enemy
            const pos = this.getPosition();
            if (pos) {
                this.rangeIndicator.position.x = pos.x;
                this.rangeIndicator.position.z = pos.z;
            }
        } else {
            // Create the indicator if it doesn't exist
            this._createRangeIndicator();
        }
    }
    
    /**
     * Update idle behavior
     */
    _updateIdle(deltaTime) {
        // In idle state, the enemy just stands still
        // Randomly transition to patrol
        if (Math.random() < 0.01) {
            this.currentState = 'patrol';
            // Set a random patrol target within range
            this._setRandomPatrolTarget();
        }
    }
    
    /**
     * Set a random patrol target within the patrol radius
     */
    _setRandomPatrolTarget() {
        // Get current position
        const pos = this.getPosition();
        if (!pos) return;
        
        // Generate random angle and distance within patrol radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.patrolRadius;
        
        // Calculate new target position
        const targetX = pos.x + Math.cos(angle) * distance;
        const targetZ = pos.z + Math.sin(angle) * distance;
        
        // Store as patrol target
        this.patrolTarget = { x: targetX, z: targetZ };
    }
    
    /**
     * Update patrol behavior
     */
    _updatePatrol(deltaTime) {
        // Check if player is solving math problem
        const gameState = this.engine.stateManager.getCurrentState();
        if (gameState && gameState.player && gameState.player.mathChallengeActive) {
            return; // Pause movement if player is solving math
        }
        
        // If no patrol target, set one
        if (!this.patrolTarget) {
            this._setRandomPatrolTarget();
            return;
        }
        
        // Get current position
        const pos = this.getPosition();
        if (!pos) return;
        
        // Calculate direction to patrol target
        const dirX = this.patrolTarget.x - pos.x;
        const dirZ = this.patrolTarget.z - pos.z;
        
        // Calculate distance to target
        const distanceToTarget = Math.sqrt(dirX * dirX + dirZ * dirZ);
        
        // If we've reached the target, set a new one
        if (distanceToTarget < 0.5) {
            this._setRandomPatrolTarget();
            
            // Sometimes transition back to idle
            if (Math.random() < 0.3) {
                this.currentState = 'idle';
            }
            return;
        }
        
        // Normalize direction and move
        const normalizedDirX = dirX / distanceToTarget;
        const normalizedDirZ = dirZ / distanceToTarget;
        
        // Move toward target at patrol speed
        const moveSpeed = this.patrolSpeed * deltaTime;
        this.object3D.position.x += normalizedDirX * moveSpeed;
        this.object3D.position.z += normalizedDirZ * moveSpeed;
        
        // Rotate to face movement direction
        const angle = Math.atan2(normalizedDirX, normalizedDirZ);
        this.object3D.rotation.y = angle;
        
        // Flip sprite based on movement direction
        this._updateSpriteDirection(normalizedDirX);
    }
    
    /**
     * Update chase behavior
     */
    _updateChase(deltaTime) {
        // Check if player is solving math problem
        const gameState = this.engine.stateManager.getCurrentState();
        if (gameState && gameState.player && gameState.player.mathChallengeActive) {
            return; // Pause movement if player is solving math
        }
        
        // Get player
        if (!gameState || !gameState.player) {
            // No player to chase, go back to patrol
            this.currentState = 'patrol';
            return;
        }
        
        const playerPos = gameState.player.getPosition();
        const enemyPos = this.getPosition();
        
        if (!playerPos || !enemyPos) {
            return;
        }
        
        // Calculate direction to player
        const dirX = playerPos.x - enemyPos.x;
        const dirZ = playerPos.z - enemyPos.z;
        
        // Calculate distance to player
        const distanceToPlayer = Math.sqrt(dirX * dirX + dirZ * dirZ);
        
        // If player is in attack range, switch to attack
        if (distanceToPlayer <= this.attackRange) {
            this.currentState = 'attack';
            return;
        }
        
        // If player is too far away, go back to patrol
        if (distanceToPlayer > 15) {
            this.currentState = 'patrol';
            return;
        }
        
        // Normalize direction and move
        const normalizedDirX = dirX / distanceToPlayer;
        const normalizedDirZ = dirZ / distanceToPlayer;
        
        // Move toward player at chase speed
        const moveSpeed = this.speed * deltaTime;
        this.object3D.position.x += normalizedDirX * moveSpeed;
        this.object3D.position.z += normalizedDirZ * moveSpeed;
        
        // Rotate to face movement direction
        const angle = Math.atan2(normalizedDirX, normalizedDirZ);
        this.object3D.rotation.y = angle;
        
        // Flip sprite based on movement direction
        this._updateSpriteDirection(normalizedDirX);
    }
    
    /**
     * Update attack behavior
     */
    _updateAttack(deltaTime) {
        // Check if player is solving math problem
        const gameState = this.engine.stateManager.getCurrentState();
        if (gameState && gameState.player && gameState.player.mathChallengeActive) {
            return; // Pause attacking if player is solving math
        }
        
        // If player is no longer in range (this is now checked in _checkPlayerProximity)
        if (!this.playerInRange) {
            this.currentState = 'chase';
            return;
        }
        
        // If we can attack again (cooldown is over)
        if (this.attackCooldown <= 0) {
            this._performAttack();
        }
    }
    
    /**
     * Perform an attack against the player
     */
    _performAttack() {
        console.log(`${this.name} attacks player!`);
        
        // Get the game state to access player
        const gameState = this.engine.stateManager.getCurrentState();
        if (!gameState || !gameState.player) return;
        
        // Check if we have a fruit to attack with
        if (this.fruit) {
            this._shootFruit(gameState.player.getPosition());
        } else {
            // Deal damage to player with regular attack
            gameState.player.takeDamage(this.attackPower);
            
            // Create attack effect
            const playerPos = gameState.player.getPosition();
            if (playerPos) {
                this._createAttackEffect(playerPos);
            }
        }
        
        // Set attack cooldown
        this.attackCooldown = this.attackCooldownTime;
    }
    
    /**
     * Shoot a fruit projectile at the player
     */
    _shootFruit(targetPos) {
        if (!targetPos || !this.fruit) return;
        
        const enemyPos = this.getPosition();
        if (!enemyPos) return;
        
        // Get fruit data from store
        const fruitData = fruitStore.getFruit(this.fruit.name);
        if (!fruitData) return;
        
        // Use the attack via fruitStore
        const attackName = 'Basic Attack';
        const success = fruitStore.useAttack(this.fruit.name, attackName);
        
        if (!success) {
            // If couldn't use fruit power (e.g. on cooldown), do a regular attack
            console.log(`${this.name} couldn't use fruit power, using regular attack`);
            const gameState = this.engine.stateManager.getCurrentState();
            if (gameState && gameState.player) {
                gameState.player.takeDamage(this.attackPower);
                this._createAttackEffect(targetPos);
            }
            return;
        }
        
        // Create fruit projectile
        const fruitColor = this._getFruitColor(this.fruit.type);
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: fruitColor,
            transparent: true,
            opacity: 0.9
        });
        
        const fruitProjectile = new THREE.Mesh(geometry, material);
        fruitProjectile.position.set(enemyPos.x, enemyPos.y + 1, enemyPos.z);
        
        // Add to scene
        this.engine.renderer.scene.add(fruitProjectile);
        
        // Calculate direction to player
        const direction = new THREE.Vector3(
            targetPos.x - enemyPos.x,
            (targetPos.y + 1) - (enemyPos.y + 1),
            targetPos.z - enemyPos.z
        ).normalize();
        
        // Animation variables
        const startTime = Date.now();
        const duration = 1000; // ms
        const speed = 10; // units per second
        const damage = fruitData.damageValues[attackName];
        
        // Add trail effect
        this._createFruitTrail(fruitProjectile, fruitColor);
        
        // Animate projectile
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            // Move projectile
            fruitProjectile.position.x += direction.x * speed * (this.engine.time.deltaTime || 0.016);
            fruitProjectile.position.y += direction.y * speed * (this.engine.time.deltaTime || 0.016);
            fruitProjectile.position.z += direction.z * speed * (this.engine.time.deltaTime || 0.016);
            
            // Check if projectile reached target
            const gameState = this.engine.stateManager.getCurrentState();
            if (gameState && gameState.player) {
                const playerPos = gameState.player.getPosition();
                if (playerPos) {
                    const distanceToPlayer = Math.sqrt(
                        Math.pow(fruitProjectile.position.x - playerPos.x, 2) +
                        Math.pow(fruitProjectile.position.z - playerPos.z, 2)
                    );
                    
                    // If hit player or time elapsed
                    if (distanceToPlayer < 1 || progress >= 1) {
                        // Deal damage only if we hit the player
                        if (distanceToPlayer < 1) {
                            gameState.player.takeDamage(damage, this.fruit.type);
                            this._createHitEffect(playerPos, this.fruit.type);
                        }
                        
                        // Remove projectile
                        this.engine.renderer.scene.remove(fruitProjectile);
                        fruitProjectile.geometry.dispose();
                        fruitProjectile.material.dispose();
                        return;
                    }
                }
            }
            
            // Continue animation if not hit
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove projectile when animation is complete
                this.engine.renderer.scene.remove(fruitProjectile);
                fruitProjectile.geometry.dispose();
                fruitProjectile.material.dispose();
            }
        };
        
        // Start animation
        animate();
    }
    
    /**
     * Create a trail effect for the fruit projectile
     */
    _createFruitTrail(projectile, color) {
        // Setup trail particles
        const createTrailParticle = () => {
            if (!projectile || !this.engine.renderer.scene) return;
            
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.7
                })
            );
            
            // Position at current projectile position
            particle.position.copy(projectile.position);
            
            // Add to scene
            this.engine.renderer.scene.add(particle);
            
            // Animate fade out
            const startTime = Date.now();
            const duration = 500; // ms
            
            const animateParticle = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                particle.material.opacity = 0.7 * (1 - progress);
                particle.scale.multiplyScalar(0.98);
                
                if (progress < 1) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.engine.renderer.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                }
            };
            
            animateParticle();
        };
        
        // Create particles every 100ms
        const trailInterval = setInterval(() => {
            if (!projectile.parent) {
                clearInterval(trailInterval);
                return;
            }
            createTrailParticle();
        }, 100);
        
        // Clear interval after 2 seconds (safety)
        setTimeout(() => clearInterval(trailInterval), 2000);
    }
    
    /**
     * Create a hit effect when fruit projectile hits player
     */
    _createHitEffect(position, fruitType) {
        const color = this._getFruitColor(fruitType);
        
        // Create explosion effect
        const particles = [];
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            // Random position around hit point
            particle.position.set(
                position.x + (Math.random() - 0.5) * 0.2,
                position.y + 1 + (Math.random() - 0.5) * 0.2,
                position.z + (Math.random() - 0.5) * 0.2
            );
            
            // Random velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.05 + Math.random() * 0.1;
            particle.userData = {
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: 0.05 + Math.random() * 0.1,
                    z: Math.sin(angle) * speed
                }
            };
            
            // Add to scene
            this.engine.renderer.scene.add(particle);
            particles.push(particle);
        }
        
        // Animate particles
        const startTime = Date.now();
        const duration = 800; // ms
        
        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            particles.forEach(particle => {
                // Move particle
                particle.position.x += particle.userData.velocity.x;
                particle.position.y += particle.userData.velocity.y;
                particle.position.z += particle.userData.velocity.z;
                
                // Apply gravity
                particle.userData.velocity.y -= 0.003;
                
                // Fade out
                particle.material.opacity = 0.8 * (1 - progress);
            });
            
            if (progress < 1) {
                requestAnimationFrame(animateParticles);
            } else {
                // Remove particles
                particles.forEach(particle => {
                    this.engine.renderer.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
            }
        };
        
        animateParticles();
    }
    
    /**
     * Get color based on fruit type
     */
    _getFruitColor(type) {
        const colors = {
            flame: 0xff5500,
            ice: 0x00aaff,
            bomb: 0x555555,
            light: 0xffffaa,
            magma: 0xff3300,
            dark: 0x222222,
            gas: 0xccffee,
            default: 0xaaaaaa
        };
        
        return colors[type] || colors.default;
    }
    
    /**
     * Create visual effect for attack
     */
    _createAttackEffect(targetPos) {
        // Create a simple attack effect
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        
        const attackEffect = new THREE.Mesh(geometry, material);
        attackEffect.position.set(targetPos.x, targetPos.y + 1, targetPos.z);
        
        // Add to scene
        this.engine.renderer.scene.add(attackEffect);
        
        // Animate effect
        const startTime = Date.now();
        const duration = 300; // ms
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Scale effect
            attackEffect.scale.set(1 + progress, 1 + progress, 1 + progress);
            attackEffect.material.opacity = 0.7 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove effect when animation is complete
                this.engine.renderer.scene.remove(attackEffect);
                attackEffect.geometry.dispose();
                attackEffect.material.dispose();
            }
        };
        
        // Start animation
        animate();
    }
    
    /**
     * Make the enemy take damage
     */
    takeDamage(amount, damageType) {
        // Log the damage with type
        console.log(`Enemy ${this.name} taking ${amount.toFixed(1)} damage of type: ${damageType || 'default'}`);
        
        const oldHealth = this.health;
        this.health -= amount;
        
        console.log(`Enemy ${this.name} Health: ${oldHealth.toFixed(1)} -> ${this.health.toFixed(1)} (damage: ${amount.toFixed(1)})`);
        
        // Show hit effect
        this._showHitEffect(damageType);
        
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
    _showHitEffect(damageType) {
        console.log(`ENEMY HIT EFFECT: ${this.name} (${damageType || 'default'})`);
        
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
        // If the player is within attack range, start tracking time
        if (distance <= this.attackRange * 1.2) {
            // Switch to chase mode if not already chasing or attacking
            if (this.currentState !== 'chase' && this.currentState !== 'attack') {
                this.currentState = 'chase';
                console.log(`${this.name} is now chasing player!`);
            }
            
            // Mark player as in range to start the timer
            this.playerInRange = true;
        } else {
            // Player is out of range
            this.playerInRange = false;
            this.playerProximityTimer = 0;
        }
        
        // Range indicators are disabled for better gameplay experience
        if (this.rangeIndicator) {
            this.rangeIndicator.visible = false;
        }
    }
    
    /**
     * Update sprite direction based on movement
     * @param {number} dirX - X direction of movement (negative = left, positive = right)
     */
    _updateSpriteDirection(dirX) {
        // Only flip the sprite if we have a sprite reference
        if (!this.enemySprite) return;
        
        // If moving left (negative X direction)
        if (dirX < 0 && this.facingDirection !== -1) {
            // Flip the sprite by making scale.x negative
            this.enemySprite.scale.x = -Math.abs(this.enemySprite.scale.x);
            this.facingDirection = -1;
        } 
        // If moving right (positive X direction)
        else if (dirX > 0 && this.facingDirection !== 1) {
            // Reset to normal by making scale.x positive
            this.enemySprite.scale.x = Math.abs(this.enemySprite.scale.x);
            this.facingDirection = 1;
        }
    }
}