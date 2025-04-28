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
        
        // Log all fruits and their uses
        console.log("==== ALL FRUIT COUNTS ====");
        this.fruits.forEach((fruit, idx) => {
            console.log(`Fruit ${idx+1}: ${fruit.name} - Uses remaining: ${fruit.usesRemaining}`);
        });
        console.log("=========================");
        
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
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown < 0) {
                this.attackCooldown = 0;
            }
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
        
        // Handle math challenge trigger with M key
        if (input.isKeyPressed('KeyM')) {
            this._startMathChallenge();
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
        
        if (distanceFromCenter > 29) {
            // Player is too close to edge, push back
            const angle = Math.atan2(this.object3D.position.x, this.object3D.position.z);
            this.object3D.position.x = Math.sin(angle) * 29;
            this.object3D.position.z = Math.cos(angle) * 29;
        }
    }
    
    /**
     * Use basic attack with current fruit
     */
    _useBasicAttack() {
        // Check cooldown
        if (this.attackCooldown > 0) {
            return;
        }
        
        // Set cooldown
        this.attackCooldown = this.attackCooldownTime;
        
        // Get active fruit
        const fruit = this.getActiveFruit();
        if (!fruit) return;
        
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
        
        // Use fruit's basic attack
        const attackResult = fruit.useBasicAttack(attackStartPosition, direction);
        
        // Check for direct hits on enemies
        const gameState = this.engine.stateManager.getCurrentState();
        if (gameState && gameState.checkDirectAttackHits) {
            // Check for enemies in a cone in front of the player
            const attackRange = 5; // 5 units in front of the player
            gameState.checkDirectAttackHits(attackStartPosition, attackRange, fruit.power, fruit.type);
        }
        
        // Update UI to reflect updated uses count
        this._updateFruitUI();
        
        // Create visual feedback for attack
        this._createAttackEffect(attackStartPosition, direction, fruit.type);
        
        return attackResult;
    }
    
    /**
     * Use special attack with current fruit
     */
    _useSpecialAttack() {
        // Get active fruit
        const fruit = this.getActiveFruit();
        if (!fruit) return;
        
        // Check if the special attack is on cooldown
        if (fruit.isOnCooldown('special')) {
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
        
        // Use fruit's special attack
        const attackResult = fruit.useSpecialAttack(attackStartPosition, direction);
        
        // Check for direct hits on enemies
        const gameState = this.engine.stateManager.getCurrentState();
        if (gameState && gameState.checkDirectAttackHits) {
            // Special attacks have a wider range
            const attackRange = 8; // 8 units in front of the player
            gameState.checkDirectAttackHits(attackStartPosition, attackRange, fruit.power * 1.5, fruit.type);
        }
        
        // Update UI to reflect updated uses count
        this._updateFruitUI();
        
        // Create visual feedback for special attack
        this._createSpecialAttackEffect(attackStartPosition, direction, fruit.type);
        
        return attackResult;
    }
    
    /**
     * Create visual effect for basic attack
     */
    _createAttackEffect(position, direction, fruitType) {
        // Create effect based on fruit type
        let color = 0xffffff; // Default color
        
        switch(fruitType) {
            case 'flame':
                color = 0xff4400; // Orange/red for flame
                break;
            case 'ice':
                color = 0x00ddff; // Light blue for ice
                break;
            case 'light':
                color = 0xffff00; // Yellow for light
                break;
            case 'bomb':
                color = 0x888888; // Gray for bomb
                break;
            case 'magma':
                color = 0xff0000; // Red for magma
                break;
        }
        
        // Create a small flash effect
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const flashEffect = new THREE.Mesh(geometry, material);
        flashEffect.position.copy(position);
        
        // Add to scene
        this.engine.renderer.scene.add(flashEffect);
        
        // Animate the flash effect
        const startTime = Date.now();
        const duration = 200; // ms
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Scale up and fade out
            flashEffect.scale.set(1 + progress * 2, 1 + progress * 2, 1 + progress * 2);
            flashEffect.material.opacity = 0.8 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove effect when animation is complete
                this.engine.renderer.scene.remove(flashEffect);
                flashEffect.geometry.dispose();
                flashEffect.material.dispose();
            }
        };
        
        // Start animation
        animate();
    }
    
    /**
     * Create visual effect for special attack
     */
    _createSpecialAttackEffect(position, direction, fruitType) {
        // Create more dramatic effect based on fruit type
        let color = 0xffffff; // Default color
        
        switch(fruitType) {
            case 'flame':
                color = 0xff4400; // Orange/red for flame
                break;
            case 'ice':
                color = 0x00ddff; // Light blue for ice
                break;
            case 'light':
                color = 0xffff00; // Yellow for light
                break;
            case 'bomb':
                color = 0x888888; // Gray for bomb
                break;
            case 'magma':
                color = 0xff0000; // Red for magma
                break;
        }
        
        // Create a larger flash effect
        const geometry = new THREE.SphereGeometry(1.0, 12, 12);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.9
        });
        
        const flashEffect = new THREE.Mesh(geometry, material);
        flashEffect.position.copy(position);
        
        // Add to scene
        this.engine.renderer.scene.add(flashEffect);
        
        // Animate the flash effect
        const startTime = Date.now();
        const duration = 500; // ms
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Scale up and fade out with waves
            const wave = Math.sin(progress * Math.PI * 4) * 0.2 + 0.8;
            flashEffect.scale.set(1 + progress * 4 * wave, 1 + progress * 4 * wave, 1 + progress * 4 * wave);
            flashEffect.material.opacity = 0.9 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove effect when animation is complete
                this.engine.renderer.scene.remove(flashEffect);
                flashEffect.geometry.dispose();
                flashEffect.material.dispose();
            }
        };
        
        // Start animation
        animate();
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
        
        // Check proximity to regular enemies
        if (gameState.enemies) {
            gameState.enemies.forEach(enemy => {
                if (!enemy.isActive) return;
                
                const enemyPos = enemy.getPosition();
                if (!enemyPos) return;
                
                const distance = Math.sqrt(
                    Math.pow(playerPos.x - enemyPos.x, 2) + 
                    Math.pow(playerPos.z - enemyPos.z, 2)
                );
                
                // Log when player gets close to a villain
                if (distance <= 5) {
                    console.log(`PROXIMITY ALERT: Near villain ${enemy.name} at distance ${distance.toFixed(2)}`);
                }
            });
        }
        
        // Check proximity to mini bosses
        if (gameState.bosses) {
            gameState.bosses.forEach(boss => {
                if (!boss.isActive) return;
                
                const bossPos = boss.getPosition();
                if (!bossPos) return;
                
                const distance = Math.sqrt(
                    Math.pow(playerPos.x - bossPos.x, 2) + 
                    Math.pow(playerPos.z - bossPos.z, 2)
                );
                
                // Log when player gets close to a boss
                if (distance <= 8) {
                    console.log(`PROXIMITY ALERT: Near boss ${boss.name} at distance ${distance.toFixed(2)}`);
                }
            });
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
     * 2 = Hard (double digit multiplication or simple division)
     * 3 = Very Hard (more complex multiplication and division)
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
                
            case 2: // Hard
                // 50% chance of multiplication or division
                if (Math.random() < 0.5) {
                    num1 = Math.floor(Math.random() * 40) + 10; // 10-49
                    num2 = Math.floor(Math.random() * 9) + 1; // 1-9
                    operation = "×";
                    answer = num1 * num2;
                } else {
                    // Division where result is a whole number
                    num2 = Math.floor(Math.random() * 9) + 1; // 1-9
                    answer = Math.floor(Math.random() * 10) + 1; // 1-10
                    num1 = num2 * answer;
                    operation = "÷";
                }
                break;
                
            case 3: // Very Hard
                // 50% chance of multiplication or division
                if (Math.random() < 0.5) {
                    num1 = Math.floor(Math.random() * 40) + 10; // 10-49
                    num2 = Math.floor(Math.random() * 40) + 10; // 10-49
                    operation = "×";
                    answer = num1 * num2;
                } else {
                    // More complex division
                    num2 = Math.floor(Math.random() * 12) + 2; // 2-13
                    answer = Math.floor(Math.random() * 15) + 5; // 5-19
                    num1 = num2 * answer;
                    operation = "÷";
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
                    <h2>Math Challenge for ${fruit.name}</h2>
                    <p>Solve this problem to get ${this.mathRewardAmount} more uses!</p>
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
            }
            
            .math-challenge-container {
                background-color: #fff;
                border-radius: 10px;
                padding: 20px;
                width: 400px;
                text-align: center;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
            }
            
            .math-challenge-header h2 {
                color: #333;
                margin-top: 0;
            }
            
            .math-problem {
                font-size: 32px;
                margin: 20px 0;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
            }
            
            .math-number, .math-operation, .math-equals {
                display: inline-block;
                vertical-align: middle;
            }
            
            .math-answer {
                width: 80px;
                height: 40px;
                font-size: 24px;
                text-align: center;
                border: 2px solid #ccc;
                border-radius: 5px;
            }
            
            .math-controls {
                margin-top: 20px;
                display: flex;
                justify-content: center;
                gap: 10px;
            }
            
            .math-submit, .math-cancel {
                padding: 10px 20px;
                font-size: 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            
            .math-submit {
                background-color: #4caf50;
                color: white;
            }
            
            .math-cancel {
                background-color: #f44336;
                color: white;
            }
            
            .math-result {
                margin-top: 15px;
                font-size: 18px;
                min-height: 24px;
            }
            
            .math-result.success {
                color: #4caf50;
            }
            
            .math-result.error {
                color: #f44336;
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
            resultDiv.textContent = 'Correct! You earned more fruit uses.';
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
            resultDiv.textContent = 'Incorrect. Try again!';
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
        
        // Clean up math challenge UI if it exists
        this._closeMathChallenge();
    }
}