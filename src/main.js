/**
 * Main entry point for the Blok Fruits game
 */
import { Engine } from './core/Engine.js';
import { config } from './config.js';

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

// Initialize the game immediately - THREE should already be loaded
// by the time this module is executed
if (window.THREE) {
    console.log('THREE is already available');
    initGame();
} else {
    console.error('THREE is not available! This should not happen with the new loading approach.');
    
    // As a fallback, try checking again
    const waitForThree = setInterval(() => {
        if (window.THREE) {
            console.log('THREE became available after delay');
            clearInterval(waitForThree);
            initGame();
        }
    }, 100);
    
    // Give up after 5 seconds
    setTimeout(() => {
        clearInterval(waitForThree);
        console.error('Failed to load THREE.js after 5 seconds');
        alert('Failed to load THREE.js. Please try refreshing the page.');
    }, 5000);
}