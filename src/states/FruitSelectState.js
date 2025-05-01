/**
 * Fruit selection state
 */
import { BaseState } from './BaseState.js';
import * as THREE from 'three';
import fruitStore from '../lib/FruitStore.js';
import audioManager from '../lib/AudioManager.js';

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
        
        // Ensure audio manager is initialized
        if (!audioManager.initialized && this.engine.renderer.camera) {
            audioManager.init(this.engine.renderer.camera);
        }
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
        
        // Reset the fruit store
        fruitStore.initialize();
        
        // Pre-select the first 5 fruits by default
        const fruits = this.engine.config.fruits;
        this.selectedFruits = fruits.slice(0, this.maxSelections);
        
        // Add selected fruits to the store
        this.selectedFruits.forEach(fruit => {
            fruitStore.addFruit(fruit);
        });
        
        // Set background texture
        const backgroundTexture = this.engine.resources.getTexture('background');
        if (backgroundTexture && this.engine.renderer.scene) {
            this.engine.renderer.scene.background = backgroundTexture;
        }
        
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
            <div class="fruit-selection-count">Selected: ${this.selectedFruits.length}/${this.maxSelections}</div>
            <div class="fruit-grid interactive-element"></div>
            <div class="fruit-details-container">
                <div class="fruit-details-header">Fruit Details</div>
                <div class="fruit-details-content"></div>
            </div>
            <button class="start-button" ${this.selectedFruits.length === this.maxSelections ? '' : 'disabled'}>Start Adventure</button>
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
            
            .fruit-details-container {
                width: 80%;
                max-width: 800px;
                background-color: rgba(0, 0, 0, 0.6);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 30px;
            }
            
            .fruit-details-header {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 15px;
                text-align: center;
            }
            
            .fruit-details-content {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: center;
            }
            
            .fruit-detail-card {
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 15px;
                width: 220px;
            }
            
            .fruit-detail-header {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .fruit-detail-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                margin-right: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .fruit-detail-name {
                font-size: 18px;
                font-weight: bold;
            }
            
            .attack-list {
                margin-top: 10px;
            }
            
            .attack-item {
                margin-bottom: 8px;
                padding: 5px;
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 5px;
            }
            
            .attack-name {
                font-weight: bold;
                margin-bottom: 3px;
            }
            
            .attack-info {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #ccc;
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
            fruitItem.className = 'fruit-item interactive-element';
            fruitItem.dataset.fruitIndex = index;
            
            // Mark as selected if in the selectedFruits array
            if (this.selectedFruits.some(f => f.name === fruit.name)) {
                fruitItem.classList.add('selected');
            }
            
            fruitItem.innerHTML = `
                <div class="fruit-icon">
                    <img src="models/fruits/${fruit.type.charAt(0).toUpperCase() + fruit.type.slice(1)}Fruit.png" alt="${fruit.name}" style="width: 64px; height: 64px; object-fit: contain;">
                </div>
                <div class="fruit-name">${fruit.name}</div>
                <div class="fruit-power">Power: ${fruit.power}</div>
            `;
            
            // Add a specific z-index to ensure fruit items are on top and clickable
            fruitItem.style.position = 'relative';
            fruitItem.style.zIndex = '10';
            
            // Add a more robust click event that ensures propagation
            fruitItem.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFruitSelection(fruitItem, fruit);
                return false;
            };
            
            fruitGrid.appendChild(fruitItem);
        });
        
        // Populate fruit details
        this.updateFruitDetails();
        
        // Add start button handler
        const startButton = this.fruitSelectUI.querySelector('.start-button');
        startButton.addEventListener('click', () => {
            if (this.selectedFruits.length === this.maxSelections) {
                // Start playing background music using the audio manager
                const audioBuffer = this.engine.resources.getSound('bgMusic');
                audioManager.playBackgroundMusic(audioBuffer);
                
                // Store selected fruits for gameplay
                this.engine.playerFruits = this.selectedFruits;
                
                // Transition to gameplay state
                this.engine.stateManager.changeState('gameplay');
            }
        });
    }
    
    /**
     * Update the fruit details section
     */
    updateFruitDetails() {
        const detailsContent = this.fruitSelectUI.querySelector('.fruit-details-content');
        detailsContent.innerHTML = '';
        
        // Add cards for each selected fruit
        this.selectedFruits.forEach(fruit => {
            // Get fruit from store
            const fruitData = fruitStore.getFruit(fruit.name) || { 
                name: fruit.name, 
                type: fruit.type, 
                attacks: fruit.attacks,
                damageValues: { 
                    'Basic Attack': Math.round(fruit.power * 0.8),
                    'Special Attack': Math.round(fruit.power * 1.5),
                    'Ultimate Attack': Math.round(fruit.power * 3)
                },
                cooldowns: fruitStore.defaultCooldowns
            };
            
            const detailCard = document.createElement('div');
            detailCard.className = 'fruit-detail-card';
            
            // Create header
            const header = document.createElement('div');
            header.className = 'fruit-detail-header';
            
            const icon = document.createElement('div');
            icon.className = 'fruit-detail-icon';
            icon.innerHTML = this.getFruitEmoji(fruit.type);
            
            const name = document.createElement('div');
            name.className = 'fruit-detail-name';
            name.textContent = fruit.name;
            
            header.appendChild(icon);
            header.appendChild(name);
            detailCard.appendChild(header);
            
            // Create attack list
            const attackList = document.createElement('div');
            attackList.className = 'attack-list';
            
            const attackTypes = ['Basic Attack', 'Special Attack', 'Ultimate Attack'];
            attackTypes.forEach((attackType, index) => {
                const attackItem = document.createElement('div');
                attackItem.className = 'attack-item';
                
                // Get attack name from fruit attacks array if available
                const attackName = fruit.attacks[index] || attackType;
                
                attackItem.innerHTML = `
                    <div class="attack-name">${attackName}</div>
                    <div class="attack-info">
                        <span>Damage: ${fruitData.damageValues[attackType]}</span>
                        <span>Cooldown: ${fruitData.cooldowns[attackType]}s</span>
                    </div>
                `;
                
                attackList.appendChild(attackItem);
            });
            
            detailCard.appendChild(attackList);
            detailsContent.appendChild(detailCard);
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
            
            // Add to fruit store if not there already
            if (!fruitStore.getFruit(fruit.name)) {
                fruitStore.addFruit(fruit);
            }
        }
        
        // Update selection count
        const countElement = this.fruitSelectUI.querySelector('.fruit-selection-count');
        countElement.textContent = `Selected: ${this.selectedFruits.length}/${this.maxSelections}`;
        
        // Update fruit details
        this.updateFruitDetails();
        
        // Enable/disable start button
        const startButton = this.fruitSelectUI.querySelector('.start-button');
        startButton.disabled = this.selectedFruits.length !== this.maxSelections;
    }
    
    /**
     * Update the fruit selection state
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update fruit store cooldowns
        fruitStore.updateCooldowns(deltaTime);
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