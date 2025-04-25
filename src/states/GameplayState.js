/**
 * Main gameplay state
 */
import { BaseState } from './BaseState.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { MiniBoss } from '../entities/MiniBoss.js';

export class GameplayState extends BaseState {
    constructor(engine) {
        super(engine);
        
        this.uiContainer = document.getElementById('ui-container');
        this.gameplayUI = null;
        
        this.player = null;
        this.enemies = [];
        this.boss = null;
        this.currentIsland = null;
    }
    
    /**
     * Initialize the gameplay state
     */
    init() {
        super.init();
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
        }
        
        // Create island ground
        const groundGeometry = new THREE.CylinderGeometry(30, 30, 2, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x7cfc00, // Green
            metalness: 0.1,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = -1; // Half below "sea level"
        scene.add(ground);
        
        // Create water around island
        const waterGeometry = new THREE.RingGeometry(30, 100, 32);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x0077be, // Blue
            metalness: 0.1,
            roughness: 0.5
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2; // Flat
        water.position.y = -0.5; // Water level
        scene.add(water);
        
        // Create some basic environment elements
        this.addEnvironmentElements(scene);
    }
    
    /**
     * Add environment elements to the scene
     */
    addEnvironmentElements(scene) {
        // Add some trees
        for (let i = 0; i < 15; i++) {
            const treeGroup = new THREE.Group();
            
            // Tree trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 3, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513, // Brown
                roughness: 0.8
            });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 1.5; // Half height
            treeGroup.add(trunk);
            
            // Tree leaves
            const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
            const leavesMaterial = new THREE.MeshStandardMaterial({
                color: 0x2e8b57, // Forest green
                roughness: 0.7
            });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.y = 5; // Above trunk
            treeGroup.add(leaves);
            
            // Position around island
            const angle = Math.random() * Math.PI * 2;
            const radius = 15 + Math.random() * 10;
            treeGroup.position.x = Math.cos(angle) * radius;
            treeGroup.position.z = Math.sin(angle) * radius;
            
            scene.add(treeGroup);
        }
        
        // Add some rocks
        for (let i = 0; i < 10; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(1 + Math.random() * 1.5, 0);
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: 0x808080, // Gray
                roughness: 0.9
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 20;
            rock.position.x = Math.cos(angle) * radius;
            rock.position.z = Math.sin(angle) * radius;
            rock.position.y = 0.5; // Half in ground
            
            // Random rotation
            rock.rotation.x = Math.random() * Math.PI;
            rock.rotation.y = Math.random() * Math.PI;
            rock.rotation.z = Math.random() * Math.PI;
            
            scene.add(rock);
        }
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
     * Set up camera to follow player in isometric view
     */
    setupCamera() {
        // Set camera position for isometric view
        const camera = this.engine.renderer.camera;
        
        // Position camera for isometric view (positioned diagonally above the player)
        camera.position.set(15, 15, 15);
        camera.lookAt(0, 0, 0); // Look at the center of the scene
        
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
            </div>
            <div class="game-controls">
                <div class="controls-info">
                    <p>WASD or Arrow Keys: Move</p>
                    <p>Space: Jump</p>
                    <p>1-5: Select Fruit</p>
                    <p>Left Click: Basic Attack</p>
                    <p>Right Click: Special Attack</p>
                    <p>Shift + Click: Ultimate Attack</p>
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
                width: 300px;
            }
            
            .fruit-power-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .fruit-power-list {
                display: flex;
                gap: 10px;
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
            }
            
            .fruit-power-item.active {
                background-color: rgba(255, 215, 0, 0.4);
                border: 2px solid gold;
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
        const fruitPowerList = this.gameplayUI.querySelector('.fruit-power-list');
        
        if (this.engine.playerFruits && this.engine.playerFruits.length > 0) {
            this.engine.playerFruits.forEach((fruit, index) => {
                const fruitItem = document.createElement('div');
                fruitItem.className = 'fruit-power-item';
                fruitItem.innerHTML = `<img src="assets/models/fruits/${fruit.type.charAt(0).toUpperCase() + fruit.type.slice(1)}Fruit.png" alt="${fruit.name}" style="width: 40px; height: 40px; object-fit: contain;">`;
                fruitItem.dataset.fruitIndex = index;
                
                if (index === 0) {
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
                fruitItem.innerHTML = `<img src="assets/models/fruits/${type.charAt(0).toUpperCase() + type.slice(1)}Fruit.png" alt="${type}" style="width: 40px; height: 40px; object-fit: contain;">`;
                fruitItem.dataset.fruitIndex = index;
                
                if (index === 0) {
                    fruitItem.classList.add('active');
                }
                
                fruitPowerList.appendChild(fruitItem);
            });
        }
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
        
        // Create some regular enemies at random positions around the island
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 15; // Random position on the island
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const enemy = new Enemy(this.engine, {
                name: `Villain ${i+1}`,
                health: 50 + i * 10
            });
            
            enemy.setPosition(x, 0, z);
            this.enemies.push(enemy);
        }
        
        // Create a boss at the far end of the island
        this.boss = new MiniBoss(this.engine, {
            name: 'Island Boss',
            health: 200,
            abilities: [
                { name: 'shockwave', power: 30 },
                { name: 'teleport', power: 0 },
                { name: 'fireBlast', power: 40 }
            ]
        });
        
        // Position the boss at the far end of the island
        this.boss.setPosition(0, 0, -25);
    }

    /**
     * Update the gameplay state
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update player movement
        this.updatePlayerMovement(deltaTime);
        
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy) enemy.update(deltaTime);
        });
        
        // Update boss
        if (this.boss) {
            this.boss.update(deltaTime);
        }
        
        // Update camera to follow player
        this.updateCamera();
    }
    
    /**
     * Update player movement based on input
     */
    updatePlayerMovement(deltaTime) {
        if (!this.player) return;
        
        // Player entity now handles its own movement
        this.player.update(deltaTime);
    }
    
    /**
     * Update camera to follow player in isometric view
     */
    updateCamera() {
        if (!this.player) return;
        
        const camera = this.engine.renderer.camera;
        
        // Calculate isometric camera position relative to player
        // This maintains a fixed angle isometric view while following the player
        const offsetX = 15;
        const offsetY = 15;
        const offsetZ = 15;
        
        // Get player position
        const playerPosition = this.player.getPosition();
        if (!playerPosition) return;
        
        // Calculate target camera position
        const targetPosition = new THREE.Vector3(
            playerPosition.x + offsetX,
            playerPosition.y + offsetY,
            playerPosition.z + offsetZ
        );
        
        // Smoothly move camera (lower value = slower camera)
        camera.position.lerp(targetPosition, 0.05);
        
        // Look at player's position with slight offset for better view
        camera.lookAt(
            playerPosition.x,
            playerPosition.y + 1, // Look slightly above player's feet
            playerPosition.z
        );
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
}