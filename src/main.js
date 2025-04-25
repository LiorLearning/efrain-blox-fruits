/**
 * Main entry point for the Blok Fruits game
 */
import { Engine } from './core/Engine.js';
import { config } from './config.js';

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen when all assets are loaded
    window.addEventListener('load', () => {
        // Create the game engine
        const engine = new Engine(config);
        
        // Start the game
        engine.init();
        engine.start();
        
        console.log('Blok Fruits game initialized!');
    });
});