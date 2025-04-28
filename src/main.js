/**
 * Main entry point for the Blox Fruits game
 */
import { Engine } from './core/Engine.js';
import { config } from './config.js';
// Import THREE from our utility file that exposes it globally
import THREE from './lib/three.js';


// Function to initialize the game
function initGame() {
    
    // Create the game engine
    const engine = new Engine(config);
    
    // Start the game
    engine.init();
    engine.start();
    
    // Set up event listeners
    window.addEventListener('resize', () => {
        engine.resize(window.innerWidth, window.innerHeight);
    });
    
    // Add debug mode toggle
    window.addEventListener('keydown', (event) => {
        if (event.code === 'KeyD' && event.ctrlKey) {
            engine.renderer.toggleDebugMode();
        }
    });
    
}

// Initialize the game immediately
initGame();