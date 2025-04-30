/**
 * Main gameplay state
 */
import { BaseState } from './BaseState.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { MiniBoss } from '../entities/MiniBoss.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';

export class GameplayState extends BaseState {
    constructor(engine) {
        super(engine);
        
        this.uiContainer = document.getElementById('ui-container');
        this.gameplayUI = null;
        
        this.player = null;
        this.enemies = [];
        this.boss = null;
        this.currentIsland = null;
        
        // Background music
        this.bgMusic = null;
        this.audioListener = null;
        
        // Store currently selected fruit index
        this.selectedFruitIndex = 0;
    }
    
    /**
     * Initialize the gameplay state
     */
    init() {
        super.init();
        
        // Initialize audio
        this.setupAudio();
    }
    
    /**
     * Set up audio for the game
     */
    setupAudio() {
        // Create an audio listener
        this.audioListener = new THREE.AudioListener();
        this.engine.renderer.camera.add(this.audioListener);
        
        // Create a global Audio source for background music
        this.bgMusic = new THREE.Audio(this.audioListener);
    }
    
    /**
     * Play background music
     */
    playBackgroundMusic() {
        // Only play if not already playing and sound is enabled
        if (this.bgMusic && !this.bgMusic.isPlaying && this.engine.soundEnabled) {
            // Get the loaded audio buffer
            const audioBuffer = this.engine.resources.getSound('bgMusic');
            
            if (audioBuffer) {
                // Set the audio buffer to the audio source
                this.bgMusic.setBuffer(audioBuffer);
                // Set to loop
                this.bgMusic.setLoop(true);
                // Set volume
                this.bgMusic.setVolume(0.5);
                // Play the audio
                this.bgMusic.play();
            } else {
                console.warn('Background music not loaded');
            }
        }
    }
    
    /**
     * Pause background music
     */
    pauseBackgroundMusic() {
        if (this.bgMusic && this.bgMusic.isPlaying) {
            this.bgMusic.pause();
        }
    }
    
    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        if (this.bgMusic) {
            this.bgMusic.stop();
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
        
        // Start playing background music
        this.playBackgroundMusic();
    }
    
    /**
     * Create the game world
     */
    createGameWorld() {
        // Clear existing scene
        const scene = this.engine.renderer.scene;
        
        // Remove all objects except camera and lights
        const objectsToRemove = [];
        scene.traverse((object) => {
            if (object.type === 'Mesh') {
                objectsToRemove.push(object);
            }
        });
        
        objectsToRemove.forEach(object => {
            scene.remove(object);
        });
        
        // Set background texture
        const backgroundTexture = this.engine.resources.getTexture('background');
        if (backgroundTexture) {
            scene.background = backgroundTexture;
        } else {
            console.warn("Background texture not found, using default sky color");
            scene.background = new THREE.Color(0x87CEEB); // Sky blue fallback
        }
        
        // Create a simple flat ground for collision detection
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshBasicMaterial({ 
            visible: false // Invisible collision plane
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Make it horizontal
        ground.position.y = -0.5; // Slightly below visual level
        scene.add(ground);
    }
    
    /**
     * Add environment elements to the scene
     */
    addEnvironmentElements(scene) {
        // No additional elements needed as we're using the background image
        // This method is kept empty to maintain compatibility with other code
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
        camera.fov = 45; // Narrower field of view for more isometric look
        camera.updateProjectionMatrix();
        
        // Disable orbit controls for gameplay
        if (this.engine.renderer.controls) {
            this.engine.renderer.controls.enabled = false;
        }
    }
    
    /**
     * Create gameplay UI
     */
    createUI() {
        // Create gameplay UI
        this.gameplayUI = document.createElement('div');
        this.gameplayUI.className = 'gameplay-ui';
        
        // Basic UI structure with player info and controls
        this.gameplayUI.innerHTML = `
            <div class="player-info">
                <div class="player-name">Efrain</div>
                <div class="health-bar">
                    <div class="health-fill" style="width: 100%;"></div>
                </div>
            </div>
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
                    <p>WASD or Arrow Keys: Move</p>
                    <p>Space: Use Fruit Attack</p>
                    <p>1-5: Select Fruit</p>
                    <p>M: Math Challenge for More Fruit Uses</p>
                    <p>Mouse to Edge: Pan Camera</p>
                </div>
            </div>
        `;
        
        // Add styling
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
            
            .fruit-attack-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 14px;
                padding: 4px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            }
            
            .attack-name {
                font-weight: bold;
            }
            
            .attack-cooldown {
                display: flex;
                align-items: center;
            }
            
            .cooldown-bar {
                width: 40px;
                height: 6px;
                background-color: #555;
                border-radius: 3px;
                overflow: hidden;
                margin-left: 5px;
            }
            
            .cooldown-fill {
                height: 100%;
                background-color: #3af;
                width: 0%;
            }
            
            .attack-damage {
                color: #f55;
                margin-right: 10px;
            }
            
            .game-controls {
                position: absolute;
                top: 20px;
                right: 20px;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 5px;
            }
            
            .controls-info p {
                margin: 5px 0;
            }
        `;
        
        this.uiContainer.appendChild(style);
        this.uiContainer.appendChild(this.gameplayUI);
        
        // Add selected fruits to UI
        this.populateFruitUI();
        
        // Update fruit details for the initially selected fruit
        this.updateFruitDetails();
        
        // Add event listener for the debug damage button
        const debugDamageButton = this.gameplayUI.querySelector('.debug-damage-button');
        if (debugDamageButton) {
            debugDamageButton.addEventListener('click', () => {
                if (this.player) {
                    // Deal enough damage to kill the player
                    this.player.takeDamage(this.player.health);
                }
            });
        }
    }
    
    /**
     * Populate the fruit UI with the player's selected fruits
     */
    populateFruitUI() {
        const fruitPowerList = this.gameplayUI.querySelector('.fruit-power-list');
        fruitPowerList.innerHTML = '';
        
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
                
                fruitPowerList.appendChild(fruitItem);
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
                
                fruitPowerList.appendChild(fruitItem);
            });
        }
    }
    
    /**
     * Update the fruit details panel
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
                <div class="attack-name">${attackName}</div>
                <div class="attack-info">
                    <span class="attack-damage">DMG: ${fruitData.damageValues[attackType]}</span>
                    <span class="attack-cooldown">
                        ${showCooldown}
                        <div class="cooldown-bar">
                            <div class="cooldown-fill" style="width: ${cooldownPercent}%"></div>
                        </div>
                    </span>
                </div>
            `;
            
            detailsAttacks.appendChild(attackItem);
        });
    }
    
    /**
     * Update the fruit UI with current uses and cooldowns
     */
    updateFruitUI() {
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
     * Select a fruit by index
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
     * Get emoji for fruit type
     */
    getFruitEmoji(type) {
        const emojiMap = {
            'flame': '🔥',
            'ice': '❄️',
            'bomb': '💣',
            'light': '✨',
            'magma': '🌋'
        };
        
        return emojiMap[type] || '🍎';
    }
    
    /**
     * Create enemies and boss
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
        
        // Create some regular enemies at positions closer to the center of the island
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 8 + Math.random() * 6; // Reduced radius to bring enemies closer
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const enemy = new Enemy(this.engine, {
                name: `Villain ${i+1}`,
                health: 50 + i * 10
            });
            
            enemy.setPosition(x, 0, z);
            this.enemies.push(enemy);
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
    }

    /**
     * Update the gameplay state
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update the player
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy) enemy.update(deltaTime);
        });
        
        // Update boss if exists
        if (this.boss) {
            this.boss.update(deltaTime);
        }
        
        // Update camera to follow player
        this.updateCamera();
        
        // Update fruit store cooldowns
        fruitStore.updateCooldowns(deltaTime);
        
        // Update fruit UI
        this.updateFruitUI();
        
        // Handle input for fruit selection (1-5 keys)
        for (let i = 1; i <= 5; i++) {
            if (this.engine.input.isKeyPressed(`Digit${i}`) || this.engine.input.isKeyPressed(`Numpad${i}`)) {
                this.selectFruit(i - 1);
            }
        }
    }
    
    /**
     * Update camera for isometric view with mouse control for navigation
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
        
        // Mouse-based camera panning
        // Only when mouse is at screen edges
        const mousePos = input.getMousePosition();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Mouse edges detection for map navigation (edge panning)
        const edgeThreshold = 50; // pixels from the edge
        const panSpeed = 0.2 * this.engine.time.deltaTime;
        
        // Panning at screen edges
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
        const maxOffset = 40; // Increased from 20 to 40 for larger area
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
     * Exit gameplay state
     */
    exit() {
        super.exit();
        
        // Stop the background music
        this.stopBackgroundMusic();
        
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
     * Handle player death (game over)
     */
    onPlayerDeath() {
        console.log("Game Over!");
        
        // Create game over popup
        const gameOverPopup = document.createElement('div');
        gameOverPopup.className = 'game-over-popup';
        
        gameOverPopup.innerHTML = `
            <div class="game-over-container">
                <h2>GAME OVER</h2>
                <p>You were defeated!</p>
                <button class="restart-button">Try Again</button>
                <button class="menu-button">Main Menu</button>
            </div>
        `;
        
        // Add styles for game over popup
        const style = document.createElement('style');
        style.textContent = `
            .game-over-popup {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 1000;
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
            
            .game-over-container {
                background: linear-gradient(to bottom, #500, #300);
                border-radius: 15px;
                padding: 30px;
                width: 400px;
                text-align: center;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                animation: slideIn 0.4s ease-out;
                border: 2px solid #700;
                color: white;
            }
            
            .game-over-container h2 {
                font-size: 36px;
                margin-bottom: 15px;
                color: #ff3333;
                text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
            }
            
            .game-over-container p {
                font-size: 18px;
                margin-bottom: 25px;
            }
            
            .restart-button, .menu-button {
                padding: 12px 25px;
                font-size: 16px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: bold;
                margin: 0 10px;
                box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            }
            
            .restart-button {
                background-color: #ff5500;
                color: white;
            }
            
            .restart-button:hover {
                background-color: #ff7700;
                transform: translateY(-2px);
            }
            
            .menu-button {
                background-color: #333;
                color: white;
            }
            
            .menu-button:hover {
                background-color: #555;
                transform: translateY(-2px);
            }
        `;
        
        // Add to the UI container
        this.uiContainer.appendChild(style);
        this.uiContainer.appendChild(gameOverPopup);
        
        // Stop background music
        this.pauseBackgroundMusic();
        
        // Add event listeners for buttons
        const restartButton = gameOverPopup.querySelector('.restart-button');
        const menuButton = gameOverPopup.querySelector('.menu-button');
        
        restartButton.addEventListener('click', () => {
            // Remove the game over popup
            if (gameOverPopup.parentNode) {
                gameOverPopup.parentNode.removeChild(gameOverPopup);
            }
            
            // Restart the gameplay state
            this.engine.stateManager.changeState('gameplay');
        });
        
        menuButton.addEventListener('click', () => {
            // Remove the game over popup
            if (gameOverPopup.parentNode) {
                gameOverPopup.parentNode.removeChild(gameOverPopup);
            }
            
            // Return to the main menu
            this.engine.stateManager.changeState('menu');
        });
    }
}