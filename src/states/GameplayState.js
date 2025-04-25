/**
 * Main gameplay state
 */
import { BaseState } from './BaseState.js';

export class GameplayState extends BaseState {
    constructor(engine) {
        super(engine);
        
        this.uiContainer = document.getElementById('ui-container');
        this.gameplayUI = null;
        
        this.player = null;
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
        // Create a simple player representation
        const playerGroup = new THREE.Group();
        
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
        
        // Add player to scene
        this.engine.renderer.scene.add(playerGroup);
        
        // Store player reference
        this.player = playerGroup;
        this.player.position.y = 0.75; // Above ground
    }
    
    /**
     * Set up camera to follow player
     */
    setupCamera() {
        // Set camera position
        const camera = this.engine.renderer.camera;
        camera.position.set(0, 7, 12);
        
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
                fruitItem.textContent = this.getFruitEmoji(fruit.type);
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
                fruitItem.textContent = this.getFruitEmoji(type);
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
     * Update the gameplay state
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update player movement
        this.updatePlayerMovement(deltaTime);
        
        // Update camera to follow player
        this.updateCamera();
    }
    
    /**
     * Update player movement based on input
     */
    updatePlayerMovement(deltaTime) {
        if (!this.player) return;
        
        const input = this.engine.input;
        const speed = this.engine.config.player.speed * deltaTime;
        
        // Get movement direction
        let moveX = 0;
        let moveZ = 0;
        
        if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) {
            moveZ -= speed;
        }
        
        if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) {
            moveZ += speed;
        }
        
        if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) {
            moveX -= speed;
        }
        
        if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) {
            moveX += speed;
        }
        
        // Apply movement
        if (moveX !== 0 || moveZ !== 0) {
            this.player.position.x += moveX;
            this.player.position.z += moveZ;
            
            // Rotate player to face movement direction
            if (moveX !== 0 || moveZ !== 0) {
                const angle = Math.atan2(moveX, moveZ);
                this.player.rotation.y = angle;
            }
        }
        
        // Keep player within island bounds
        const distanceFromCenter = Math.sqrt(
            this.player.position.x * this.player.position.x + 
            this.player.position.z * this.player.position.z
        );
        
        if (distanceFromCenter > 29) {
            // Player is too close to edge, push back
            const angle = Math.atan2(this.player.position.x, this.player.position.z);
            this.player.position.x = Math.sin(angle) * 29;
            this.player.position.z = Math.cos(angle) * 29;
        }
    }
    
    /**
     * Update camera to follow player
     */
    updateCamera() {
        if (!this.player) return;
        
        const camera = this.engine.renderer.camera;
        
        // Calculate target position (behind and above player)
        const offset = new THREE.Vector3(
            -Math.sin(this.player.rotation.y) * 8,
            7,
            -Math.cos(this.player.rotation.y) * 8
        );
        
        // Smoothly move camera
        camera.position.lerp(
            new THREE.Vector3(
                this.player.position.x + offset.x,
                this.player.position.y + offset.y,
                this.player.position.z + offset.z
            ),
            0.1
        );
        
        // Look at player
        camera.lookAt(
            this.player.position.x,
            this.player.position.y + 1.5,
            this.player.position.z
        );
    }
    
    /**
     * Exit gameplay state
     */
    exit() {
        super.exit();
        
        // Remove UI
        this.removeUI();
        
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