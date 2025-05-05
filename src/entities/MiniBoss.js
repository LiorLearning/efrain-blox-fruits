/**
 * MiniBoss entity class
 */
import { Entity } from './Entity.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';

export class MiniBoss extends Entity {
    constructor(engine, options = {}) {
        super(engine);
        
        this.name = options.name || 'Boss';
        this.health = options.health || 200;
        this.maxHealth = options.maxHealth || 200;
        this.speed = options.speed || 2;
        this.attackPower = options.attackPower || 25;
        this.attackRange = options.attackRange || 4; // Increased attack range from 5 to 10 units
        
        // Boss abilities
        this.abilities = options.abilities || [];
        this.currentAbilityIndex = 0;
        this.abilityRechargeTime = 5; // seconds
        this.abilityTimer = 0;
        
        // Attack settings
        this.attackCooldown = 0;
        this.attackCooldownTime = 3; // seconds
        
        // Player proximity timer - not used anymore since we attack immediately
        this.playerProximityTimer = 0;
        this.attackDelay = 0; // Set to 0 to attack immediately when in range
        this.playerInRange = false;
        
        // Create 3D representation
        this.object3D = this._createBossModel();
        
        // Boss state
        this.isActive = true;
        this.currentState = 'idle'; // idle, roam, chase, attack, special
        
        // Attack range visualization
        this.rangeIndicator = null;
        
        // Assign multiple random fruits to the boss
        this._assignRandomFruits();
        
        // Initialize boss
        this._init();
    }
    
    /**
     * Assign multiple random fruits to the boss
     */
    _assignRandomFruits() {
        // Boss gets 3 different fruits
        const fruitTypes = ['flame', 'ice', 'bomb', 'light', 'magma', 'dark', 'gas'];
        this.fruits = [];
        
        // Select 3 unique random fruits
        const selectedTypes = [];
        while (selectedTypes.length < 3) {
            const randomType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
            if (!selectedTypes.includes(randomType)) {
                selectedTypes.push(randomType);
            }
        }
        
        // Create fruits with higher power than regular enemies
        selectedTypes.forEach((type, index) => {
            const fruitName = `Boss ${type.charAt(0).toUpperCase() + type.slice(1)} Fruit`;
            
            const fruit = {
                name: fruitName,
                type: type,
                power: 15 + Math.floor(Math.random() * 10), // Random power between 15-25 (stronger than enemies)
                attacks: ['Basic Attack', 'Special Attack']
            };
            
            // Register fruit with the fruitStore
            if (!fruitStore.getFruit(fruitName)) {
                fruitStore.addFruit(fruit);
            }
            
            this.fruits.push(fruit);
        });
        
        // Set current fruit to first one
        this.currentFruitIndex = 0;
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
        
        // Position correction - move the center of the bar based on scaling
        // When scale is less than 1, center the bar by offsetting by half the difference
        const offsetX = (1 - healthPercent) * 1.0;
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
            bossSprite.scale.set(6, 6, 1); // Larger size for boss
            bossSprite.position.y = 3;   // Place at correct height
            bossGroup.add(bossSprite);
            
            // Store reference to sprite for flipping
            this.bossSprite = bossSprite;
            // Initialize facing direction (1 for right, -1 for left)
            this.facingDirection = 1;
            
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
        
        // Check player proximity on every update to determine if they're in range
        this._checkPlayerProximity();
        
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
        const bossPos = this.getPosition();
        
        if (!playerPos || !bossPos) return;
        
        // Calculate distance to player
        const distance = Math.sqrt(
            Math.pow(playerPos.x - bossPos.x, 2) + 
            Math.pow(playerPos.z - bossPos.z, 2)
        );
        
        // Update playerInRange flag based on distance
        const wasInRange = this.playerInRange;
        this.playerInRange = (distance <= this.attackRange);
        
        // If player is nearby but not in range, chase them
        if (!this.playerInRange && distance < 15 && this.currentState !== 'chase') {
            this.currentState = 'chase';
        }
        
        // Log when player enters/exits range
        if (this.playerInRange && !wasInRange) {
            console.log(`Player entered Boss ${this.name}'s attack range`);
        } else if (!this.playerInRange && wasInRange) {
            console.log(`Player left Boss ${this.name}'s attack range`);
        }
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
        // Show range indicator
        if (this.rangeIndicator) {
            // Create range indicator if it doesn't exist
            if (!this.rangeIndicator) {
                this._createRangeIndicator();
            }
            
            // Make the indicator visible
            this.rangeIndicator.visible = true;
            
            // Update indicator position to follow the boss
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
        // In idle state, the boss just stands still
        // Randomly transition to roam
        if (Math.random() < 0.01) {
            this.currentState = 'roam';
            // Set a random roam target
            this._setRandomRoamTarget();
        }
    }
    
    /**
     * Set a random roam target on the island
     */
    _setRandomRoamTarget() {
        // Generate random angle and distance
        const angle = Math.random() * Math.PI * 2;
        // Random distance between 5 and 15 units
        const distance = 5 + Math.random() * 10;
        
        // Calculate new target position
        const targetX = Math.cos(angle) * distance;
        const targetZ = Math.sin(angle) * distance;
        
        // Store as roam target
        this.roamTarget = { x: targetX, z: targetZ };
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
            // No player to chase, go back to roam
            this.currentState = 'roam';
            return;
        }
        
        const playerPos = gameState.player.getPosition();
        const bossPos = this.getPosition();
        
        if (!playerPos || !bossPos) {
            return;
        }
        
        // Calculate direction to player
        const dirX = playerPos.x - bossPos.x;
        const dirZ = playerPos.z - bossPos.z;
        
        // Calculate distance to player
        const distanceToPlayer = Math.sqrt(dirX * dirX + dirZ * dirZ);
        
        // If player is in attack range, switch to attack
        if (distanceToPlayer <= this.attackRange) {
            this.currentState = 'attack';
            return;
        }
        
        // If player is too far away, go back to roam
        if (distanceToPlayer > 20) {
            this.currentState = 'roam';
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
     * Update roam behavior
     */
    _updateRoam(deltaTime) {
        // Check if player is solving math problem
        const gameState = this.engine.stateManager.getCurrentState();
        if (gameState && gameState.player && gameState.player.mathChallengeActive) {
            return; // Pause movement if player is solving math
        }
        
        // If no roam target, set one
        if (!this.roamTarget) {
            this._setRandomRoamTarget();
            return;
        }
        
        // Get current position
        const pos = this.getPosition();
        if (!pos) return;
        
        // Calculate direction to roam target
        const dirX = this.roamTarget.x - pos.x;
        const dirZ = this.roamTarget.z - pos.z;
        
        // Calculate distance to target
        const distanceToTarget = Math.sqrt(dirX * dirX + dirZ * dirZ);
        
        // If we've reached the target, set a new one
        if (distanceToTarget < 1.0) {
            this._setRandomRoamTarget();
            
            // Sometimes transition back to idle
            if (Math.random() < 0.3) {
                this.currentState = 'idle';
            }
            return;
        }
        
        // Normalize direction and move
        const normalizedDirX = dirX / distanceToTarget;
        const normalizedDirZ = dirZ / distanceToTarget;
        
        // Move toward target at half speed
        const moveSpeed = (this.speed * 0.5) * deltaTime;
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
            
            // Sometimes use a special ability after attacking
            if (this.abilityTimer >= this.abilityRechargeTime && Math.random() < 0.3) {
                this.currentState = 'special';
                this.abilityTimer = 0;
            }
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
        
        // Select which type of attack to perform
        const attackType = Math.random() > 0.3 ? 'fruit' : 'regular';
        
        if (attackType === 'fruit' && this.fruits && this.fruits.length > 0) {
            // Switch to a random fruit for variety
            this.currentFruitIndex = Math.floor(Math.random() * this.fruits.length);
            
            // Get player position
            const playerPos = gameState.player.getPosition();
            if (playerPos) {
                // Multi-fruit attack pattern
                this._shootMultiFruitAttack(playerPos);
            }
        } else {
            // Regular attack - deal damage to player
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
     * Shoot multiple fruit projectiles in a pattern
     */
    _shootMultiFruitAttack(targetPos) {
        if (!targetPos || !this.fruits || this.fruits.length === 0) return;
        
        const bossPos = this.getPosition();
        if (!bossPos) return;
        
        // Get current fruit data
        const currentFruit = this.fruits[this.currentFruitIndex];
        const fruitData = fruitStore.getFruit(currentFruit.name);
        if (!fruitData) return;
        
        // Determine attack pattern (random)
        const patterns = ['circle', 'line', 'burst'];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        // Use the attack via fruitStore
        const attackName = 'Basic Attack';
        fruitStore.resetCooldowns(currentFruit.name); // Boss doesn't have cooldown limitations
        fruitStore.addUses(currentFruit.name, 10); // Ensure boss has plenty of uses
        const success = fruitStore.useAttack(currentFruit.name, attackName);
        
        if (!success) {
            // If couldn't use fruit power, do a regular attack
            console.log(`${this.name} couldn't use fruit power, using regular attack`);
            const gameState = this.engine.stateManager.getCurrentState();
            if (gameState && gameState.player) {
                gameState.player.takeDamage(this.attackPower);
                this._createAttackEffect(targetPos);
            }
            return;
        }
        
        // Create fruit projectiles based on pattern
        switch (pattern) {
            case 'circle':
                this._createCircleAttack(bossPos, targetPos, currentFruit);
                break;
            case 'line':
                this._createLineAttack(bossPos, targetPos, currentFruit);
                break;
            case 'burst':
                this._createBurstAttack(bossPos, targetPos, currentFruit);
                break;
        }
    }
    
    /**
     * Create a circle pattern of fruit projectiles
     */
    _createCircleAttack(sourcePos, targetPos, fruit) {
        const fruitColor = this._getFruitColor(fruit.type);
        const fruitData = fruitStore.getFruit(fruit.name);
        const damage = fruitData.damageValues['Basic Attack'];
        
        // Create 8 projectiles in a circle
        const projectileCount = 8;
        
        for (let i = 0; i < projectileCount; i++) {
            // Calculate angle and direction
            const angle = (i / projectileCount) * Math.PI * 2;
            const direction = new THREE.Vector3(
                Math.cos(angle),
                0,
                Math.sin(angle)
            ).normalize();
            
            // Create projectile
            const geometry = new THREE.SphereGeometry(0.4, 8, 8);
            const material = new THREE.MeshBasicMaterial({ 
                color: fruitColor,
                transparent: true,
                opacity: 0.9
            });
            
            const projectile = new THREE.Mesh(geometry, material);
            projectile.position.set(sourcePos.x, sourcePos.y + 1.5, sourcePos.z);
            
            // Add to scene
            this.engine.renderer.scene.add(projectile);
            
            // Create trail effect
            this._createFruitTrail(projectile, fruitColor);
            
            // Animate projectile
            const startTime = Date.now();
            const duration = 2000; // ms
            const speed = 7; // units per second
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;
                
                // Move projectile
                projectile.position.x += direction.x * speed * (this.engine.time.deltaTime || 0.016);
                projectile.position.y += 0; // No vertical movement
                projectile.position.z += direction.z * speed * (this.engine.time.deltaTime || 0.016);
                
                // Check if hit player
                const gameState = this.engine.stateManager.getCurrentState();
                if (gameState && gameState.player && gameState.player.isActive) {
                    const playerPos = gameState.player.getPosition();
                    if (playerPos) {
                        const distanceToPlayer = Math.sqrt(
                            Math.pow(projectile.position.x - playerPos.x, 2) +
                            Math.pow(projectile.position.z - playerPos.z, 2)
                        );
                        
                        // If hit player
                        if (distanceToPlayer < 1) {
                            gameState.player.takeDamage(damage, fruit.type);
                            this._createHitEffect(playerPos, fruit.type);
                            
                            // Remove projectile
                            this.engine.renderer.scene.remove(projectile);
                            projectile.geometry.dispose();
                            projectile.material.dispose();
                            return;
                        }
                    }
                }
                
                // Continue animation if not hit and not completed
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Remove projectile when animation is complete
                    this.engine.renderer.scene.remove(projectile);
                    projectile.geometry.dispose();
                    projectile.material.dispose();
                }
            };
            
            // Start animation
            animate();
        }
    }
    
    /**
     * Create a line pattern of fruit projectiles
     */
    _createLineAttack(sourcePos, targetPos, fruit) {
        const fruitColor = this._getFruitColor(fruit.type);
        const fruitData = fruitStore.getFruit(fruit.name);
        const damage = fruitData.damageValues['Basic Attack'];
        
        // Calculate direction to player
        const direction = new THREE.Vector3(
            targetPos.x - sourcePos.x,
            0,
            targetPos.z - sourcePos.z
        ).normalize();
        
        // Create 5 projectiles in a line
        const projectileCount = 5;
        const projectileSpacing = 0.8; // spacing between projectiles
        
        for (let i = 0; i < projectileCount; i++) {
            // Delayed creation for sequential firing
            setTimeout(() => {
                // Create projectile
                const geometry = new THREE.SphereGeometry(0.4, 8, 8);
                const material = new THREE.MeshBasicMaterial({ 
                    color: fruitColor,
                    transparent: true,
                    opacity: 0.9
                });
                
                const projectile = new THREE.Mesh(geometry, material);
                projectile.position.set(sourcePos.x, sourcePos.y + 1.5, sourcePos.z);
                
                // Add to scene
                this.engine.renderer.scene.add(projectile);
                
                // Create trail effect
                this._createFruitTrail(projectile, fruitColor);
                
                // Animate projectile
                const startTime = Date.now();
                const duration = 2000; // ms
                const speed = 12; // units per second
                
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = elapsed / duration;
                    
                    // Move projectile
                    projectile.position.x += direction.x * speed * (this.engine.time.deltaTime || 0.016);
                    projectile.position.y += 0; // No vertical movement
                    projectile.position.z += direction.z * speed * (this.engine.time.deltaTime || 0.016);
                    
                    // Check if hit player
                    const gameState = this.engine.stateManager.getCurrentState();
                    if (gameState && gameState.player && gameState.player.isActive) {
                        const playerPos = gameState.player.getPosition();
                        if (playerPos) {
                            const distanceToPlayer = Math.sqrt(
                                Math.pow(projectile.position.x - playerPos.x, 2) +
                                Math.pow(projectile.position.z - playerPos.z, 2)
                            );
                            
                            // If hit player
                            if (distanceToPlayer < 1) {
                                gameState.player.takeDamage(damage, fruit.type);
                                this._createHitEffect(playerPos, fruit.type);
                                
                                // Remove projectile
                                this.engine.renderer.scene.remove(projectile);
                                projectile.geometry.dispose();
                                projectile.material.dispose();
                                return;
                            }
                        }
                    }
                    
                    // Continue animation if not hit and not completed
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        // Remove projectile when animation is complete
                        this.engine.renderer.scene.remove(projectile);
                        projectile.geometry.dispose();
                        projectile.material.dispose();
                    }
                };
                
                // Start animation
                animate();
            }, i * 200); // Stagger launch times
        }
    }
    
    /**
     * Create a burst pattern of fruit projectiles
     */
    _createBurstAttack(sourcePos, targetPos, fruit) {
        const fruitColor = this._getFruitColor(fruit.type);
        const fruitData = fruitStore.getFruit(fruit.name);
        const damage = fruitData.damageValues['Basic Attack'];
        
        // Create a burst of projectiles that spread outward
        const burstCount = 12;
        
        // Create a single large projectile that then bursts
        const mainGeometry = new THREE.SphereGeometry(0.6, 10, 10);
        const mainMaterial = new THREE.MeshBasicMaterial({ 
            color: fruitColor,
            transparent: true,
            opacity: 0.9
        });
        
        const mainProjectile = new THREE.Mesh(mainGeometry, mainMaterial);
        mainProjectile.position.set(sourcePos.x, sourcePos.y + 1.5, sourcePos.z);
        
        // Add to scene
        this.engine.renderer.scene.add(mainProjectile);
        
        // Create direction to player
        const direction = new THREE.Vector3(
            targetPos.x - sourcePos.x,
            0,
            targetPos.z - sourcePos.z
        ).normalize();
        
        // Create trail effect for main projectile
        this._createFruitTrail(mainProjectile, fruitColor);
        
        // Animate main projectile
        const startTime = Date.now();
        // Calculate distance manually instead of using targetPos.distanceTo
        // const distance = Math.sqrt(
        //     Math.pow(targetPos.x - sourcePos.x, 2) + 
        //     Math.pow(targetPos.z - sourcePos.z, 2)
        // );
        // const travelDistance = Math.min(10, distance * 0.7);
        const duration = 800; // ms - time to reach burst point
        const speed = 10; // units per second
        
        // Create the burst animation
        const animateMain = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Move main projectile
            mainProjectile.position.x += direction.x * speed * (this.engine.time.deltaTime || 0.016);
            mainProjectile.position.z += direction.z * speed * (this.engine.time.deltaTime || 0.016);
            
            // Slightly grow the projectile
            mainProjectile.scale.set(1 + progress * 0.5, 1 + progress * 0.5, 1 + progress * 0.5);
            
            // If reached burst point or hit player
            if (progress >= 1) {
                // Create burst of smaller projectiles
                this._createBurstProjectiles(mainProjectile.position.clone(), burstCount, fruitColor, damage, fruit.type);
                
                // Remove main projectile
                this.engine.renderer.scene.remove(mainProjectile);
                mainProjectile.geometry.dispose();
                mainProjectile.material.dispose();
                return;
            }
            
            // Check if hit player before burst point
            const gameState = this.engine.stateManager.getCurrentState();
            if (gameState && gameState.player && gameState.player.isActive) {
                const playerPos = gameState.player.getPosition();
                if (playerPos) {
                    const distanceToPlayer = Math.sqrt(
                        Math.pow(mainProjectile.position.x - playerPos.x, 2) +
                        Math.pow(mainProjectile.position.z - playerPos.z, 2)
                    );
                    
                    // If hit player
                    if (distanceToPlayer < 1) {
                        // Create burst at player position
                        this._createBurstProjectiles(mainProjectile.position.clone(), burstCount, fruitColor, damage, fruit.type);
                        
                        // Deal direct damage
                        gameState.player.takeDamage(damage * 1.5, fruit.type);
                        this._createHitEffect(playerPos, fruit.type);
                        
                        // Remove main projectile
                        this.engine.renderer.scene.remove(mainProjectile);
                        mainProjectile.geometry.dispose();
                        mainProjectile.material.dispose();
                        return;
                    }
                }
            }
            
            // Continue animation
            requestAnimationFrame(animateMain);
        };
        
        // Start main animation
        animateMain();
    }
    
    /**
     * Create burst projectiles from a central point
     */
    _createBurstProjectiles(position, count, color, damage, fruitType) {
        for (let i = 0; i < count; i++) {
            // Calculate angle and direction for evenly distributed burst
            const angle = (i / count) * Math.PI * 2;
            const direction = new THREE.Vector3(
                Math.cos(angle),
                0,
                Math.sin(angle)
            ).normalize();
            
            // Create projectile
            const geometry = new THREE.SphereGeometry(0.3, 6, 6);
            const material = new THREE.MeshBasicMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.9
            });
            
            const projectile = new THREE.Mesh(geometry, material);
            projectile.position.copy(position);
            
            // Add to scene
            this.engine.renderer.scene.add(projectile);
            
            // Create trail effect
            this._createFruitTrail(projectile, color);
            
            // Animate projectile
            const startTime = Date.now();
            const duration = 1000; // ms
            const speed = 8; // units per second
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;
                
                // Move projectile
                projectile.position.x += direction.x * speed * (this.engine.time.deltaTime || 0.016);
                projectile.position.z += direction.z * speed * (this.engine.time.deltaTime || 0.016);
                
                // Check if hit player
                const gameState = this.engine.stateManager.getCurrentState();
                if (gameState && gameState.player && gameState.player.isActive) {
                    const playerPos = gameState.player.getPosition();
                    if (playerPos) {
                        const distanceToPlayer = Math.sqrt(
                            Math.pow(projectile.position.x - playerPos.x, 2) +
                            Math.pow(projectile.position.z - playerPos.z, 2)
                        );
                        
                        // If hit player
                        if (distanceToPlayer < 1) {
                            gameState.player.takeDamage(damage * 0.5, fruitType); // Less damage for burst particles
                            this._createHitEffect(playerPos, fruitType);
                            
                            // Remove projectile
                            this.engine.renderer.scene.remove(projectile);
                            projectile.geometry.dispose();
                            projectile.material.dispose();
                            return;
                        }
                    }
                }
                
                // Continue animation if not hit and not completed
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Remove projectile when animation is complete
                    this.engine.renderer.scene.remove(projectile);
                    projectile.geometry.dispose();
                    projectile.material.dispose();
                }
            };
            
            // Start animation
            animate();
        }
    }
    
    /**
     * Create a trail effect for a fruit projectile
     */
    _createFruitTrail(projectile, color) {
        // Setup trail particles
        const createTrailParticle = () => {
            if (!projectile || !this.engine.renderer.scene) return;
            
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 5, 5),
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
            const duration = 400; // ms
            
            const animateParticle = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                particle.material.opacity = 0.7 * (1 - progress);
                particle.scale.multiplyScalar(0.97);
                
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
        
        // Create particles every 80ms
        const trailInterval = setInterval(() => {
            if (!projectile.parent) {
                clearInterval(trailInterval);
                return;
            }
            createTrailParticle();
        }, 80);
        
        // Clear interval after 2.5 seconds (safety)
        setTimeout(() => clearInterval(trailInterval), 2500);
    }
    
    /**
     * Create a hit effect when a fruit projectile hits player
     */
    _createHitEffect(position, fruitType) {
        const color = this._getFruitColor(fruitType);
        
        // Create explosion effect
        const particles = [];
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            // Random position around hit point
            particle.position.set(
                position.x + (Math.random() - 0.5) * 0.4,
                position.y + 1 + (Math.random() - 0.5) * 0.4,
                position.z + (Math.random() - 0.5) * 0.4
            );
            
            // Random velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.07 + Math.random() * 0.15;
            particle.userData = {
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: 0.07 + Math.random() * 0.15,
                    z: Math.sin(angle) * speed
                }
            };
            
            // Add to scene
            this.engine.renderer.scene.add(particle);
            particles.push(particle);
        }
        
        // Animate particles
        const startTime = Date.now();
        const duration = 1000; // ms
        
        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            particles.forEach(particle => {
                // Move particle
                particle.position.x += particle.userData.velocity.x;
                particle.position.y += particle.userData.velocity.y;
                particle.position.z += particle.userData.velocity.z;
                
                // Apply gravity
                particle.userData.velocity.y -= 0.005;
                
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
     * Update special ability behavior
     */
    _updateSpecial(deltaTime) {
        // Check if player is solving math problem
        const gameState = this.engine.stateManager.getCurrentState();
        if (gameState && gameState.player && gameState.player.mathChallengeActive) {
            return; // Pause special attack if player is solving math
        }
        
        // Execute a special attack
        // For now, just transition back to chase after a brief pause
        this.attackCooldown = this.attackCooldownTime * 1.5; // Longer cooldown after special
        this.currentState = 'chase';
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
    takeDamage(amount, damageType) {
        // Log the damage with type
        console.log(`Boss ${this.name} taking ${amount.toFixed(1)} damage of type: ${damageType || 'default'}`);
        
        const oldHealth = this.health;
        this.health -= amount;
        
        console.log(`Boss ${this.name} Health: ${oldHealth.toFixed(1)} -> ${this.health.toFixed(1)} (damage: ${amount.toFixed(1)})`);
        
        // Show hit effect (flash red)
        this._showHitEffect(damageType);
        
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
    _showHitEffect(damageType) {
        console.log(`BOSS HIT EFFECT: ${this.name} (${damageType || 'default'})`);
        
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
        this._playBossDeathEffect();
        
        // Remove after a delay
        setTimeout(() => {
            this.destroy();
            
            // Notify the GameplayState that the boss has been defeated
            const gameState = this.engine.stateManager.getCurrentState();
            if (gameState && typeof gameState.onBossDefeated === 'function') {
                gameState.onBossDefeated();
            }
        }, 2000); // Longer delay for boss death animation
    }
    
    /**
     * Play dramatic boss death effect
     */
    _playBossDeathEffect() {
        // Boss death explosion effect
        const explosionRadius = 3;
        const explosionParticles = 30;
        const explosionDuration = 1500; // ms
        
        // Create explosion particles
        const particles = [];
        const colors = [0xff0000, 0xff5500, 0xffaa00, 0xffff00]; // Fire colors
        
        for (let i = 0; i < explosionParticles; i++) {
            // Create particle
            const geometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 8);
            const colorIndex = Math.floor(Math.random() * colors.length);
            const material = new THREE.MeshBasicMaterial({
                color: colors[colorIndex],
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Random position around boss
            const bossPos = this.getPosition();
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.5;
            
            particle.position.set(
                bossPos.x + Math.cos(angle) * radius,
                bossPos.y + 1 + Math.random() * 2,
                bossPos.z + Math.sin(angle) * radius
            );
            
            // Random velocity
            const velocity = {
                x: (Math.random() - 0.5) * 5,
                y: Math.random() * 5,
                z: (Math.random() - 0.5) * 5
            };
            
            // Add particle to scene
            this.engine.renderer.scene.add(particle);
            particles.push({ mesh: particle, velocity });
        }
        
        // Make boss model fade out
        this.object3D.traverse((object) => {
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => {
                        mat.transparent = true;
                    });
                } else {
                    object.material.transparent = true;
                }
            }
        });
        
        // Animate explosion
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / explosionDuration, 1);
            
            // Update particle positions
            particles.forEach(particle => {
                particle.mesh.position.x += particle.velocity.x * 0.02;
                particle.mesh.position.y += particle.velocity.y * 0.02;
                particle.mesh.position.z += particle.velocity.z * 0.02;
                
                // Reduce opacity over time
                if (particle.mesh.material) {
                    particle.mesh.material.opacity = 0.8 * (1 - progress);
                    
                    // Also scale the particle up a bit
                    const scale = 1 + progress;
                    particle.mesh.scale.set(scale, scale, scale);
                }
            });
            
            // Fade out boss model
            this.object3D.traverse((object) => {
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => {
                            mat.opacity = 1 - progress;
                        });
                    } else {
                        object.material.opacity = 1 - progress;
                    }
                }
            });
            
            // Continue animation until complete
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Clean up particles
                particles.forEach(particle => {
                    if (particle.mesh.geometry) particle.mesh.geometry.dispose();
                    if (particle.mesh.material) particle.mesh.material.dispose();
                    this.engine.renderer.scene.remove(particle.mesh);
                });
            }
        };
        
        // Start animation
        animate();
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
        // If the player is within attack range, start tracking time
        if (distance <= this.attackRange * 1.2) {
            // Switch to chase mode if not already chasing or attacking
            if (this.currentState !== 'chase' && this.currentState !== 'attack' && this.currentState !== 'special') {
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
        if (!this.bossSprite) return;
        
        // If moving left (negative X direction)
        if (dirX < 0 && this.facingDirection !== -1) {
            // Flip the sprite by making scale.x negative
            this.bossSprite.scale.x = -Math.abs(this.bossSprite.scale.x);
            this.facingDirection = -1;
        } 
        // If moving right (positive X direction)
        else if (dirX > 0 && this.facingDirection !== 1) {
            // Reset to normal by making scale.x positive
            this.bossSprite.scale.x = Math.abs(this.bossSprite.scale.x);
            this.facingDirection = 1;
        }
    }
    
    /**
     * Create attack effect at target position
     */
    _createAttackEffect(position) {
        // Reuse the hit effect function with a default type (regular attack)
        this._createHitEffect(position, 'default');
    }
}