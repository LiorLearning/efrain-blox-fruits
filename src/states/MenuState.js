/**
 * Main menu state
 */
import { BaseState } from './BaseState.js';

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
        
        // Create menu scene
        this.createMenuScene();
    }
    
    /**
     * Create the 3D scene for the menu
     */
    createMenuScene() {
        // Create a simple scene with sea and islands
        const scene = this.engine.renderer.scene;
        
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
    }
    
    /**
     * Create islands for the world map
     */
    createIslands(scene) {
        const seas = this.engine.config.world.seas;
        
        // Create islands for each sea
        seas.forEach((sea, seaIndex) => {
            for (let i = 0; i < sea.islands; i++) {
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
            }
        });
    }
    
    /**
     * Create simple clouds for the menu scene
     */
    createClouds(scene) {
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
    }
    
    /**
     * Enter the menu state
     */
    enter(params = {}) {
        super.enter(params);
        
        // Create and show UI
        this.createUI();
        
        // Set camera position for menu view
        const camera = this.engine.renderer.camera;
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
        
        // Set up click handler for islands
        this.setupIslandSelection();
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
        `;
        
        this.uiContainer.appendChild(style);
        this.uiContainer.appendChild(this.menuUI);
    }
    
    /**
     * Set up island selection
     */
    setupIslandSelection() {
        const input = this.engine.input;
        
        // Add click event for raycasting
        this.clickHandler = () => {
            if (input.isMouseButtonPressed(0)) {
                this.checkIslandClick();
            }
        };
    }
    
    /**
     * Check if an island was clicked
     */
    checkIslandClick() {
        const renderer = this.engine.renderer;
        const input = this.engine.input;
        
        // Create raycaster
        const raycaster = new THREE.Raycaster();
        const mousePos = input.getMousePosition();
        
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
                console.log(`Island clicked: ${parent.userData.islandId}`);
                
                // Start fruit selection screen
                this.engine.stateManager.changeState('fruitSelect');
                break;
            }
        }
    }
    
    /**
     * Update the menu state
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Handle input
        this.handleInput();
        
        // Animate clouds or other elements
        if (this.engine.renderer.scene) {
            this.engine.renderer.scene.traverse((object) => {
                // Simple cloud animation
                if (object.geometry instanceof THREE.SphereGeometry) {
                    object.position.x += Math.sin(this.engine.time.getElapsedTime() * 0.1 + object.position.z) * 0.01;
                    object.position.z += Math.cos(this.engine.time.getElapsedTime() * 0.1 + object.position.x) * 0.01;
                }
            });
        }
    }
    
    /**
     * Handle input for menu
     */
    handleInput() {
        // Check for island clicks
        this.clickHandler();
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