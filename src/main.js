/**
 * Main entry point for the Blok Fruits game
 */
import { Engine } from './core/Engine.js';
import { config } from './config.js';
// Import THREE from our utility file that exposes it globally
import THREE from './lib/three.js';

console.log('Game module loaded');

// Function to initialize the game
function initGame() {
    console.log('Initializing game with THREE version:', THREE.REVISION);
    
    // Create the game engine
    const engine = new Engine(config);
    
    // Start the game
    engine.init();
    engine.start();
    
    console.log('Blok Fruits game initialized!');
}

// Initialize the game immediately
initGame();