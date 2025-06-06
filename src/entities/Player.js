/**
 * Player entity class
 */
import { Entity } from './Entity.js';
import * as THREE from 'three';
import { FlameFruit } from '../powers/FlameFruit.js';
import { IceFruit } from '../powers/IceFruit.js';
import { BombFruit } from '../powers/BombFruit.js';
import { LightFruit } from '../powers/LightFruit.js';
import { MagmaFruit } from '../powers/MagmaFruit.js';
import fruitStore from '../lib/FruitStore.js';

export class Player extends Entity {
    constructor(engine, options = {}) {
        super(engine);
        
        this.name = options.name || 'Efrain';
        this.health = options.health || 100;
        this.maxHealth = options.maxHealth || 100;
        this.speed = options.speed || 5;
        this.jumpPower = options.jumpPower || 10;
        
        // Initialize fruit powers from config objects
        this.fruits = this._initializeFruits(options.fruits || []);
        this.activeFruitIndex = 0;
        
        // Create 3D representation
        this.object3D = this._createPlayerModel();
        
        // Flag to check if player is moving
        this.isMoving = false;
        
        // Current velocity
        this.velocity = { x: 0, y: 0, z: 0 };
        
        // Attack cooldowns
        this.attackCooldown = 0;
        this.attackCooldownTime = 0.5; // seconds
        
        // Math challenge system
        this.mathChallengeActive = false;
        this.mathChallengeUI = null;
        this.currentMathProblem = null;
        this.mathRewardAmount = 3; // Default number of uses added on success
        
        // Danger sign system
        this.dangerSignElement = null;
        this.isInDanger = false;
        
        // Damage timer system
        this.damageTimer = 0;
        this.damageThreshold = 2; // Seconds in enemy range before taking damage
        this.inEnemyRange = false;
        
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
        
        // Update UI when active fruit changes
        this._setupKeyboardControls();
        
        // Initialize fruit UI with use counters
        setTimeout(() => {
            this._updateFruitUI();
        }, 500); // Short delay to ensure UI elements are created
        
        // Create the danger sign element
        this._createDangerSignUI();
    }
    
    /**
     * Set up keyboard controls for player
     */
    _setupKeyboardControls() {
        // Update UI when fruit is switched with number keys
        document.addEventListener('keydown', (event) => {
            // Check for number keys 1-5
            if (event.code.startsWith('Digit') && event.code !== 'Digit0') {
                // Get the digit
                const digit = parseInt(event.code.substring(5));
                
                // Check if we have this fruit
                if (digit > 0 && digit <= this.fruits.length) {
                    // Switch fruit
                    this.activeFruitIndex = digit - 1;
                    
                    // Update UI
                    this._updateFruitUI();
                }
            }
        });
    }
    
    /**
     * Update UI to reflect current active fruit
     */
    _updateFruitUI() {
        console.log(`UPDATING FRUIT UI - Active fruit: ${this.activeFruitIndex}`);
        
        // Find all fruit power items
        const fruitItems = document.querySelectorAll('.fruit-power-item');
        
        // Remove active class from all
        fruitItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current
        const activeItem = document.querySelector(`.fruit-power-item[data-fruit-index="${this.activeFruitIndex}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Update uses count for all fruits
        fruitItems.forEach((item, index) => {
            if (index < this.fruits.length) {
                const fruit = this.fruits[index];
                
                // Create or update uses counter
                let usesCounter = item.querySelector('.fruit-uses-counter');
                if (!usesCounter) {
                    usesCounter = document.createElement('div');
                    usesCounter.className = 'fruit-uses-counter';
                    item.appendChild(usesCounter);
                    console.log(`Created new counter for fruit ${index+1}`);
                }
                
                // Update counter text
                usesCounter.textContent = fruit.usesRemaining;
                
                // Add warning style if no uses left
                if (fruit.usesRemaining <= 0) {
                    usesCounter.classList.add('no-uses');
                } else {
                    usesCounter.classList.remove('no-uses');
                }
            }
        });
        
        // Add style for the counter if it doesn't exist yet
        if (!document.querySelector('#fruit-uses-style')) {
            const style = document.createElement('style');
            style.id = 'fruit-uses-style';
            style.textContent = `
                .fruit-uses-counter {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background-color: #4caf50;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    z-index: 100;
                }
                
                .fruit-uses-counter.no-uses {
                    background-color: #f44336;
                }
                
                .fruit-power-item {
                    position: relative;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Initialize fruit power classes from config objects
     */
    _initializeFruits(fruitConfigs) {
        const initializedFruits = [];
        
        for (const fruitConfig of fruitConfigs) {
            let fruit;
            
            // Create the appropriate fruit class based on type
            switch (fruitConfig.type) {
                case 'flame':
                    fruit = new FlameFruit(this.engine, fruitConfig);
                    break;
                case 'ice':
                    fruit = new IceFruit(this.engine, fruitConfig);
                    break;
                case 'bomb':
                    fruit = new BombFruit(this.engine, fruitConfig);
                    break;
                case 'light':
                    fruit = new LightFruit(this.engine, fruitConfig);
                    break;
                case 'magma':
                    fruit = new MagmaFruit(this.engine, fruitConfig);
                    break;
                default:
                    console.warn(`Unknown fruit type: ${fruitConfig.type}`);
                    continue;
            }
            
            initializedFruits.push(fruit);
        }
        
        return initializedFruits;
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
            playerSprite.scale.set(4, 4, 1); // Adjust size
            playerSprite.position.y = 2;   // Place at correct height
            playerGroup.add(playerSprite);
            
            // Store reference to sprite for flipping
            this.playerSprite = playerSprite;
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
        // Update player movement
        this._updateMovement(deltaTime);
        
        // Update animations
        this._updateAnimations(deltaTime);
        
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // Update damage timer if in enemy range
        if (this.inEnemyRange) {
            this.damageTimer += deltaTime;
            
            // Apply automatic damage if timer exceeds threshold
            if (this.damageTimer >= this.damageThreshold) {
                console.log(`Player has been in danger zone for ${this.damageThreshold}s - applying automatic damage`);
                
                // Get the current game state
                const gameState = this.engine.stateManager.getCurrentState();
                let damageAmount = 10; // Default damage amount
                
                // Try to get the enemy/boss that's causing this damage
                if (gameState && gameState.enemies) {
                    // Find the closest enemy/boss in range to determine damage amount
                    const playerPos = this.getPosition();
                    let closestEnemy = null;
                    let closestDistance = Infinity;
                    
                    // Check regular enemies
                    gameState.enemies.forEach(enemy => {
                        if (!enemy || !enemy.isActive) return;
                        
                        const enemyPos = enemy.getPosition();
                        if (!enemyPos) return;
                        
                        const distance = Math.sqrt(
                            Math.pow(playerPos.x - enemyPos.x, 2) + 
                            Math.pow(playerPos.z - enemyPos.z, 2)
                        );
                        
                        if (distance <= enemy.attackRange && distance < closestDistance) {
                            closestEnemy = enemy;
                            closestDistance = distance;
                        }
                    });
                    
                    // Check miniboss (with higher priority)
                    if (gameState.boss && gameState.boss.isActive) {
                        const bossPos = gameState.boss.getPosition();
                        if (bossPos) {
                            const distance = Math.sqrt(
                                Math.pow(playerPos.x - bossPos.x, 2) + 
                                Math.pow(playerPos.z - bossPos.z, 2)
                            );
                            
                            if (distance <= gameState.boss.attackRange && 
                                (distance < closestDistance || Math.random() < 0.7)) { // Boss has priority
                                closestEnemy = gameState.boss;
                                closestDistance = distance;
                            }
                        }
                    }
                    
                    // Use the attack power of the closest enemy if found
                    if (closestEnemy) {
                        damageAmount = closestEnemy.attackPower * 0.7; // Reduced damage for passive effect
                    }
                }
                
                // Apply the damage
                this.takeDamage(damageAmount);
            }
        } else {
            // Reset damage timer if not in enemy range
            this.damageTimer = 0;
        }
        
        // Check for fruit uses from math challenges (key "M")
        if (this.engine.input.isKeyPressed('KeyM') && !this.mathChallengeActive) {
            this._startMathChallenge();
        }
        
        // Get the selected fruit index from the gameplay state if available
        const gameplayState = this.engine.stateManager.getCurrentStateInstance();
        if (gameplayState && typeof gameplayState.selectedFruitIndex !== 'undefined') {
            this.activeFruitIndex = gameplayState.selectedFruitIndex;
        }
    }
    
    /**
     * Update player movement based on input
     */
    _updateMovement(deltaTime) {
        const input = this.engine.input;
        const speed = this.speed * deltaTime;
        
        // Check if math challenge is active - don't process movement if it is
        if (this.mathChallengeActive) {
            return;
        }
        
        // Get movement direction
        let moveX = 0;
        let moveZ = 0;
        
        // Map WASD/Arrow keys to isometric directions
        // W/Up -> Top-left in isometric view
        if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) {
            moveX -= speed;
            moveZ -= speed;
        }
        
        // S/Down -> Bottom-right in isometric view
        if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) {
            moveX += speed;
            moveZ += speed;
        }
        
        // A/Left -> Bottom-left in isometric view
        if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) {
            moveX -= speed;
            moveZ += speed;
        }
        
        // D/Right -> Top-right in isometric view
        if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) {
            moveX += speed;
            moveZ -= speed;
        }
        
        // Update moving state
        this.isMoving = (moveX !== 0 || moveZ !== 0);
        
        // Apply movement directly to match isometric view
        if (this.isMoving) {
            // Apply movement
            this.object3D.position.x += moveX;
            this.object3D.position.z += moveZ;
            
            // Rotate player to face movement direction
            const angle = Math.atan2(moveX, moveZ);
            
            // For sprite-based character, just store the facing angle
            if (this.object3D.children.length > 0 && this.object3D.children[0] instanceof THREE.Sprite) {
                this.object3D.userData.facingAngle = angle;
                
                // Update sprite flipping based on movement direction
                this._updateSpriteDirection(moveX);
            } else {
                // For 3D model, rotate the player
                this.object3D.rotation.y = angle;
            }
            
            // Check for proximity to villains and bosses
            this._checkProximityToEnemies();
        }
        
        // Handle fruit switching with number keys
        if (input.isKeyPressed('Digit1') && this.fruits.length >= 1) {
            this.activeFruitIndex = 0;
            this._updateFruitUI();
        } else if (input.isKeyPressed('Digit2') && this.fruits.length >= 2) {
            this.activeFruitIndex = 1;
            this._updateFruitUI();
        } else if (input.isKeyPressed('Digit3') && this.fruits.length >= 3) {
            this.activeFruitIndex = 2;
            this._updateFruitUI();
        } else if (input.isKeyPressed('Digit4') && this.fruits.length >= 4) {
            this.activeFruitIndex = 3;
            this._updateFruitUI();
        } else if (input.isKeyPressed('Digit5') && this.fruits.length >= 5) {
            this.activeFruitIndex = 4;
            this._updateFruitUI();
        }
        
        // Handle basic attack with space
        if (input.isKeyPressed('Space')) {
            this._useBasicAttack();
        }
        
        // Handle special attack with shift
        if (input.isKeyPressed('ShiftLeft') || input.isKeyPressed('ShiftRight')) {
            this._useSpecialAttack();
        }
        
        // Keep player within island bounds
        const distanceFromCenter = Math.sqrt(
            this.object3D.position.x * this.object3D.position.x + 
            this.object3D.position.z * this.object3D.position.z
        );
        
        if (distanceFromCenter > 45) { // Increased from 29 to 45 for a larger playing area
            // Player is too close to edge, push back
            const angle = Math.atan2(this.object3D.position.x, this.object3D.position.z);
            this.object3D.position.x = Math.sin(angle) * 45;
            this.object3D.position.z = Math.cos(angle) * 45;
        }
    }
    
    /**
     * Update sprite direction based on movement
     * @param {number} moveX - X direction of movement (negative = left, positive = right)
     */
    _updateSpriteDirection(moveX) {
        // Only flip the sprite if we have a sprite reference
        if (!this.playerSprite) return;
        
        // If moving left (negative X direction)
        if (moveX < 0 && this.facingDirection !== -1) {
            // Flip the sprite by making scale.x negative
            this.playerSprite.scale.x = -Math.abs(this.playerSprite.scale.x);
            this.facingDirection = -1;
        } 
        // If moving right (positive X direction)
        else if (moveX > 0 && this.facingDirection !== 1) {
            // Reset to normal by making scale.x positive
            this.playerSprite.scale.x = Math.abs(this.playerSprite.scale.x);
            this.facingDirection = 1;
        }
    }
    
    /**
     * Use basic attack with current fruit
     */
    _useBasicAttack() {
        // Check cooldown
        if (this.attackCooldown > 0) {
            console.log(`Attack on cooldown: ${this.attackCooldown.toFixed(2)}s remaining`);
            return;
        }
        
        // Get active fruit
        const fruit = this.getActiveFruit();
        if (!fruit) {
            console.log("No active fruit found!");
            return;
        }
        
        // Check if fruit has uses remaining
        if (fruit.usesRemaining <= 0) {
            console.log(`No uses remaining for ${fruit.name}`);
            return;
        }
        
        // Get player position and direction
        const position = this.getPosition();
        
        // Calculate attack direction based on player orientation
        let direction = new THREE.Vector3(0, 0, -1); // Default: forward
        
        // Get facing angle from either the sprite or the 3D model
        let facingAngle = 0;
        if (this.object3D.userData.facingAngle !== undefined) {
            facingAngle = this.object3D.userData.facingAngle;
        } else {
            facingAngle = this.object3D.rotation.y;
        }
        
        // We don't need to apply rotation since we're not using directional attacks
        
        // Position the attack at the player's position
        const attackStartPosition = new THREE.Vector3(
            position.x,
            position.y + 1.0, // At approximately player's "hand" height
            position.z
        );
        
        // Set the attack range (area around player)
        const attackRange = 8; 
        
        // Set cooldown
        this.attackCooldown = this.attackCooldownTime;
        
        // Use fruit's basic attack without direction (passing null for direction)
        const attackResult = fruit.useBasicAttack(attackStartPosition, null);
        
        // Check if attack was successful
        if (attackResult) {
            // Get game state and check for direct hits on the closest enemy
            const gameState = this.engine.stateManager.getCurrentState();
            if (gameState && gameState.checkDirectAttackHits) {
                gameState.checkDirectAttackHits(attackStartPosition, attackRange, fruit.power, fruit.type);
            }
            
            // Create visual feedback for attack
            this._createAttackEffect(attackStartPosition, direction, fruit.type);
        }
        
        // Update UI to reflect updated uses count
        this._updateFruitUI();
        
        return attackResult;
    }
    
    /**
     * Use special attack with current fruit
     */
    _useSpecialAttack() {
        // Check cooldown
        if (this.attackCooldown > 0) {
            console.log(`Attack on cooldown: ${this.attackCooldown.toFixed(2)}s remaining`);
            return;
        }
        
        // Get active fruit
        const fruit = this.getActiveFruit();
        if (!fruit) {
            console.log("No active fruit found!");
            return;
        }
        
        // Check if fruit has uses remaining
        if (fruit.usesRemaining <= 0) {
            console.log(`No uses remaining for ${fruit.name}`);
            return;
        }
        
        // Check if the special attack is on cooldown
        if (fruit.isOnCooldown('special')) {
            console.log(`Special attack for ${fruit.name} is on cooldown`);
            return;
        }
        
        // Get player position and direction
        const position = this.getPosition();
        
        // Calculate attack direction based on player orientation
        let direction = new THREE.Vector3(0, 0, -1); // Default: forward
        
        // Get facing angle from either the sprite or the 3D model
        let facingAngle = 0;
        if (this.object3D.userData.facingAngle !== undefined) {
            facingAngle = this.object3D.userData.facingAngle;
        } else {
            facingAngle = this.object3D.rotation.y;
        }
        
        // Apply rotation to direction vector
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), facingAngle);
        
        // Position the attack start point slightly in front of the player
        const attackStartPosition = new THREE.Vector3(
            position.x + direction.x * 1.5,
            position.y + 1.0, // At approximately player's "hand" height
            position.z + direction.z * 1.5
        );
        
        // Special attack has longer range than basic attack
        const attackRange = 12; 
        
        // Set cooldown
        this.attackCooldown = this.attackCooldownTime;
        
        // Use fruit's special attack
        const attackResult = fruit.useSpecialAttack(attackStartPosition, direction);
        
        // Check if attack was successful
        if (attackResult) {
            // Get game state and check for direct hits on the closest enemy
            const gameState = this.engine.stateManager.getCurrentState();
            if (gameState && gameState.checkDirectAttackHits) {
                gameState.checkDirectAttackHits(attackStartPosition, attackRange, fruit.power * 1.5, fruit.type);
            }
            
            // Create visual feedback for special attack
            this._createSpecialAttackEffect(attackStartPosition, direction, fruit.type);
        }
        
        // Update UI to reflect updated uses count
        this._updateFruitUI();
        
        return attackResult;
    }
    
    /**
     * Create visual effect for basic attack
     */
    _createAttackEffect(position, direction, fruitType) {
        // Get the color associated with the fruit type
        const color = this._getFruitColor(fruitType);
        
        // Create a basic attack effect sphere
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        // Create the attack effect mesh
        const attackEffect = new THREE.Mesh(geometry, material);
        attackEffect.position.copy(position);
        
        // Add to scene
        this.engine.renderer.scene.add(attackEffect);
        
        // Create a shockwave effect
        const ringGeometry = new THREE.RingGeometry(0.1, 0.7, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true, 
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Make it horizontal
        ring.position.copy(position);
        
        // Add ring to scene
        this.engine.renderer.scene.add(ring);
        
        // Animate both effects
        const startTime = Date.now();
        const duration = 400; // ms
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Scale effect
            attackEffect.scale.set(1 + progress * 3, 1 + progress * 3, 1 + progress * 3);
            attackEffect.material.opacity = 0.8 * (1 - progress);
            
            // Scale ring
            ring.scale.set(1 + progress * 4, 1 + progress * 4, 1);
            ring.material.opacity = 0.7 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove effects when animation is complete
                this.engine.renderer.scene.remove(attackEffect);
                attackEffect.geometry.dispose();
                attackEffect.material.dispose();
                
                this.engine.renderer.scene.remove(ring);
                ring.geometry.dispose();
                ring.material.dispose();
            }
        };
        
        // Start animation
        animate();
        
        // Add particles for more visual impact
        this._createAttackParticles(position, color);
    }
    
    /**
     * Create visual effect for special attack
     */
    _createSpecialAttackEffect(position, direction, fruitType) {
        // Get the color associated with the fruit type
        const color = this._getFruitColor(fruitType);
        
        // Create projectile (similar to enemy fruit projectile)
        const geometry = new THREE.SphereGeometry(0.4, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.9
        });
        
        const projectile = new THREE.Mesh(geometry, material);
        projectile.position.copy(position);
        
        // Add to scene
        this.engine.renderer.scene.add(projectile);
        
        // Calculate target position (further in attack direction)
        const targetPos = new THREE.Vector3(
            position.x + direction.x * 15,
            position.y,
            position.z + direction.z * 15
        );
        
        // Animation variables
        const startTime = Date.now();
        const duration = 1000; // ms
        const speed = 15; // units per second
        
        // Create trail effect
        this._createProjectileTrail(projectile, color);
        
        // Animate projectile
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            // Move projectile
            projectile.position.x += direction.x * speed * (this.engine.time.deltaTime || 0.016);
            projectile.position.y += direction.y * speed * (this.engine.time.deltaTime || 0.016);
            projectile.position.z += direction.z * speed * (this.engine.time.deltaTime || 0.016);
            
            // Check if animation should end
            if (progress >= 1) {
                // Create impact effect at final position
                this._createImpactEffect(projectile.position, color);
                
                // Remove projectile
                this.engine.renderer.scene.remove(projectile);
                projectile.geometry.dispose();
                projectile.material.dispose();
                return;
            }
            
            // Continue animation
            requestAnimationFrame(animate);
        };
        
        // Start animation
        animate();
    }
    
    /**
     * Create particles for attack effect
     */
    _createAttackParticles(position, color) {
        const particles = [];
        const particleCount = 12;
        
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
                position.x + (Math.random() - 0.5) * 0.5,
                position.y + (Math.random() - 0.5) * 0.5,
                position.z + (Math.random() - 0.5) * 0.5
            );
            
            // Random velocity in all directions
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI - Math.PI/2;
            const speed = 0.05 + Math.random() * 0.1;
            
            particle.userData = {
                velocity: {
                    x: Math.cos(angle) * Math.cos(elevation) * speed,
                    y: Math.sin(elevation) * speed,
                    z: Math.sin(angle) * Math.cos(elevation) * speed
                }
            };
            
            // Add to scene
            this.engine.renderer.scene.add(particle);
            particles.push(particle);
        }
        
        // Animate particles
        const startTime = Date.now();
        const duration = 600; // ms
        
        const animateParticles = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            particles.forEach(particle => {
                // Move particle
                particle.position.x += particle.userData.velocity.x;
                particle.position.y += particle.userData.velocity.y;
                particle.position.z += particle.userData.velocity.z;
                
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
     * Create a trail effect for the projectile
     */
    _createProjectileTrail(projectile, color) {
        // Create trail at regular intervals
        const trailInterval = setInterval(() => {
            if (!projectile || !this.engine.renderer.scene) {
                clearInterval(trailInterval);
                return;
            }
            
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.6
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
                
                particle.material.opacity = 0.6 * (1 - progress);
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
        }, 50); // Create trail particle every 50ms
        
        // Clear interval after 2 seconds (safety)
        setTimeout(() => clearInterval(trailInterval), 2000);
    }
    
    /**
     * Create impact effect at the end of projectile path
     */
    _createImpactEffect(position, color) {
        // Create explosion particles
        const particles = [];
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            // Position at impact point
            particle.position.copy(position);
            
            // Random velocity in all directions
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI;
            const speed = 0.1 + Math.random() * 0.15;
            
            particle.userData = {
                velocity: {
                    x: Math.cos(angle) * Math.sin(elevation) * speed,
                    y: Math.cos(elevation) * speed,
                    z: Math.sin(angle) * Math.sin(elevation) * speed
                }
            };
            
            // Add to scene
            this.engine.renderer.scene.add(particle);
            particles.push(particle);
        }
        
        // Create shockwave ring
        const ringGeometry = new THREE.RingGeometry(0.2, 0.7, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true, 
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Make it horizontal
        ring.position.copy(position);
        this.engine.renderer.scene.add(ring);
        
        // Animate particles and ring
        const startTime = Date.now();
        const duration = 800; // ms
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Update particles
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
            
            // Scale ring
            ring.scale.set(1 + progress * 5, 1 + progress * 5, 1);
            ring.material.opacity = 0.7 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove particles and ring
                particles.forEach(particle => {
                    this.engine.renderer.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
                
                this.engine.renderer.scene.remove(ring);
                ring.geometry.dispose();
                ring.material.dispose();
            }
        };
        
        animate();
    }
    
    /**
     * Update any animations
     */
    _updateAnimations(deltaTime) {
        // Handle any player animations if needed
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
            
            // Update the gameplay state's selected fruit index
            const gameplayState = this.engine.stateManager.getCurrentStateInstance();
            if (gameplayState && typeof gameplayState.selectFruit === 'function') {
                gameplayState.selectFruit(index);
            }
        }
    }
    
    /**
     * Take damage
     */
    takeDamage(amount) {
        // Only apply damage if damage timer has reached threshold
        if (this.inEnemyRange && this.damageTimer < this.damageThreshold) {
            console.log(`Player in danger zone for ${this.damageTimer.toFixed(1)}s of ${this.damageThreshold}s required`);
            return this.health;
        }
        
        console.log(`Player takes ${amount} damage!`);
        
        // Store original health for logging
        const oldHealth = this.health;
        
        // Apply damage
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        console.log(`Player Health: ${oldHealth.toFixed(1)} -> ${this.health.toFixed(1)} (damage: ${amount.toFixed(1)})`);
        
        // Reset damage timer after damage is applied
        this.damageTimer = 0;
        
        // Create visual hit effect
        this._showHitEffect();
        
        // Update health UI if it exists
        this._updateHealthUI();
        
        // Check for game over if health is depleted
        if (this.health <= 0) {
            console.log("Player health depleted!");
            // Could trigger game over here
            const gameState = this.engine.stateManager.getCurrentState();
            if (gameState && typeof gameState.onPlayerDeath === 'function') {
                gameState.onPlayerDeath();
            }
        }
        
        return this.health;
    }
    
    /**
     * Show a visual effect when the player is hit
     */
    _showHitEffect() {
        // Flash the player red
        if (!this.object3D) return;
        
        // For each object with a material in the player's model
        this.object3D.traverse(child => {
            if (child.material) {
                // Store a reference to the material(s)
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                
                // Process each material
                materials.forEach(material => {
                    if (material.color) {
                        // Make sure userData exists
                        if (!child.userData) child.userData = {};
                        
                        // Store original color if not already stored
                        if (!child.userData.originalColor) {
                            child.userData.originalColor = material.color.clone();
                        }
                        
                        // Set to red
                        material.color.set(0xff0000);
                    }
                });
            }
        });
        
        // Create damage text effect
        const position = this.getPosition();
        if (position) {
            this._createDamageText(position);
        }
        
        // Restore original colors after a delay
        setTimeout(() => {
            this._restoreOriginalColors();
        }, 200);
    }
    
    /**
     * Restore the original colors of player materials
     */
    _restoreOriginalColors() {
        if (!this.object3D) return;
        
        this.object3D.traverse(child => {
            if (child.material && child.userData && child.userData.originalColor) {
                // Get the material(s)
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                
                // Restore original color to each material
                materials.forEach(material => {
                    if (material.color) {
                        material.color.copy(child.userData.originalColor);
                    }
                });
            }
        });
    }
    
    /**
     * Create floating damage text
     */
    _createDamageText(position) {
        // Get the game state
        const gameState = this.engine.stateManager.getCurrentState();
        if (!gameState || typeof gameState._showDamageText !== 'function') return;
        
        // Use the game state's damage text method
        gameState._showDamageText(position, "DAMAGED!", 0xff0000);
    }
    
    /**
     * Update health UI if available
     */
    _updateHealthUI() {
        // Find health UI element using the correct class
        const healthFill = document.querySelector('.health-fill');
        if (healthFill) {
            // Update health bar width
            const healthPercent = this.getHealthPercentage();
            healthFill.style.width = `${healthPercent}%`;
            
            // Change color based on health level
            if (healthPercent < 20) {
                healthFill.style.backgroundColor = '#f44336'; // Red
            } else if (healthPercent < 50) {
                healthFill.style.backgroundColor = '#ff9800'; // Orange
            } else {
                healthFill.style.backgroundColor = '#4caf50'; // Green
            }
        }
        
        // Update player name element to show health text if it exists
        const playerName = document.querySelector('.player-name');
        if (playerName) {
            playerName.textContent = `Efrain: ${Math.ceil(this.health)} / ${this.maxHealth}`;
        }
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
     * Set player position
     */
    setPosition(x, y, z) {
        if (!this.object3D) return;
        
        this.object3D.position.x = x;
        this.object3D.position.y = y;
        this.object3D.position.z = z;
    }
    
    /**
     * Get player position
     */
    getPosition() {
        if (!this.object3D) return null;
        
        return {
            x: this.object3D.position.x,
            y: this.object3D.position.y,
            z: this.object3D.position.z
        };
    }
    
    /**
     * Check if player is near any enemies or bosses
     */
    _checkProximityToEnemies() {
        // Get current game state
        const gameState = this.engine.stateManager.getCurrentState();
        if (!gameState) return;
        
        const playerPos = this.getPosition();
        if (!playerPos) return;

        // Track if player is in danger from any enemy
        let playerInDanger = false;
        // Track if player is in enemy attack range
        let inEnemyRange = false;
        
        // Check proximity to regular enemies
        if (gameState.enemies && Array.isArray(gameState.enemies)) {
            gameState.enemies.forEach(enemy => {
                if (!enemy) return;
                
                const enemyPos = enemy.getPosition();
                if (!enemyPos) return;
                
                const distance = Math.sqrt(
                    Math.pow(playerPos.x - enemyPos.x, 2) + 
                    Math.pow(playerPos.z - enemyPos.z, 2)
                );
                
                // Check when player gets close to a villain
                if (distance <= 5) {
                    // Update enemy's awareness of player
                    if (typeof enemy.onPlayerNearby === 'function') {
                        enemy.onPlayerNearby(distance);
                    }
                    
                    // Show visual indicator of enemy range
                    if (typeof enemy._updateRangeIndicator === 'function') {
                        enemy._updateRangeIndicator();
                    }
                    
                    // Mark player as in danger if very close (based on attack range)
                    if (distance <= enemy.attackRange) {
                        playerInDanger = true;
                        inEnemyRange = true;
                    }
                }
            });
        }
        
        // Check proximity to mini boss (changed from bosses array to single boss)
        if (gameState.boss) {
            const boss = gameState.boss;
            if (boss && boss.isActive) {
                const bossPos = boss.getPosition();
                if (bossPos) {
                    const distance = Math.sqrt(
                        Math.pow(playerPos.x - bossPos.x, 2) + 
                        Math.pow(playerPos.z - bossPos.z, 2)
                    );
                    
                    // Check when player gets close to a boss
                    if (distance <= 5) {
                        // Update boss's awareness of player
                        if (typeof boss.onPlayerNearby === 'function') {
                            boss.onPlayerNearby(distance);
                        }
                        
                        // Show visual indicator of boss range
                        if (typeof boss._updateRangeIndicator === 'function') {
                            boss._updateRangeIndicator();
                        }
                        
                        // Mark player as in danger if very close to boss (based on attack range)
                        if (distance <= boss.attackRange) {
                            playerInDanger = true;
                            inEnemyRange = true;
                        }
                    }
                }
            }
        }
        
        // Update enemy range state
        this.inEnemyRange = inEnemyRange;
        
        // Update danger sign based on proximity and damage timer
        let showDangerSign = playerInDanger;
        
        // Show more urgent danger if timer is close to threshold
        if (inEnemyRange && this.damageTimer > 3) {
            showDangerSign = true;
        }
        
        if (showDangerSign !== this.isInDanger) {
            this.isInDanger = showDangerSign;
            this._updateDangerSign(showDangerSign);
        }
    }
    
    /**
     * Start a math challenge to get more fruit uses
     */
    _startMathChallenge() {
        if (this.mathChallengeActive) return;
        
        // Get the active fruit
        const fruit = this.getActiveFruit();
        if (!fruit) return;
        
        this.mathChallengeActive = true;
        
        // Determine difficulty based on fruit power
        const difficultyLevel = Math.min(Math.floor(fruit.power / 5), 3);
        
        // Generate a math problem based on difficulty
        this.currentMathProblem = this._generateMathProblem(difficultyLevel);
        
        // Create the math challenge UI
        this._createMathChallengeUI();
    }
    
    /**
     * Generate a math problem based on difficulty level
     * 0 = Easy (single digit multiplication)
     * 1 = Medium (double digit by single digit multiplication)
     * 2 = Hard (simple addition and subtraction with larger numbers)
     * 3 = Medium-Hard (combination of operations)
     */
    _generateMathProblem(difficultyLevel) {
        let num1, num2, operation, answer;
        
        switch (difficultyLevel) {
            case 0: // Easy
                num1 = Math.floor(Math.random() * 9) + 1; // 1-9
                num2 = Math.floor(Math.random() * 9) + 1; // 1-9
                operation = "×";
                answer = num1 * num2;
                break;
                
            case 1: // Medium
                num1 = Math.floor(Math.random() * 20) + 10; // 10-29
                num2 = Math.floor(Math.random() * 9) + 1; // 1-9
                operation = "×";
                answer = num1 * num2;
                break;
                
            case 2: // Hard - now using addition/subtraction instead of multiplication
                if (Math.random() < 0.5) {
                    // Addition with larger numbers
                    num1 = Math.floor(Math.random() * 50) + 50; // 50-99
                    num2 = Math.floor(Math.random() * 50) + 50; // 50-99
                    operation = "+";
                    answer = num1 + num2;
                } else {
                    // Subtraction with larger numbers (ensure positive result)
                    num1 = Math.floor(Math.random() * 50) + 50; // 50-99
                    num2 = Math.floor(Math.random() * 40) + 10; // 10-49
                    operation = "-";
                    answer = num1 - num2;
                }
                break;
                
            case 3: // Medium-Hard - combination of operations
                // Random choice between addition, subtraction, or simple multiplication
                const opChoice = Math.floor(Math.random() * 3);
                
                if (opChoice === 0) {
                    // Addition with larger numbers
                    num1 = Math.floor(Math.random() * 50) + 50; // 50-99
                    num2 = Math.floor(Math.random() * 50) + 50; // 50-99
                    operation = "+";
                    answer = num1 + num2;
                } else if (opChoice === 1) {
                    // Subtraction with larger numbers
                    num1 = Math.floor(Math.random() * 70) + 30; // 30-99
                    num2 = Math.floor(Math.random() * 29) + 1; // 1-29
                    operation = "-";
                    answer = num1 - num2;
                } else {
                    // Simple multiplication (1-digit by 1-digit)
                    num1 = Math.floor(Math.random() * 9) + 1; // 1-9
                    num2 = Math.floor(Math.random() * 9) + 1; // 1-9
                    operation = "×";
                    answer = num1 * num2;
                }
                break;
                
            default: // Default to easy
                num1 = Math.floor(Math.random() * 9) + 1;
                num2 = Math.floor(Math.random() * 9) + 1;
                operation = "×";
                answer = num1 * num2;
        }
        
        return {
            num1,
            num2,
            operation,
            answer,
            difficultyLevel
        };
    }
    
    /**
     * Create UI for the math challenge
     */
    _createMathChallengeUI() {
        // Get the UI container
        const uiContainer = document.getElementById('ui-container');
        if (!uiContainer) return;
        
        // Get the active fruit
        const fruit = this.getActiveFruit();
        if (!fruit) return;
        
        // Create the challenge UI
        this.mathChallengeUI = document.createElement('div');
        this.mathChallengeUI.className = 'math-challenge-ui';
        
        const problem = this.currentMathProblem;
        
        // Create HTML content
        this.mathChallengeUI.innerHTML = `
            <div class="math-challenge-container">
                <div class="math-challenge-header">
                    <h2>Math Challenge</h2>
                    <p>Solve to get <span class="reward-amount">${this.mathRewardAmount}</span> more ${fruit.name} uses!</p>
                </div>
                <div class="math-problem">
                    <span class="math-number">${problem.num1}</span>
                    <span class="math-operation">${problem.operation}</span>
                    <span class="math-number">${problem.num2}</span>
                    <span class="math-equals">=</span>
                    <input type="text" inputmode="numeric" pattern="[0-9]*" class="math-answer" placeholder="?">
                </div>
                <div class="math-controls">
                    <button class="math-submit">Submit</button>
                    <button class="math-cancel">Cancel</button>
                </div>
                <div class="math-result"></div>
            </div>
        `;
        
        // Add styling
        const style = document.createElement('style');
        style.textContent = `
            .math-challenge-ui {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 100;
                pointer-events: auto;
                animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .math-challenge-container {
                background: linear-gradient(to bottom, #ffffff, #f5f5f5);
                border-radius: 15px;
                padding: 25px;
                width: 450px;
                text-align: center;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.4s ease-out;
                border: 1px solid #e0e0e0;
            }
            
            .math-challenge-header {
                position: relative;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #f0f0f0;
            }
            
            .reward-amount {
                font-weight: bold;
                color: #4caf50;
                font-size: 1.2em;
            }
            
            .math-challenge-header h2 {
                color: #333;
                margin: 15px 0 5px;
                font-size: 24px;
            }
            
            .math-challenge-header p {
                color: #666;
                margin: 8px 0;
            }
            
            .difficulty-indicator {
                font-size: 14px;
                color: #777;
                margin: 10px 0;
            }
            
            .math-problem {
                font-size: 36px;
                margin: 30px 0;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 15px;
            }
            
            .math-number {
                background-color: #f9f9f9;
                border-radius: 8px;
                padding: 10px 15px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                min-width: 40px;
                text-align: center;
            }
            
            .math-operation, .math-equals {
                font-weight: bold;
                color: #555;
            }
            
            .math-answer {
                width: 100px;
                height: 60px;
                font-size: 28px;
                text-align: center;
                border: 2px solid #4caf50;
                border-radius: 8px;
                padding: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                transition: all 0.2s;
            }
            
            .math-answer:focus {
                outline: none;
                border-color: #2196F3;
                box-shadow: 0 0 8px rgba(33, 150, 243, 0.5);
            }
            
            .math-controls {
                margin-top: 25px;
                display: flex;
                justify-content: center;
                gap: 15px;
            }
            
            .math-submit, .math-cancel {
                padding: 12px 25px;
                font-size: 16px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: bold;
                box-shadow: 0 3px 6px rgba(0,0,0,0.1);
            }
            
            .math-submit {
                background-color: #4caf50;
                color: white;
            }
            
            .math-submit:hover {
                background-color: #45a049;
                transform: translateY(-2px);
                box-shadow: 0 5px 10px rgba(0,0,0,0.15);
            }
            
            .math-cancel {
                background-color: #f5f5f5;
                color: #555;
                border: 1px solid #ddd;
            }
            
            .math-cancel:hover {
                background-color: #e9e9e9;
                color: #333;
            }
            
            .math-result {
                margin-top: 20px;
                font-size: 18px;
                min-height: 24px;
                padding: 10px;
                border-radius: 8px;
                transition: all 0.3s;
            }
            
            .math-result.success {
                color: white;
                background-color: rgba(76, 175, 80, 0.8);
                animation: pulse 0.5s 2;
            }
            
            .math-result.error {
                color: white;
                background-color: rgba(244, 67, 54, 0.8);
            }
        `;
        
        // Add to DOM
        uiContainer.appendChild(style);
        uiContainer.appendChild(this.mathChallengeUI);
        
        // Set up event listeners
        const submitButton = this.mathChallengeUI.querySelector('.math-submit');
        const cancelButton = this.mathChallengeUI.querySelector('.math-cancel');
        const answerInput = this.mathChallengeUI.querySelector('.math-answer');
        
        // Auto-focus the input
        setTimeout(() => {
            answerInput.focus();
        }, 100);
        
        // Submit on Enter key
        answerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._checkMathAnswer();
            }
        });
        
        // Button handlers
        submitButton.addEventListener('click', () => {
            this._checkMathAnswer();
        });
        
        cancelButton.addEventListener('click', () => {
            this._cancelMathChallenge();
        });
    }
    
    /**
     * Get color for fruit type
     */
    _getFruitColor(fruitType) {
        switch (fruitType) {
            case 'flame': return '#ff5722';
            case 'ice': return '#2196f3';
            case 'bomb': return '#9c27b0';
            case 'light': return '#ffeb3b';
            case 'magma': return '#f44336';
            default: return '#4caf50';
        }
    }
    
    /**
     * Check the user's answer to the math problem
     */
    _checkMathAnswer() {
        if (!this.mathChallengeUI || !this.currentMathProblem) return;
        
        const answerInput = this.mathChallengeUI.querySelector('.math-answer');
        const resultDiv = this.mathChallengeUI.querySelector('.math-result');
        
        // Get user's answer - handling both empty and non-numeric inputs
        const userAnswerText = answerInput.value.trim();
        
        // Check if input is empty
        if (userAnswerText === '') {
            resultDiv.textContent = 'Please enter an answer';
            resultDiv.className = 'math-result error';
            answerInput.focus();
            return;
        }
        
        // Convert to number and check if valid
        const userAnswer = parseInt(userAnswerText, 10);
        if (isNaN(userAnswer)) {
            resultDiv.textContent = 'Please enter a valid number';
            resultDiv.className = 'math-result error';
            answerInput.value = '';
            answerInput.focus();
            return;
        }
        
        // Check if it's correct
        if (userAnswer === this.currentMathProblem.answer) {
            // Correct answer
            resultDiv.textContent = '✓ Correct! You earned more fruit uses.';
            resultDiv.className = 'math-result success';
            
            // Get active fruit
            const fruit = this.getActiveFruit();
            if (fruit) {
                // Add uses
                fruit.addUses(this.mathRewardAmount);
                
                // Update UI
                this._updateFruitUI();
            }
            
            // Close after a delay
            setTimeout(() => {
                this._closeMathChallenge();
            }, 1500);
        } else {
            // Wrong answer
            resultDiv.textContent = '✗ Incorrect. Try again!';
            resultDiv.className = 'math-result error';
            
            // Clear the input
            answerInput.value = '';
            answerInput.focus();
        }
    }
    
    /**
     * Cancel the math challenge
     */
    _cancelMathChallenge() {
        this._closeMathChallenge();
    }
    
    /**
     * Close the math challenge UI
     */
    _closeMathChallenge() {
        if (this.mathChallengeUI && this.mathChallengeUI.parentNode) {
            this.mathChallengeUI.parentNode.removeChild(this.mathChallengeUI);
        }
        
        this.mathChallengeUI = null;
        this.currentMathProblem = null;
        this.mathChallengeActive = false;
    }
    
    /**
     * Create UI element for the danger sign
     */
    _createDangerSignUI() {
        // Get the UI container
        const uiContainer = document.getElementById('ui-container');
        if (!uiContainer) return;
        
        // Create danger sign element if it doesn't exist yet
        if (!this.dangerSignElement) {
            this.dangerSignElement = document.createElement('div');
            this.dangerSignElement.className = 'danger-sign';
            this.dangerSignElement.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>DANGER</span>
            `;
            uiContainer.appendChild(this.dangerSignElement);
            
            // Add style for the danger sign if it doesn't exist
            if (!document.querySelector('#danger-sign-style')) {
                const style = document.createElement('style');
                style.id = 'danger-sign-style';
                style.textContent = `
                    .danger-sign {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background-color: rgba(255, 0, 0, 0.7);
                        color: white;
                        padding: 10px 20px;
                        border-radius: 5px;
                        font-size: 24px;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        opacity: 0;
                        pointer-events: none;
                        transition: opacity 0.3s ease;
                        z-index: 1000;
                    }
                    
                    .danger-sign.visible {
                        opacity: 1;
                        animation: pulse 1s infinite alternate;
                    }
                    
                    .danger-sign i {
                        font-size: 28px;
                    }
                    
                    @keyframes pulse {
                        0% {
                            transform: translate(-50%, -50%) scale(1);
                        }
                        100% {
                            transform: translate(-50%, -50%) scale(1.1);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Initially hide the danger sign
        this._updateDangerSign(false);
    }
    
    /**
     * Update the danger sign visibility
     */
    _updateDangerSign(isInDanger) {
        if (!this.dangerSignElement) return;
        
        if (isInDanger) {
            this.dangerSignElement.classList.add('visible');
            
            // Add timer indicator if in enemy range and timer is active
            if (this.inEnemyRange && this.damageTimer > 0) {
                const percentComplete = Math.min((this.damageTimer / this.damageThreshold) * 100, 100);
                this.dangerSignElement.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>DANGER</span>
                    <div class="danger-timer">
                        <div class="danger-timer-fill" style="width: ${percentComplete}%"></div>
                    </div>
                `;
                
                // Add danger timer style if it doesn't exist yet
                if (!document.querySelector('#danger-timer-style')) {
                    const style = document.createElement('style');
                    style.id = 'danger-timer-style';
                    style.textContent = `
                        .danger-timer {
                            width: 100%;
                            height: 6px;
                            background-color: rgba(255, 255, 255, 0.3);
                            border-radius: 3px;
                            margin-top: 5px;
                            overflow: hidden;
                        }
                        
                        .danger-timer-fill {
                            height: 100%;
                            background-color: white;
                            width: 0%;
                            transition: width 0.1s linear;
                        }
                    `;
                    document.head.appendChild(style);
                }
            } else {
                this.dangerSignElement.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>DANGER</span>
                `;
            }
        } else {
            this.dangerSignElement.classList.remove('visible');
        }
    }
    
    destroy() {
        // Remove player from scene
        if (this.object3D && this.engine && this.engine.renderer) {
            this.engine.renderer.remove(this.object3D);
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
        
        // Clean up math challenge UI if it exists
        this._closeMathChallenge();
        
        // Remove the danger sign UI if it exists
        if (this.dangerSignElement && this.dangerSignElement.parentNode) {
            this.dangerSignElement.parentNode.removeChild(this.dangerSignElement);
        }
        
        // Remove danger sign style if it exists
        const dangerSignStyle = document.getElementById('danger-sign-style');
        if (dangerSignStyle && dangerSignStyle.parentNode) {
            dangerSignStyle.parentNode.removeChild(dangerSignStyle);
        }
    }
}