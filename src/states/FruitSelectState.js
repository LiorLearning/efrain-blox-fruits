/**
 * Fruit selection state
 */
import { BaseState } from './BaseState.js';

export class FruitSelectState extends BaseState {
    constructor(engine) {
        super(engine);
        
        this.uiContainer = document.getElementById('ui-container');
        this.fruitSelectUI = null;
        
        this.selectedFruits = [];
        this.maxSelections = 5;
    }
    
    /**
     * Initialize the fruit selection state
     */
    init() {
        super.init();
        
        // Set up scene for fruit display
        this.setupFruitScene();
    }
    
    /**
     * Set up the scene for displaying fruits
     */
    setupFruitScene() {
        // In a full implementation, this would create 3D models for each fruit
        // For this basic setup, we'll just have a placeholder
    }
    
    /**
     * Enter the fruit selection state
     */
    enter(params = {}) {
        super.enter(params);
        
        // Reset selected fruits
        this.selectedFruits = [];
        
        // Create and show UI
        this.createUI();
        
        // Set camera for fruit view
        const camera = this.engine.renderer.camera;
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);
    }
    
    /**
     * Create fruit selection UI
     */
    createUI() {
        // Create fruit selection UI
        this.fruitSelectUI = document.createElement('div');
        this.fruitSelectUI.className = 'fruit-select-ui';
        
        // Basic UI structure
        this.fruitSelectUI.innerHTML = `
            <div class="fruit-select-header">Choose Your Fruits</div>
            <div class="fruit-select-subtitle">Select 5 fruits to begin your adventure</div>
            <div class="fruit-selection-count">Selected: 0/5</div>
            <div class="fruit-grid"></div>
            <button class="start-button" disabled>Start Adventure</button>
        `;
        
        // Add some basic styling
        const style = document.createElement('style');
        style.textContent = `
            .fruit-select-ui {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                user-select: none;
            }
            
            .fruit-select-header {
                font-size: 36px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .fruit-select-subtitle {
                font-size: 18px;
                margin-bottom: 20px;
            }
            
            .fruit-selection-count {
                font-size: 24px;
                margin-bottom: 20px;
            }
            
            .fruit-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .fruit-item {
                width: 120px;
                height: 150px;
                background-color: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .fruit-item:hover {
                background-color: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            
            .fruit-item.selected {
                background-color: rgba(255, 215, 0, 0.3);
                border-color: gold;
            }
            
            .fruit-icon {
                width: 64px;
                height: 64px;
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
            }
            
            .fruit-name {
                font-size: 16px;
                font-weight: bold;
            }
            
            .fruit-power {
                font-size: 14px;
                color: #aaa;
            }
            
            .start-button {
                padding: 12px 24px;
                font-size: 18px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .start-button:hover:not([disabled]) {
                background-color: #45a049;
                transform: scale(1.05);
            }
            
            .start-button[disabled] {
                background-color: #aaa;
                cursor: not-allowed;
            }
        `;
        
        this.uiContainer.appendChild(style);
        this.uiContainer.appendChild(this.fruitSelectUI);
        
        // Add fruit options to the grid
        const fruitGrid = this.fruitSelectUI.querySelector('.fruit-grid');
        const fruits = this.engine.config.fruits;
        
        fruits.forEach((fruit, index) => {
            const fruitItem = document.createElement('div');
            fruitItem.className = 'fruit-item';
            fruitItem.dataset.fruitIndex = index;
            
            fruitItem.innerHTML = `
                <div class="fruit-icon">${this.getFruitEmoji(fruit.type)}</div>
                <div class="fruit-name">${fruit.name}</div>
                <div class="fruit-power">Power: ${fruit.power}</div>
            `;
            
            fruitItem.addEventListener('click', () => this.toggleFruitSelection(fruitItem, fruit));
            
            fruitGrid.appendChild(fruitItem);
        });
        
        // Add start button handler
        const startButton = this.fruitSelectUI.querySelector('.start-button');
        startButton.addEventListener('click', () => {
            if (this.selectedFruits.length === this.maxSelections) {
                // Store selected fruits for gameplay
                this.engine.playerFruits = this.selectedFruits;
                
                // Transition to gameplay state
                this.engine.stateManager.changeState('gameplay');
            }
        });
    }
    
    /**
     * Get emoji for fruit type
     */
    getFruitEmoji(type) {
        const emojiMap = {
            'flame': '🔥',
            'ice': '❄️',
            'bomb': '💣',
            'light': '✨',
            'magma': '🌋'
        };
        
        return emojiMap[type] || '🍎';
    }
    
    /**
     * Toggle fruit selection
     */
    toggleFruitSelection(element, fruit) {
        // Check if already selected
        const isSelected = element.classList.contains('selected');
        const index = this.selectedFruits.findIndex(f => f.name === fruit.name);
        
        if (isSelected) {
            // Deselect
            element.classList.remove('selected');
            
            if (index !== -1) {
                this.selectedFruits.splice(index, 1);
            }
        } else {
            // Check if max selected
            if (this.selectedFruits.length >= this.maxSelections) {
                // Find the first selected fruit and deselect it
                const firstSelected = this.fruitSelectUI.querySelector('.fruit-item.selected');
                if (firstSelected) {
                    firstSelected.classList.remove('selected');
                    this.selectedFruits.shift(); // Remove first fruit
                }
            }
            
            // Select this fruit
            element.classList.add('selected');
            this.selectedFruits.push(fruit);
        }
        
        // Update selection count
        const countElement = this.fruitSelectUI.querySelector('.fruit-selection-count');
        countElement.textContent = `Selected: ${this.selectedFruits.length}/${this.maxSelections}`;
        
        // Enable/disable start button
        const startButton = this.fruitSelectUI.querySelector('.start-button');
        startButton.disabled = this.selectedFruits.length !== this.maxSelections;
    }
    
    /**
     * Update the fruit selection state
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Rotate fruit displays or other animations
    }
    
    /**
     * Exit fruit selection state
     */
    exit() {
        super.exit();
        
        // Remove UI
        this.removeUI();
    }
    
    /**
     * Remove fruit selection UI
     */
    removeUI() {
        if (this.fruitSelectUI && this.fruitSelectUI.parentNode) {
            this.fruitSelectUI.parentNode.removeChild(this.fruitSelectUI);
        }
    }
}