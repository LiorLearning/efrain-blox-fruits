/**
 * Shared store for fruits with their damage and cooldown information
 */

export class FruitStore {
    constructor() {
        // Main store for fruits
        this.fruits = [];
        
        // Default cooldown times in seconds
        this.defaultCooldowns = {
            'Basic Attack': 2,
            'Special Attack': 5,
            'Ultimate Attack': 15
        };
        
        // Initialize with empty store
        this.initialize();
    }
    
    /**
     * Initialize the fruit store
     */
    initialize() {
        this.fruits = [];
    }
    
    /**
     * Add a fruit to the store
     */
    addFruit(fruit) {
        // Calculate damage values based on power
        const damageValues = {
            'Basic Attack': Math.round(fruit.power * 0.8),
            'Special Attack': Math.round(fruit.power * 1.5),
            'Ultimate Attack': Math.round(fruit.power * 3)
        };
        
        // Create fruit entry with damage and cooldown info
        const fruitEntry = {
            name: fruit.name,
            type: fruit.type,
            power: fruit.power,
            attacks: fruit.attacks,
            damageValues,
            cooldowns: { ...this.defaultCooldowns },
            currentCooldowns: {
                'Basic Attack': 0,
                'Special Attack': 0,
                'Ultimate Attack': 0
            },
            usesRemaining: 2  // Default number of uses
        };
        
        this.fruits.push(fruitEntry);
        return fruitEntry;
    }
    
    /**
     * Get a fruit by name
     */
    getFruit(name) {
        return this.fruits.find(fruit => fruit.name === name);
    }
    
    /**
     * Get a fruit by type
     */
    getFruitByType(type) {
        return this.fruits.find(fruit => fruit.type === type);
    }
    
    /**
     * Update cooldowns for all fruits
     */
    updateCooldowns(deltaTime) {
        this.fruits.forEach(fruit => {
            for (const attack in fruit.currentCooldowns) {
                if (fruit.currentCooldowns[attack] > 0) {
                    fruit.currentCooldowns[attack] -= deltaTime;
                    if (fruit.currentCooldowns[attack] < 0) {
                        fruit.currentCooldowns[attack] = 0;
                    }
                }
            }
        });
    }
    
    /**
     * Use an attack for a fruit
     */
    useAttack(fruitName, attackName) {
        const fruit = this.getFruit(fruitName);
        if (!fruit) return false;
        
        // Check if on cooldown
        if (fruit.currentCooldowns[attackName] > 0) {
            console.log(`${attackName} for ${fruitName} is on cooldown`);
            return false;
        }
        
        // Check if uses remaining
        if (fruit.usesRemaining <= 0) {
            console.log(`No uses remaining for ${fruitName}`);
            return false;
        }
        
        // Use the attack
        fruit.usesRemaining--;
        fruit.currentCooldowns[attackName] = fruit.cooldowns[attackName];
        
        console.log(`Used ${attackName} for ${fruitName}. Damage: ${fruit.damageValues[attackName]}`);
        return true;
    }
    
    /**
     * Get cooldown percentage for a fruit attack
     */
    getCooldownPercentage(fruitName, attackName) {
        const fruit = this.getFruit(fruitName);
        if (!fruit) return 0;
        
        return Math.max(0, Math.min(100, 
            (fruit.currentCooldowns[attackName] / fruit.cooldowns[attackName]) * 100
        ));
    }
    
    /**
     * Reset all cooldowns for a fruit
     */
    resetCooldowns(fruitName) {
        const fruit = this.getFruit(fruitName);
        if (!fruit) return;
        
        for (const attack in fruit.currentCooldowns) {
            fruit.currentCooldowns[attack] = 0;
        }
    }
    
    /**
     * Add uses to a fruit
     */
    addUses(fruitName, amount) {
        const fruit = this.getFruit(fruitName);
        if (!fruit) return;
        
        fruit.usesRemaining += amount;
        console.log(`Added ${amount} uses to ${fruitName}. Now has ${fruit.usesRemaining} uses.`);
    }
}

// Create a singleton instance
const fruitStore = new FruitStore();
export default fruitStore; 