/**
 * Main gameplay state
 */
import { BaseState } from './BaseState.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { MiniBoss } from '../entities/MiniBoss.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';
import audioManager from '../lib/AudioManager.js';

export class GameplayState extends BaseState {
    constructor(engine) {
        super(engine);
        
        this.uiContainer = document.getElementById('ui-container');
        this.gameplayUI = null;
        
        this.player = null;
        this.enemies = [];
        this.boss = null;
        this.currentIsland = null;
        
        // Store currently selected fruit index
        this.selectedFruitIndex = 0;
        
        // Boss creation flag
        this.bossCreated = false;
        
        // Performance optimization flags
        this.uiUpdateTimer = 0;
        this.UI_UPDATE_INTERVAL = 0.1; // Update UI every 100ms instead of every frame
    }
    
    /**
     * Initialize the gameplay state
     */
    init() {
        super.init();
        
        // Ensure audio manager is initialized
        if (!audioManager.initialized && this.engine.renderer.camera) {
            audioManager.init(this.engine.renderer.camera);
        }
    }
    
    /**
     * Enter the gameplay state
     */
    enter(params = {}) {
        super.enter(params);
        
        // Create game world
        this.createGameWorld();
        
        // Create player
        this.createPlayer();
        
        // Create enemies and boss
        this.createEnemies();
        
        // Create and show UI
        this.createUI();
        
        // Set camera for following player
        this.setupCamera();
    }
    
    /**
     * Create the game world - optimized version
     */
    createGameWorld() {
        // Clear existing scene
        const scene = this.engine.renderer.scene;
        
        // More efficient scene clearing
        while(scene.children.length > 0) { 
            const child = scene.children[0];
            if (child.type === 'Mesh') {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
                scene.remove(child);
            } else if (child.type !== 'Camera' && child.type !== 'Light') {
                scene.remove(child);
            }
        }
        
        // Set background texture
        const backgroundTexture = this.engine.resources.getTexture('background');
        if (backgroundTexture) {
            scene.background = backgroundTexture;
        } else {
            scene.background = new THREE.Color(0x87CEEB); // Sky blue fallback
        }
        
        // Create a simple flat ground for collision detection - shared geometry/material
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 1, 1); // Reduced segments
        const groundMaterial = new THREE.MeshBasicMaterial({ visible: false });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Make it horizontal
        ground.position.y = -0.5; // Slightly below visual level
        scene.add(ground);
    }
    
    /**
     * Add environment elements to the scene
     */
    addEnvironmentElements(scene) {
        // Empty method kept for compatibility
    }
    
    /**
     * Create player character
     */
    createPlayer() {
        // Create player with config
        const playerConfig = this.engine.config.player;
        
        // Check for selected fruits or use defaults
        let playerFruits = [];
        if (this.engine.playerFruits && this.engine.playerFruits.length > 0) {
            playerFruits = this.engine.playerFruits;
        } else {
            // Use default fruits from config
            playerFruits = this.engine.config.fruits;
        }
        
        // Create player instance
        this.player = new Player(this.engine, {
            name: playerConfig.name,
            health: playerConfig.health,
            maxHealth: playerConfig.health,
            speed: playerConfig.speed,
            jumpPower: playerConfig.jumpPower,
            fruits: playerFruits
        });
        
        // Center player on the island
        this.player.setPosition(0, 0, 0);
    }
    
    /**
     * Set up camera in fixed isometric view
     */
    setupCamera() {
        // Set camera position for fixed isometric view
        const camera = this.engine.renderer.camera;
        
        // Position camera for true isometric view at a fixed distance with increased height
        camera.position.set(20, 30, 20);
        
        // Look at center of the island
        camera.lookAt(0, 0, 0);
        
        // Adjust camera settings
        camera.fov = 70; // Wider field of view for better visibility
        camera.updateProjectionMatrix();
        
        // Disable orbit controls for gameplay
        if (this.engine.renderer.controls) {
            this.engine.renderer.controls.enabled = false;
        }
    }
    
    /**
     * Create gameplay UI - optimized version
     */
    createUI() {
        // Create gameplay UI
        this.gameplayUI = document.createElement('div');
        this.gameplayUI.className = 'gameplay-ui';
        
        // Simplified UI structure with player info and controls
        this.gameplayUI.innerHTML = `
            <div class="player-info">
                <div class="player-name">Efrain</div>
                <div class="health-bar">
                    <div class="health-fill" style="width: 100%;"></div>
                </div>
            </div>
            <div class="game-message" id="game-message"></div>
            <div class="fruit-powers">
                <div class="fruit-power-title">Fruit Powers</div>
                <div class="fruit-power-list"></div>
                <div class="fruit-details-panel">
                    <div class="fruit-details-name"></div>
                    <div class="fruit-details-attacks"></div>
                </div>
            </div>
            <div class="game-controls">
                <div class="controls-info">
                    <p>WASD/Arrows: Move | Space: Attack | 1-5: Select Fruit | M: Math Challenge</p>
                </div>
            </div>
        `;
        
        // Add styling - simplified and optimized CSS
        const style = document.createElement('style');
        style.textContent = `
            .gameplay-ui {
                pointer-events: none;
                user-select: none;
                color: white;
            }
            
            .player-info {
                position: absolute;
                top: 20px;
                left: 20px;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 5px;
                width: 200px;
            }
            
            .player-name {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .health-bar {
                width: 100%;
                height: 10px;
                background-color: #333;
                border-radius: 5px;
                overflow: hidden;
            }
            
            .health-fill {
                height: 100%;
                background-color: #3c3;
                transition: width 0.3s ease;
            }
            
            .fruit-powers {
                position: absolute;
                bottom: 20px;
                left: 20px;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 5px;
                width: 360px;
            }
            
            .fruit-power-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .fruit-power-list {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .fruit-power-item {
                width: 50px;
                height: 50px;
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                position: relative;
            }
            
            .fruit-power-item.active {
                background-color: rgba(255, 215, 0, 0.4);
                border: 2px solid gold;
            }
            
            .fruit-uses {
                position: absolute;
                bottom: 2px;
                right: 2px;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                font-size: 12px;
                padding: 1px 4px;
                border-radius: 4px;
            }
            
            .fruit-details-panel {
                background-color: rgba(0, 0, 0, 0.3);
                border-radius: 5px;
                padding: 10px;
            }
            
            .fruit-details-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 8px;
            }
            
            .game-controls {
                position: absolute;
                top: 20px;
                right: 20px;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 5px;
            }
            
            .game-message {
                position: absolute;
                top: 100px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.7);
                color: #ff0;
                font-size: 24px;
                font-weight: bold;
                padding: 15px 30px;
                border-radius: 8px;
                text-align: center;
                z-index: 100;
                display: none;
            }
        `;
        
        this.uiContainer.appendChild(style);
        this.uiContainer.appendChild(this.gameplayUI);
        
        // Store reference to message element
        this.messageElement = document.getElementById('game-message');
        
        // Add selected fruits to UI
        this.populateFruitUI();
        
        // Update fruit details for the initially selected fruit
        this.updateFruitDetails();
    }
    
    /**
     * Populate the fruit UI with the player's selected fruits - optimized
     */
    populateFruitUI() {
        const fruitPowerList = this.gameplayUI.querySelector('.fruit-power-list');
        fruitPowerList.innerHTML = '';
        
        // Use document fragment for better performance when adding multiple DOM elements
        const fragment = document.createDocumentFragment();
        
        if (this.engine.playerFruits && this.engine.playerFruits.length > 0) {
            this.engine.playerFruits.forEach((fruit, index) => {
                const fruitItem = document.createElement('div');
                fruitItem.className = 'fruit-power-item';
                
                // Get fruit data from store
                const fruitData = fruitStore.getFruit(fruit.name);
                const usesRemaining = fruitData ? fruitData.usesRemaining : 5;
                
                fruitItem.innerHTML = `
                    <img src="models/fruits/${fruit.type.charAt(0).toUpperCase() + fruit.type.slice(1)}Fruit.png" 
                         alt="${fruit.name}" 
                         style="width: 40px; height: 40px; object-fit: contain;">
                    <span class="fruit-uses">${usesRemaining}</span>
                `;
                fruitItem.dataset.fruitIndex = index;
                
                if (index === this.selectedFruitIndex) {
                    fruitItem.classList.add('active');
                }
                
                fragment.appendChild(fruitItem);
            });
        } else {
            // If no fruits selected (should not happen), use defaults
            const defaultFruits = ['flame', 'ice', 'bomb', 'light', 'magma'];
            defaultFruits.forEach((type, index) => {
                const fruitItem = document.createElement('div');
                fruitItem.className = 'fruit-power-item';
                fruitItem.innerHTML = `
                    <img src="models/fruits/${type.charAt(0).toUpperCase() + type.slice(1)}Fruit.png" 
                         alt="${type}" 
                         style="width: 40px; height: 40px; object-fit: contain;">
                    <span class="fruit-uses">5</span>
                `;
                fruitItem.dataset.fruitIndex = index;
                
                if (index === this.selectedFruitIndex) {
                    fruitItem.classList.add('active');
                }
                
                fragment.appendChild(fruitItem);
            });
        }
        
        fruitPowerList.appendChild(fragment);
    }
    
    /**
     * Update the fruit details panel - optimized
     */
    updateFruitDetails() {
        if (!this.gameplayUI) return;
        
        const detailsName = this.gameplayUI.querySelector('.fruit-details-name');
        const detailsAttacks = this.gameplayUI.querySelector('.fruit-details-attacks');
        
        // Get the currently selected fruit
        const fruits = this.engine.playerFruits || [];
        if (fruits.length === 0 || this.selectedFruitIndex >= fruits.length) return;
        
        const selectedFruit = fruits[this.selectedFruitIndex];
        const fruitData = fruitStore.getFruit(selectedFruit.name);
        
        if (!fruitData) return;
        
        // Update the fruit name
        detailsName.textContent = selectedFruit.name;
        
        // Clear and update attacks
        detailsAttacks.innerHTML = '';
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        const attackTypes = ['Basic Attack', 'Special Attack', 'Ultimate Attack'];
        attackTypes.forEach((attackType, index) => {
            // Get the attack name from fruit attacks array if available
            const attackName = selectedFruit.attacks[index] || attackType;
            
            const attackItem = document.createElement('div');
            attackItem.className = 'fruit-attack-item';
            
            // Calculate cooldown percentage
            const cooldownPercent = fruitStore.getCooldownPercentage(selectedFruit.name, attackType);
            const cooldownTime = fruitData.currentCooldowns[attackType].toFixed(1);
            const showCooldown = cooldownPercent > 0 ? `${cooldownTime}s` : 'Ready';
            
            attackItem.innerHTML = `
                <span>${attackName}</span>
                <span>DMG: ${fruitData.damageValues[attackType]} | ${showCooldown}</span>
            `;
            
            fragment.appendChild(attackItem);
        });
        
        detailsAttacks.appendChild(fragment);
    }
    
    /**
     * Update the fruit UI with current uses and cooldowns - throttled update
     */
    updateFruitUI() {
        // Skip UI updates if not enough time has passed since last update
        if (this.uiUpdateTimer > 0) return;
        this.uiUpdateTimer = this.UI_UPDATE_INTERVAL;
        
        // Update the uses remaining for each fruit
        const fruitItems = this.gameplayUI.querySelectorAll('.fruit-power-item');
        const fruits = this.engine.playerFruits || [];
        
        fruitItems.forEach((item, index) => {
            if (index >= fruits.length) return;
            
            const fruit = fruits[index];
            const fruitData = fruitStore.getFruit(fruit.name);
            
            if (fruitData) {
                const usesEl = item.querySelector('.fruit-uses');
                if (usesEl) {
                    usesEl.textContent = fruitData.usesRemaining;
                }
            }
        });
        
        // Update the selected fruit's details
        this.updateFruitDetails();
    }
    
    /**
     * Select a fruit by index - optimized
     */
    selectFruit(index) {
        const fruits = this.engine.playerFruits || [];
        if (index < 0 || index >= fruits.length) return;
        
        this.selectedFruitIndex = index;
        
        // Update UI to show the selected fruit
        const fruitItems = this.gameplayUI.querySelectorAll('.fruit-power-item');
        fruitItems.forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update the fruit details panel
        this.updateFruitDetails();
    }
    
    /**
     * Get emoji for fruit type - removed as unused
     */
    
    /**
     * Create enemies and boss - optimized
     */
    createEnemies() {
        // Clear any existing enemies
        this.enemies.forEach(enemy => {
            if (enemy) enemy.destroy();
        });
        this.enemies = [];
        
        if (this.boss) {
            this.boss.destroy();
            this.boss = null;
        }
        
        // Create 5 enemies 
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 8 + Math.random() * 6;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const enemy = new Enemy(this.engine, {
                name: `Villain ${i+1}`,
                health: 50 + i * 10
            });
            
            enemy.setPosition(x, 0, z);
            this.enemies.push(enemy);
        }
        
        // Initialize boss but don't create it yet - will spawn after all enemies are defeated
        this.bossCreated = false;
    }

    /**
     * Create the boss when all enemies are defeated
     */
    createBoss() {
        if (this.boss) {
            this.boss.destroy();
        }
        
        // Create a boss at the far end of the island, but not too far
        this.boss = new MiniBoss(this.engine, {
            name: 'Island Boss',
            health: 200,
            abilities: [
                { name: 'shockwave', power: 30 },
                { name: 'teleport', power: 0 },
                { name: 'fireBlast', power: 40 }
            ]
        });
        
        // Position the boss closer to the player
        this.boss.setPosition(0, 0, -18);
        
        // Mark boss as created
        this.bossCreated = true;
        
        // Display a message to the player
        if (this.messageElement) {
            this.messageElement.textContent = "The Island Boss has appeared!";
            this.messageElement.style.display = "block";
            
            // Hide the message after 3 seconds
            setTimeout(() => {
                if (this.messageElement) {
                    this.messageElement.style.display = "none";
                }
            }, 3000);
        }
    }

    /**
     * Update the gameplay state - optimized for performance
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Decrement UI update timer
        if (this.uiUpdateTimer > 0) {
            this.uiUpdateTimer -= deltaTime;
        }
        
        // Update the player
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        // Update enemies and remove dead ones - optimized by reducing work
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy) {
                if (enemy.isActive) {
                    enemy.update(deltaTime);
                } else {
                    // Remove dead enemies from the array
                    this.enemies.splice(i, 1);
                }
            }
        }
        
        // Check if all enemies are defeated and boss should spawn
        if (!this.bossCreated && this.enemies.length === 0) {
            this.createBoss();
        }
        
        // Update boss if exists
        if (this.boss) {
            this.boss.update(deltaTime);
        }
        
        // Update camera to follow player - less frequent updates
        this.updateCamera();
        
        // Update fruit store cooldowns
        fruitStore.updateCooldowns(deltaTime);
        
        // Update fruit UI - less frequently through timer
        this.updateFruitUI();
        
        // Handle input for fruit selection (1-5 keys)
        for (let i = 1; i <= 5; i++) {
            if (this.engine.input.isKeyPressed(`Digit${i}`) || this.engine.input.isKeyPressed(`Numpad${i}`)) {
                this.selectFruit(i - 1);
            }
        }
    }
    
    /**
     * Update camera for isometric view - optimized
     */
    updateCamera() {
        if (!this.player) return;
        
        const camera = this.engine.renderer.camera;
        const input = this.engine.input;
        
        // Get player position
        const playerPosition = this.player.getPosition();
        if (!playerPosition) return;
        
        // Initialize camera offset if not set
        if (!this.cameraOffset) {
            this.cameraOffset = { x: 0, z: 0 };
        }
        
        // Mouse-based camera panning - only when mouse is at screen edges
        const mousePos = input.getMousePosition();
        if (!mousePos) return;
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Mouse edges detection with larger threshold - less sensitive panning
        const edgeThreshold = 30; // reduced from 50
        const panSpeed = 0.15 * this.engine.time.deltaTime; // reduced from 0.2
        
        // Panning at screen edges - reduced sensitivity
        if (mousePos.x < edgeThreshold) {
            // Left edge
            this.cameraOffset.x -= panSpeed;
        } else if (mousePos.x > screenWidth - edgeThreshold) {
            // Right edge
            this.cameraOffset.x += panSpeed;
        }
        
        if (mousePos.y < edgeThreshold) {
            // Top edge
            this.cameraOffset.z -= panSpeed;
        } else if (mousePos.y > screenHeight - edgeThreshold) {
            // Bottom edge
            this.cameraOffset.z += panSpeed;
        }
        
        // Limit camera panning to island bounds
        const maxOffset = 30; // reduced from 40
        this.cameraOffset.x = Math.max(-maxOffset, Math.min(maxOffset, this.cameraOffset.x));
        this.cameraOffset.z = Math.max(-maxOffset, Math.min(maxOffset, this.cameraOffset.z));
        
        // Calculate center point (player position + camera offset)
        const centerPosition = new THREE.Vector3(
            playerPosition.x + this.cameraOffset.x,
            0, // Keep at ground level
            playerPosition.z + this.cameraOffset.z
        );
        
        // Smoothly shift the look target
        camera.lookAt(centerPosition);
    }
    
    /**
     * Check for direct hits on enemies from an attack - optimized
     */
    checkDirectAttackHits(attackPosition, attackRange, damage, attackType) {
        if (!this.enemies || !Array.isArray(this.enemies)) {
            return false;
        }
        
        // Create combined targets array only when needed
        const targets = [...this.enemies];
        if (this.boss && this.boss.isActive) {
            targets.push(this.boss);
        }
        
        // Find closest enemy within attack range - using direct distance calculations
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (const enemy of targets) {
            if (!enemy || !enemy.isActive) continue;
            
            const enemyPosition = enemy.getPosition();
            if (!enemyPosition) continue;
            
            // Calculate squared distance to enemy (faster than using distanceTo)
            const dx = attackPosition.x - enemyPosition.x;
            const dz = attackPosition.z - enemyPosition.z;
            const distanceSquared = dx * dx + dz * dz;
            
            // Compare with squared range
            const rangeSquared = attackRange * attackRange;
            
            // Check if within range and closer than current closest
            if (distanceSquared <= rangeSquared && distanceSquared < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distanceSquared;
            }
        }
        
        // If we found a closest enemy in range, damage it
        if (closestEnemy) {
            closestEnemy.takeDamage(damage);
            return true;
        }
        
        return false;
    }
    
    /**
     * Exit gameplay state
     */
    exit() {
        super.exit();
        
        // Remove UI
        this.removeUI();
        
        // Clean up player
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        
        // Clean up enemies
        this.enemies.forEach(enemy => {
            if (enemy) enemy.destroy();
        });
        this.enemies = [];
        
        // Clean up boss
        if (this.boss) {
            this.boss.destroy();
            this.boss = null;
        }
        
        // Re-enable orbit controls if they exist
        if (this.engine.renderer.controls) {
            this.engine.renderer.controls.enabled = true;
        }
    }
    
    /**
     * Remove gameplay UI
     */
    removeUI() {
        if (this.gameplayUI && this.gameplayUI.parentNode) {
            this.gameplayUI.parentNode.removeChild(this.gameplayUI);
        }
    }

    /**
     * Handle player death
     */
    onPlayerDeath() {
        // Create a game over screen
        const gameOverScreen = document.createElement('div');
        gameOverScreen.className = 'game-over-screen';
        gameOverScreen.innerHTML = `
            <div class="game-over-content">
                <h2>Game Over</h2>
                <p>You were defeated!</p>
                <button id="restart-button">Try Again</button>
            </div>
        `;
        
        document.body.appendChild(gameOverScreen);
        
        // Add event listener to restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            // Remove game over screen
            document.body.removeChild(gameOverScreen);
            
            // Restart the game
            this.engine.stateManager.switchState('gameplay');
        });
    }
    
    /**
     * Handle boss defeat and victory
     */
    onBossDefeated() {
        // Play victory sound if available
        const victorySound = this.engine.resources.getSound('victory');
        if (victorySound) {
            audioManager.playSound(victorySound, 0.8, false);
        }
        
        // Create victory banner
        const victoryScreen = document.createElement('div');
        victoryScreen.className = 'victory-screen';
        victoryScreen.innerHTML = `
            <div class="victory-content">
                <h2>Victory!</h2>
                <p>Congratulations, Efrain! You've defeated the boss!</p>
                <button id="play-again-button">Play Again</button>
            </div>
        `;
        
        document.body.appendChild(victoryScreen);
        // Add event listener
        document.getElementById('play-again-button').addEventListener('click', () => {
            // Remove victory screen
            document.body.removeChild(victoryScreen);
            
            // Reload the window
            window.location.reload();
        });
    }
}