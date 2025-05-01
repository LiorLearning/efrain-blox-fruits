/**
 * Main game engine class
 */
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { Resources } from './Resources.js';
import { Time } from './Time.js';
import { StateManager } from '../states/StateManager.js';
import { LoadingState } from '../states/LoadingState.js';
import { MenuState } from '../states/MenuState.js';
import { FruitSelectState } from '../states/FruitSelectState.js';
import { GameplayState } from '../states/GameplayState.js';
import audioManager from '../lib/AudioManager.js';

export class Engine {
    constructor(config) {
        this.config = config;
        this.isRunning = false;
        this.canvas = document.getElementById('game-canvas');
        this.uiContainer = document.getElementById('ui-container');
        
        // Initialize core systems
        this.renderer = new Renderer(this.canvas, config.renderer);
        this.input = new Input(this.canvas);
        this.resources = new Resources();
        this.time = new Time();
        
        // Initialize state manager
        this.stateManager = new StateManager();
        
        // Register game states
        this.stateManager.registerState('loading', new LoadingState(this));
        this.stateManager.registerState('menu', new MenuState(this));
        this.stateManager.registerState('fruitSelect', new FruitSelectState(this));
        this.stateManager.registerState('gameplay', new GameplayState(this));
        
        // Sound settings
        this.soundEnabled = true;
        
        // Event handling
        this._setupEventListeners();
    }
    
    /**
     * Initialize the game engine
     */
    init() {
        
        // Transition to loading state
        this.stateManager.changeState('loading');
        
        // Initialize renderer
        this.renderer.init();
        
        // Initialize audio manager
        if (this.renderer.camera) {
            audioManager.init(this.renderer.camera);
        }
        
        // Handle window resize
        window.addEventListener('resize', () => this._onResize());
        this._onResize();
    }
    
    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.time.reset();
        this._gameLoop();
        
    }
    
    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
    }
    
    /**
     * Main game loop
     */
    _gameLoop() {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.time.update();
        
        // Update current state
        this.stateManager.update(this.time.deltaTime);
        
        // Render the scene
        this.renderer.render();
        
        // Process input after frame is complete
        this.input.update();
        
        // Request next frame
        requestAnimationFrame(() => this._gameLoop());
    }
    
    /**
     * Handle window resize
     */
    _onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.config.renderer.width = width;
        this.config.renderer.height = height;
        
        this.renderer.resize(width, height);
    }
    
    /**
     * Resize the game view
     */
    resize(width, height) {
        this.config.renderer.width = width;
        this.config.renderer.height = height;
        
        this.renderer.resize(width, height);
    }
    
    /**
     * Set up event listeners
     */
    _setupEventListeners() {
        window.addEventListener('resize', () => {
            this._onResize();
        });
        
        // Set up sound toggle
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                this.toggleSound();
            });
        }
    }
    
    /**
     * Toggle sound on/off
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        
        // Update audio manager sound state
        audioManager.setSoundEnabled(this.soundEnabled);
        
        // Update the sound toggle button UI
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            if (this.soundEnabled) {
                soundToggle.classList.remove('muted');
                soundToggle.querySelector('i').className = 'fas fa-volume-high';
            } else {
                soundToggle.classList.add('muted');
                soundToggle.querySelector('i').className = 'fas fa-volume-xmark';
            }
        }
    }
    
    /**
     * Clean up resources when the game is closed
     */
    destroy() {
        this.stop();
        this.input.destroy();
        this.renderer.destroy();
        
        // Stop any playing audio
        audioManager.stopBackgroundMusic();
        
        // Remove event listeners
        window.removeEventListener('resize', this._onResize);
    }
}