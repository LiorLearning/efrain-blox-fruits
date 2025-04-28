/**
 * Main menu state
 */
import { BaseState } from './BaseState.js';
import * as THREE from 'three';

export class MenuState extends BaseState {
    constructor(engine) {
        super(engine);
        
        this.uiContainer = document.getElementById('ui-container');
        this.menuUI = null;
        
        // 3D scene elements for menu
        this.menuScene = null;
        
        // Background music
        this.bgMusic = null;
        this.audioListener = null;
    }
    
    /**
     * Initialize the menu state
     */
    init() {
        super.init();
        
        // Initialize audio
        this.setupAudio();
        
        try {
            // Create menu scene
            this.createMenuScene();
        } catch (error) {
            console.error("Error creating menu scene:", error);
            // Make sure we at least show the UI even if 3D fails
            this.createUI();
        }
    }
    
    /**
     * Set up audio for the menu
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
     * Create the 3D scene for the menu
     */
    createMenuScene() {
        // Use a simple empty scene with just the background image
        const scene = this.engine.renderer.scene;
        
        if (!scene) {
            console.error("Scene not available in renderer");
            return;
        }
        
        try {
            // Set background texture
            const backgroundTexture = this.engine.resources.getTexture('background');
            if (backgroundTexture) {
                scene.background = backgroundTexture;
            } else {
                console.warn("Background texture not found, using default sky color");
                scene.background = new THREE.Color(0x87CEEB); // Sky blue fallback
            }
            
            // Create an invisible plane for click detection
            const planeGeometry = new THREE.PlaneGeometry(100, 100);
            const planeMaterial = new THREE.MeshBasicMaterial({ 
                visible: false // Invisible click plane
            });
            const clickPlane = new THREE.Mesh(planeGeometry, planeMaterial);
            clickPlane.rotation.x = -Math.PI / 2; // Make it horizontal
            clickPlane.position.y = 0;
            clickPlane.userData.isInteractive = true;
            clickPlane.userData.islandId = 'sea0_island0'; // Default to first island
            scene.add(clickPlane);
        } catch (error) {
            console.error("Error in createMenuScene:", error);
        }
    }
    
    /**
     * Create islands for the world map
     */
    createIslands(scene) {
        // This method is kept empty as we're now using just the background image
        // but kept for compatibility with other code
    }
    
    /**
     * Create simple clouds for the menu scene
     */
    createClouds(scene) {
        // This method is kept empty as we're now using just the background image
        // but kept for compatibility with other code
    }
    
    /**
     * Enter the menu state
     */
    enter(params = {}) {
        super.enter(params);
        
        // Create and show UI
        this.createUI();
        
        // Start playing background music
        this.playBackgroundMusic();
        
        try {
            // Set camera position for menu view if available
            const camera = this.engine.renderer.camera;
            if (camera) {
                camera.position.set(0, 25, 35);
                camera.lookAt(0, 0, 0);
                
                // Set up orbit controls if available
                if (this.engine.renderer.controls) {
                    this.engine.renderer.controls.target.set(0, 0, 0);
                    this.engine.renderer.controls.maxDistance = 70;
                    this.engine.renderer.controls.minDistance = 20;
                    this.engine.renderer.controls.maxPolarAngle = Math.PI / 2.1; // Limit to just above horizon
                    this.engine.renderer.controls.update();
                }
            }
            
            // Set up click handler for interaction
            this.setupIslandSelection();
        } catch (error) {
            console.error("Error in MenuState.enter:", error);
        }
    }
    
    /**
     * Create menu UI
     */
    createUI() {
        // Create menu UI
        this.menuUI = document.createElement('div');
        this.menuUI.className = 'menu-ui';
        this.menuUI.innerHTML = `
            <div class="menu-title">Blox Fruits</div>
            <div class="menu-subtitle">A Fruit Adventure Game</div>
            <div class="menu-instructions">Click to start your adventure!</div>
        `;
        
        // Add some basic styling
        const style = document.createElement('style');
        style.textContent = `
            .menu-ui {
                position: absolute;
                top: 20px;
                left: 0;
                width: 100%;
                text-align: center;
                color: white;
                user-select: none;
                z-index: 10;
            }
            
            .menu-title {
                font-size: 48px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                margin-bottom: 10px;
            }
            
            .menu-subtitle {
                font-size: 24px;
                margin-bottom: 20px;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
            }
            
            .menu-instructions {
                font-size: 18px;
                margin-top: 20px;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 5px;
                display: inline-block;
            }
            
            /* Add start button for navigation without 3D */
            .start-button {
                display: inline-block;
                margin-top: 30px;
                padding: 15px 30px;
                background-color: #ff5500;
                color: white;
                font-size: 20px;
                font-weight: bold;
                border-radius: 8px;
                cursor: pointer;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;
                pointer-events: auto;
            }
            
            .start-button:hover {
                background-color: #ff7700;
                transform: translateY(-2px);
            }
        `;
        
        // Add a start button element that will work without 3D
        const startButtonDiv = document.createElement('div');
        startButtonDiv.innerHTML = '<div class="start-button">Start Adventure</div>';
        this.menuUI.appendChild(startButtonDiv);
        
        this.uiContainer.appendChild(style);
        this.uiContainer.appendChild(this.menuUI);
        
        // Add event listener to the start button
        const startButton = this.menuUI.querySelector('.start-button');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.engine.stateManager.changeState('fruitSelect');
            });
        }
    }
    
    /**
     * Set up island selection
     */
    setupIslandSelection() {
        const input = this.engine.input;
        
        // Add click event for raycasting
        this.clickHandler = () => {
            if (input && input.isMouseButtonPressed && input.isMouseButtonPressed(0)) {
                this.checkIslandClick();
            }
        };
    }
    
    /**
     * Check if an island was clicked
     */
    checkIslandClick() {
        try {
            const renderer = this.engine.renderer;
            const input = this.engine.input;
            
            if (!renderer || !input || !renderer.scene || !renderer.camera) {
                return;
            }
            
            // Create raycaster
            const raycaster = new THREE.Raycaster();
            const mousePos = input.getMousePosition();
            if (!mousePos) return;
            
            // Convert mouse position to normalized device coordinates
            const mouse = new THREE.Vector2(
                (mousePos.x / renderer.renderer.domElement.clientWidth) * 2 - 1,
                -(mousePos.y / renderer.renderer.domElement.clientHeight) * 2 + 1
            );
            
            // Update the raycaster
            raycaster.setFromCamera(mouse, renderer.camera);
            
            // Check for intersections
            const intersects = raycaster.intersectObjects(renderer.scene.children, true);
            
            for (let i = 0; i < intersects.length; i++) {
                const object = intersects[i].object;
                
                // Check if this is an interactive island
                let parent = object;
                while (parent && !parent.userData.isInteractive) {
                    parent = parent.parent;
                }
                
                if (parent && parent.userData.isInteractive) {
                    
                    // Start fruit selection screen
                    this.engine.stateManager.changeState('fruitSelect');
                    break;
                }
            }
        } catch (error) {
            console.error("Error in checkIslandClick:", error);
        }
    }
    
    /**
     * Update the menu state
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        try {
            // Handle input
            this.handleInput();
            
            // Animate clouds or other elements
            if (this.engine.renderer && this.engine.renderer.scene) {
                this.engine.renderer.scene.traverse((object) => {
                    try {
                        // Simple cloud animation
                        if (object.geometry instanceof THREE.SphereGeometry) {
                            object.position.x += Math.sin(this.engine.time.getElapsedTime() * 0.1 + object.position.z) * 0.01;
                            object.position.z += Math.cos(this.engine.time.getElapsedTime() * 0.1 + object.position.x) * 0.01;
                        }
                    } catch (e) {
                        // Ignore individual animation errors
                    }
                });
            }
        } catch (error) {
            console.error("Error in update:", error);
        }
    }
    
    /**
     * Handle input for menu
     */
    handleInput() {
        // Check for island clicks
        if (this.clickHandler) {
            this.clickHandler();
        }
    }
    
    /**
     * Exit menu state
     */
    exit() {
        super.exit();
        
        // Stop the background music
        this.stopBackgroundMusic();
        
        // Remove UI
        this.removeUI();
    }
    
    /**
     * Remove menu UI
     */
    removeUI() {
        if (this.menuUI && this.menuUI.parentNode) {
            this.menuUI.parentNode.removeChild(this.menuUI);
        }
    }
}