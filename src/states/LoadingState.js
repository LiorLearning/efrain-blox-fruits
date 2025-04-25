/**
 * Loading state for asset loading and initialization
 */
import { BaseState } from './BaseState.js';

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
        
        // Initialize resource system
        this.engine.resources.init();
        
        // Set up loading callbacks
        this.engine.resources.setCallbacks(
            this.onProgress.bind(this),
            this.onComplete.bind(this),
            this.onError.bind(this)
        );
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
        
        // Define resources to load
        const resources = {
            textures: [
                // Example textures to load
                // { name: 'grass', path: 'assets/textures/grass.jpg' },
                // { name: 'water', path: 'assets/textures/water.jpg' }
            ],
            models: [
                // Example models to load
                // { name: 'player', path: 'assets/models/player.glb' },
                // { name: 'fruit', path: 'assets/models/fruit.glb' }
            ],
            sounds: [
                // Example sounds to load
                // { name: 'background', path: 'assets/sounds/background.mp3' },
                // { name: 'attack', path: 'assets/sounds/attack.mp3' }
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
        
        // Load actual resources
        this.engine.resources.loadResources(resources)
            .catch(error => {
                console.error('Error loading resources:', error);
                // Continue to menu even if some resources failed
                this.onComplete();
            });
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
        this.progressBar.style.width = `${progress * 100}%`;
        
        if (url) {
            // Extract filename from URL
            const filename = url.split('/').pop();
            this.loadingText.textContent = `Loading: ${filename}`;
        }
    }
    
    /**
     * Handle loading completion
     */
    onComplete() {
        this.progressBar.style.width = '100%';
        this.loadingText.textContent = 'Loading complete!';
        
        // Mark assets as loaded
        this.assetsLoaded = true;
    }
    
    /**
     * Handle loading error
     */
    onError(url) {
        console.error(`Failed to load: ${url}`);
        this.loadingText.textContent = `Error loading: ${url}`;
    }
    
    /**
     * Exit loading state
     */
    exit() {
        super.exit();
        
        // Hide loading screen
        this.loadingScreen.style.display = 'none';
    }
}