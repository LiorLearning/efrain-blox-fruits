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
    }
    
    /**
     * Initialize the menu state
     */
    init() {
        super.init();
        
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
     * Create the 3D scene for the menu
     */
    createMenuScene() {
        // Create a simple scene with sea and islands
        const scene = this.engine.renderer.scene;
        
        if (!scene) {
            console.error("Scene not available in renderer");
            return;
        }
        
        try {
            // Add ocean plane
            const oceanGeometry = new THREE.PlaneGeometry(1000, 1000);
            const oceanMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x0077be,
                metalness: 0.1,
                roughness: 0.5
            });
            const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
            ocean.rotation.x = -Math.PI / 2; // Rotate to be horizontal
            ocean.position.y = -0.5;
            scene.add(ocean);
            
            // Create islands for each sea
            this.createIslands(scene);
            
            // Add simple clouds
            this.createClouds(scene);
        } catch (error) {
            console.error("Error in createMenuScene:", error);
        }
    }
    
    /**
     * Create islands for the world map
     */
    createIslands(scene) {
        if (!scene) return;
        
        try {
            const seas = this.engine.config.world.seas;
            
            // Create islands for each sea
            seas.forEach((sea, seaIndex) => {
                for (let i = 0; i < sea.islands; i++) {
                    try {
                        // Create a simple island
                        const islandGeometry = new THREE.CylinderGeometry(
                            2 + Math.random() * 0.5, // top radius
                            2.5 + Math.random() * 0.5, // bottom radius
                            1, // height
                            12, // radial segments
                            1, // height segments
                            false // open ended
                        );
                        
                        const islandMaterial = new THREE.MeshStandardMaterial({
                            color: sea.unlocked ? 0x7cfc00 : 0x708090, // Green if unlocked, gray if locked
                            metalness: 0.1,
                            roughness: 0.8
                        });
                        
                        const island = new THREE.Mesh(islandGeometry, islandMaterial);
                        
                        // Position the island based on sea and index
                        const angle = (i / sea.islands) * Math.PI * 2;
                        const radius = 15 + seaIndex * 12;
                        island.position.x = Math.cos(angle) * radius;
                        island.position.z = Math.sin(angle) * radius;
                        island.position.y = 0; // At water level
                        
                        scene.add(island);
                        
                        // If this is the first island of the first sea, make it interactive
                        if (seaIndex === 0 && i === 0) {
                            island.userData.isInteractive = true;
                            island.userData.islandId = `sea${seaIndex}_island${i}`;
                            
                            // Add a highlight to show it's selectable
                            const highlightGeometry = new THREE.RingGeometry(3, 3.2, 32);
                            const highlightMaterial = new THREE.MeshBasicMaterial({ 
                                color: 0xffff00,
                                side: THREE.DoubleSide
                            });
                            const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
                            highlight.rotation.x = -Math.PI / 2; // Rotate to be horizontal
                            highlight.position.y = 0.6; // Slightly above the island
                            island.add(highlight);
                        }
                    } catch (error) {
                        console.error("Error creating island:", error);
                    }
                }
            });
        } catch (error) {
            console.error("Error in createIslands:", error);
        }
    }
    
    /**
     * Create simple clouds for the menu scene
     */
    createClouds(scene) {
        if (!scene) return;
        
        try {
            for (let i = 0; i < 10; i++) {
                const cloudGeometry = new THREE.SphereGeometry(2, 8, 8);
                const cloudMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.7,
                    roughness: 1.0
                });
                
                const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
                
                // Random position
                cloud.position.x = (Math.random() - 0.5) * 50;
                cloud.position.y = 15 + Math.random() * 5;
                cloud.position.z = (Math.random() - 0.5) * 50;
                
                // Random scale
                const scale = 1 + Math.random() * 2;
                cloud.scale.set(scale, 0.7, scale);
                
                scene.add(cloud);
            }
        } catch (error) {
            console.error("Error in createClouds:", error);
        }
    }
    
    /**
     * Enter the menu state
     */
    enter(params = {}) {
        super.enter(params);
        
        // Create and show UI
        this.createUI();
        
        try {
            // Set background texture
            const backgroundTexture = this.engine.resources.getTexture('background');
            if (backgroundTexture && this.engine.renderer.scene) {
                this.engine.renderer.scene.background = backgroundTexture;
            }
            
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
            
            // Set up click handler for islands
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
            <div class="menu-title">Blok Fruits</div>
            <div class="menu-subtitle">A Fruit Adventure Game</div>
            <div class="menu-instructions">Click on the glowing island to start your adventure!</div>
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