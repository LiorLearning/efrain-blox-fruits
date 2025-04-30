/**
 * Loading state for asset loading and initialization
 */
import { BaseState } from './BaseState.js';

// Direct path to resources without CORS proxy
// const BASE_PATH = 'https://mathkraft-games.s3.us-east-1.amazonaws.com/efrain/blox-fruits';
const BASE_PATH = './assets';

export class LoadingState extends BaseState {
    constructor(engine) {
        super(engine);
        
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.querySelector('.progress');
        this.loadingText = document.querySelector('.loading-text');
        
        this.assetsLoaded = false;
        this.minDisplayTime = 1.5; // Minimum time to show the loading screen (seconds)
        this.displayTimer = 0;
    }
    
    /**
     * Initialize the loading state
     */
    init() {
        super.init();
        
        // Ensure THREE is defined before initializing resources
        if (window.THREE) {
            // Initialize resource system
            this.engine.resources.init();
            
            // Set up loading callbacks
            this.engine.resources.setCallbacks(
                this.onProgress.bind(this),
                this.onComplete.bind(this),
                this.onError.bind(this)
            );
        } else {
            console.error("THREE is not defined yet. This should not happen.");
            // Force complete loading to avoid being stuck
            setTimeout(() => {
                this.onComplete();
            }, 1000);
        }
    }
    
    /**
     * Enter the loading state
     */
    enter(params = {}) {
        super.enter(params);
        
        // Show loading screen
        this.loadingScreen.style.display = 'flex';
        this.progressBar.style.width = '0%';
        this.loadingText.textContent = 'Loading...';
        
        // Reset flags and timer
        this.assetsLoaded = false;
        this.displayTimer = 0;
        
        // Define resources to load with corrected paths
        // Ensure proper casing in file names
        const resources = {
            textures: [
                // Load background texture
                { name: 'background', path: `${BASE_PATH}/models/background.png` },
                // Load player texture
                { name: 'player', path: `${BASE_PATH}/models/entities/Player.png` },
                // Load villain texture
                { name: 'villain', path: `${BASE_PATH}/models/entities/villian.png` },
                // Load boss texture
                { name: 'boss', path: `${BASE_PATH}/models/entities/boss.png` },
                // Load all fruit textures
                { name: 'flameFruit', path: `${BASE_PATH}/models/fruits/FlameFruit.png` },
                { name: 'iceFruit', path: `${BASE_PATH}/models/fruits/IceFruit.png` },
                { name: 'bombFruit', path: `${BASE_PATH}/models/fruits/BombFruit.png` },
                { name: 'lightFruit', path: `${BASE_PATH}/models/fruits/LightFruit.png` },
                { name: 'magmaFruit', path: `${BASE_PATH}/models/fruits/MagmaFruit.png` }
            ],
            models: [],
            sounds: [
                // Load background music
                { name: 'bgMusic', path: `${BASE_PATH}/sounds/bg-music.mpeg` },
                // Load drop sound effect
                { name: 'dropSound', path: `${BASE_PATH}/sounds/drop.mp3` }
            ]
        };
        
        // Start loading resources
        setTimeout(() => {
            this.loadResources(resources);
        }, 500); // Small delay to ensure UI is ready
    }
    
    /**
     * Load game resources
     */
    loadResources(resources) {
        
        // If there are no resources to load, simulate loading
        if (resources.textures.length === 0 && 
            resources.models.length === 0 && 
            resources.sounds.length === 0) {
                
            // Simulate loading progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += 0.1;
                this.onProgress(null, progress * 10, 10, progress);
                
                if (progress >= 1) {
                    clearInterval(interval);
                    this.onComplete();
                }
            }, 150);
            
            return;
        }
        
        try {
            
            // Check if some resources may be missing and log it
            resources.textures.forEach(texture => {
                const img = new Image();
                img.onerror = () => console.error(`Texture does not exist: ${texture.path}`);
                img.src = texture.path;
            });
            
            // Load actual resources
            this.engine.resources.loadResources(resources)
                .then(() => {
                    this.onComplete();
                })
                .catch(error => {
                    console.error('Error loading resources:', error);
                    // Continue to menu even if some resources failed
                    this.onComplete();
                });
        } catch (e) {
            console.error('Exception during resource loading:', e);
            // Force complete loading in case of error
            this.onComplete();
        }
    }
    
    /**
     * Update loading state
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // If assets are loaded, count display timer
        if (this.assetsLoaded) {
            this.displayTimer += deltaTime;
            
            // Once minimum display time is reached, proceed to menu
            if (this.displayTimer >= this.minDisplayTime) {
                this.engine.stateManager.changeState('menu');
            }
        }
    }
    
    /**
     * Handle loading progress
     */
    onProgress(url, itemsLoaded, itemsTotal, progress) {
        if (this.progressBar) {
            this.progressBar.style.width = `${progress * 100}%`;
        }
        
        if (url && this.loadingText) {
            // Extract filename from URL
            const filename = url.split('/').pop();
            this.loadingText.textContent = `Loading: ${filename}`;
        }
    }
    
    /**
     * Handle loading completion
     */
    onComplete() {
        if (this.progressBar) {
            this.progressBar.style.width = '100%';
        }
        
        if (this.loadingText) {
            this.loadingText.textContent = 'Loading complete!';
        }
        
        
        // Mark assets as loaded
        this.assetsLoaded = true;
        
        // Force transition to menu state after a short delay
        // This is a failsafe in case the regular transition doesn't happen
        setTimeout(() => {
            if (this.engine.stateManager.getCurrentState() === 'loading') {
                this.engine.stateManager.changeState('menu');
            }
        }, 2000);
    }
    
    /**
     * Handle loading error
     */
    onError(url) {
        console.error(`Failed to load: ${url}`);
        if (this.loadingText) {
            this.loadingText.textContent = `Error loading: ${url}`;
        }
    }
    
    /**
     * Exit loading state
     */
    exit() {
        super.exit();
        
        // Hide loading screen
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
    }
}