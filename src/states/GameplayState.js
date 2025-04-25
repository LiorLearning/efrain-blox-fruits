/**
 * Main gameplay state
 */
import { BaseState } from './BaseState.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { MiniBoss } from '../entities/MiniBoss.js';
import * as THREE from 'three';

export class GameplayState extends BaseState {
    constructor(engine) {
        super(engine);
        
        this.uiContainer = document.getElementById('ui-container');
        this.gameplayUI = null;
        
        this.player = null;
        this.enemies = [];
        this.boss = null;
        this.currentIsland = null;
    }
    
    /**
     * Initialize the gameplay state
     */
    init() {
        super.init();
    }
    
    /**
     * Enter the gameplay state
     */
    enter(params = {}) {
        super.enter(params);
        
        // Create game world
        this.createGameWorld();
        
        // Create player
        this.createPlayer();
        
        // Create enemies and boss
        this.createEnemies();
        
        // Create and show UI
        this.createUI();
        
        // Set camera for following player
        this.setupCamera();
    }
    
    /**
     * Create the game world
     */
    createGameWorld() {
        // Clear existing scene
        const scene = this.engine.renderer.scene;
        
        // Remove all objects except camera and lights
        const objectsToRemove = [];
        scene.traverse((object) => {
            if (object.type === 'Mesh') {
                objectsToRemove.push(object);
            }
        });
        
        objectsToRemove.forEach(object => {
            scene.remove(object);
        });
        
        // Set background texture
        const backgroundTexture = this.engine.resources.getTexture('background');
        if (backgroundTexture) {
            scene.background = backgroundTexture;
        } else {
            console.warn("Background texture not found, using default sky color");
        }
        
        // Create island ground
        const groundGeometry = new THREE.CylinderGeometry(30, 30, 2, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x7cfc00, // Green
            metalness: 0.1,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = -1; // Half below "sea level"
        scene.add(ground);
        
        // Create water around island
        const waterGeometry = new THREE.RingGeometry(30, 100, 32);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x0077be, // Blue
            metalness: 0.1,
            roughness: 0.5
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2; // Flat
        water.position.y = -0.5; // Water level
        scene.add(water);
        
        // Create some basic environment elements
        this.addEnvironmentElements(scene);
    }
    
    /**
     * Add environment elements to the scene
     */
    addEnvironmentElements(scene) {
        // Add some trees
        for (let i = 0; i < 15; i++) {
            const treeGroup = new THREE.Group();
            
            // Tree trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 3, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513, // Brown
                roughness: 0.8
            });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 1.5; // Half height
            treeGroup.add(trunk);
            
            // Tree leaves
            const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
            const leavesMaterial = new THREE.MeshStandardMaterial({
                color: 0x2e8b57, // Forest green
                roughness: 0.7
            });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.y = 5; // Above trunk
            treeGroup.add(leaves);
            
            // Position around island
            const angle = Math.random() * Math.PI * 2;
            const radius = 15 + Math.random() * 10;
            treeGroup.position.x = Math.cos(angle) * radius;
            treeGroup.position.z = Math.sin(angle) * radius;
            
            scene.add(treeGroup);
        }
        
        // Add some rocks
        for (let i = 0; i < 10; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(1 + Math.random() * 1.5, 0);
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: 0x808080, // Gray
                roughness: 0.9
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 20;
            rock.position.x = Math.cos(angle) * radius;
            rock.position.z = Math.sin(angle) * radius;
            rock.position.y = 0.5; // Half in ground
            
            // Random rotation
            rock.rotation.x = Math.random() * Math.PI;
            rock.rotation.y = Math.random() * Math.PI;
            rock.rotation.z = Math.random() * Math.PI;
            
            scene.add(rock);
        }
    }
    
    /**
     * Create player character
     */
    createPlayer() {
        // Create player with config
        const playerConfig = this.engine.config.player;
        
        // Check for selected fruits or use defaults
        let playerFruits = [];
        if (this.engine.playerFruits && this.engine.playerFruits.length > 0) {
            playerFruits = this.engine.playerFruits;
        } else {
            // Use default fruits from config
            playerFruits = this.engine.config.fruits;
        }
        
        // Create player instance
        this.player = new Player(this.engine, {
            name: playerConfig.name,
            health: playerConfig.health,
            maxHealth: playerConfig.health,
            speed: playerConfig.speed,
            jumpPower: playerConfig.jumpPower,
            fruits: playerFruits
        });
        
        // Center player on the island
        this.player.setPosition(0, 0, 0);
    }
    
    /**
     * Set up camera in fixed isometric view
     */
    setupCamera() {
        // Set camera position for fixed isometric view
        const camera = this.engine.renderer.camera;
        
        // Position camera for true isometric view at a fixed distance
        camera.position.set(20, 20, 20);
        
        // Look at center of the island
        camera.lookAt(0, 0, 0);
        
        // Adjust camera settings
        camera.fov = 45; // Narrower field of view for more isometric look
        camera.updateProjectionMatrix();
        
        // Disable orbit controls for gameplay
        if (this.engine.renderer.controls) {
            this.engine.renderer.controls.enabled = false;
        }
    }
    
    /**
     * Create gameplay UI
     */
    createUI() {
        // Create gameplay UI
        this.gameplayUI = document.createElement('div');
        this.gameplayUI.className = 'gameplay-ui';
        
        // Basic UI structure with player info and controls
        this.gameplayUI.innerHTML = `
            <div class="player-info">
                <div class="player-name">Efrain</div>
                <div class="health-bar">
                    <div class="health-fill" style="width: 100%;"></div>
                </div>
            </div>
            <div class="fruit-powers">
                <div class="fruit-power-title">Fruit Powers</div>
                <div class="fruit-power-list"></div>
            </div>
            <div class="game-controls">
                <div class="controls-info">
                    <p>WASD or Arrow Keys: Move</p>
                    <p>Space: Use Fruit Attack</p>
                    <p>1-5: Select Fruit</p>
                    <p>M: Math Challenge for More Fruit Uses</p>
                    <p>Mouse to Edge: Pan Camera</p>
                </div>
            </div>
        `;
        
        // Add styling
        const style = document.createElement('style');
        style.textContent = `
            .gameplay-ui {
                pointer-events: none;
                user-select: none;
                color: white;
            }
            
            .player-info {
                position: absolute;
                top: 20px;
                left: 20px;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 5px;
                width: 200px;
            }
            
            .player-name {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .health-bar {
                width: 100%;
                height: 10px;
                background-color: #333;
                border-radius: 5px;
                overflow: hidden;
            }
            
            .health-fill {
                height: 100%;
                background-color: #3c3;
                transition: width 0.3s ease;
            }
            
            .fruit-powers {
                position: absolute;
                bottom: 20px;
                left: 20px;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 5px;
                width: 300px;
            }
            
            .fruit-power-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .fruit-power-list {
                display: flex;
                gap: 10px;
            }
            
            .fruit-power-item {
                width: 50px;
                height: 50px;
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }
            
            .fruit-power-item.active {
                background-color: rgba(255, 215, 0, 0.4);
                border: 2px solid gold;
            }
            
            .game-controls {
                position: absolute;
                top: 20px;
                right: 20px;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 5px;
            }
            
            .controls-info p {
                margin: 5px 0;
            }
        `;
        
        this.uiContainer.appendChild(style);
        this.uiContainer.appendChild(this.gameplayUI);
        
        // Add selected fruits to UI
        const fruitPowerList = this.gameplayUI.querySelector('.fruit-power-list');
        
        if (this.engine.playerFruits && this.engine.playerFruits.length > 0) {
            this.engine.playerFruits.forEach((fruit, index) => {
                const fruitItem = document.createElement('div');
                fruitItem.className = 'fruit-power-item';
                fruitItem.innerHTML = `<img src="assets/models/fruits/${fruit.type.charAt(0).toUpperCase() + fruit.type.slice(1)}Fruit.png" alt="${fruit.name}" style="width: 40px; height: 40px; object-fit: contain;">`;
                fruitItem.dataset.fruitIndex = index;
                
                if (index === 0) {
                    fruitItem.classList.add('active');
                }
                
                fruitPowerList.appendChild(fruitItem);
            });
        } else {
            // If no fruits selected (should not happen), use defaults
            const defaultFruits = ['flame', 'ice', 'bomb', 'light', 'magma'];
            defaultFruits.forEach((type, index) => {
                const fruitItem = document.createElement('div');
                fruitItem.className = 'fruit-power-item';
                fruitItem.innerHTML = `<img src="assets/models/fruits/${type.charAt(0).toUpperCase() + type.slice(1)}Fruit.png" alt="${type}" style="width: 40px; height: 40px; object-fit: contain;">`;
                fruitItem.dataset.fruitIndex = index;
                
                if (index === 0) {
                    fruitItem.classList.add('active');
                }
                
                fruitPowerList.appendChild(fruitItem);
            });
        }
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
     * Create enemies and boss
     */
    createEnemies() {
        // Clear any existing enemies
        this.enemies.forEach(enemy => {
            if (enemy) enemy.destroy();
        });
        this.enemies = [];
        
        if (this.boss) {
            this.boss.destroy();
            this.boss = null;
        }
        
        // Create some regular enemies at positions closer to the center of the island
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 8 + Math.random() * 10; // Reduced radius to bring enemies closer
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const enemy = new Enemy(this.engine, {
                name: `Villain ${i+1}`,
                health: 50 + i * 10
            });
            
            enemy.setPosition(x, 0, z);
            this.enemies.push(enemy);
        }
        
        // Create a boss at the far end of the island, but not too far
        this.boss = new MiniBoss(this.engine, {
            name: 'Island Boss',
            health: 200,
            abilities: [
                { name: 'shockwave', power: 30 },
                { name: 'teleport', power: 0 },
                { name: 'fireBlast', power: 40 }
            ]
        });
        
        // Position the boss closer to the player
        this.boss.setPosition(0, 0, -18);
    }

    /**
     * Update the gameplay state
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update player movement
        this.updatePlayerMovement(deltaTime);
        
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy) enemy.update(deltaTime);
        });
        
        // Update boss
        if (this.boss) {
            this.boss.update(deltaTime);
        }
        
        // Update camera to follow player
        this.updateCamera();
        
        // Check for projectile collisions
        this.detectProjectileCollisions();
    }
    
    /**
     * Detect collisions between projectiles and enemies
     */
    detectProjectileCollisions() {
        const scene = this.engine.renderer.scene;
        if (!scene) return;
        
        // Get all projectiles in the scene
        const projectiles = [];
        scene.traverse((object) => {
            if (object.userData && 
                object.userData.type && 
                (object.userData.type === 'projectile' || 
                 object.userData.type === 'fireball' || 
                 object.userData.type === 'iceSpike' || 
                 object.userData.type === 'lightBeam')) {
                projectiles.push(object);
            }
        });
        
        // Get all area effects in the scene
        const areaEffects = [];
        scene.traverse((object) => {
            if (object.userData && 
                object.userData.type && 
                (object.userData.type === 'area' || 
                 object.userData.type === 'inferno' ||
                 object.userData.type === 'iceField')) {
                areaEffects.push(object);
            }
        });
        
        // Get all enemies including boss
        const enemies = [...this.enemies];
        if (this.boss) {
            enemies.push(this.boss);
        }
        
        // Check each projectile against each enemy
        projectiles.forEach(projectile => {
            // Skip non-player projectiles
            if (projectile.userData.source !== 'player') return;
            
            // Get projectile position
            const projectilePos = projectile.position;
            
            // Check against each enemy
            enemies.forEach(enemy => {
                // Skip inactive enemies
                if (!enemy || !enemy.isActive) return;
                
                // Get enemy position
                const enemyPos = enemy.getPosition();
                if (!enemyPos) return;
                
                // Calculate distance between projectile and enemy
                const distance = Math.sqrt(
                    Math.pow(projectilePos.x - enemyPos.x, 2) + 
                    Math.pow(projectilePos.z - enemyPos.z, 2)
                );
                
                // Get enemy collision radius
                const enemyRadius = enemy.object3D && enemy.object3D.userData && 
                                  enemy.object3D.userData.collider ? 
                                  enemy.object3D.userData.collider.radius : 0.7;
                
                // Get projectile collision radius
                const projectileRadius = 0.5; // Default projectile radius
                
                // Check for collision
                if (distance < enemyRadius + projectileRadius) {
                    // Collision detected!
                    
                    // Apply different damage based on enemy type
                    let damage = projectile.userData.damage;
                    
                    // Check if it's a boss (check by name rather than instanceof)
                    let percentText;
                    if (enemy.name && enemy.name.includes('Boss')) {
                        // Boss takes 10% of health as damage
                        const percentDamage = enemy.health * 0.1;
                        damage = Math.max(damage, percentDamage);
                        console.log(`Boss hit! Taking ${damage.toFixed(1)} damage (10% of health)`);
                        percentText = "10%";
                        
                        // Use percentage damage if it's greater than normal damage
                        if (percentDamage > projectile.userData.damage) {
                            this._showDamageText(enemy.getPosition(), "10% DAMAGE!", 0xff0000);
                        }
                    } else {
                        // Regular villain takes 25% of health as damage
                        const percentDamage = enemy.health * 0.25;
                        damage = Math.max(damage, percentDamage);
                        console.log(`Villain hit! Taking ${damage.toFixed(1)} damage (25% of health)`);
                        percentText = "25%";
                        
                        // Use percentage damage if it's greater than normal damage
                        if (percentDamage > projectile.userData.damage) {
                            this._showDamageText(enemy.getPosition(), "25% DAMAGE!", 0xff0000);
                        }
                    }
                    
                    // Deal damage to enemy
                    enemy.takeDamage(damage);
                    
                    // Special effects based on projectile type
                    this.createHitEffect(projectile, enemy);
                    
                    // Remove the projectile
                    scene.remove(projectile);
                    
                    // Clean up geometries and materials
                    projectile.traverse((object) => {
                        if (object.geometry) {
                            object.geometry.dispose();
                        }
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material.forEach(material => material.dispose());
                            } else {
                                object.material.dispose();
                            }
                        }
                    });
                }
            });
        });
        
        // Check each area effect against each enemy
        areaEffects.forEach(effect => {
            // Skip non-player effects
            if (effect.userData.source !== 'player') return;
            
            // Get effect position and radius
            const effectPos = effect.position;
            const effectRadius = effect.userData.radius || 5;
            
            // Check against each enemy
            enemies.forEach(enemy => {
                // Skip inactive enemies
                if (!enemy || !enemy.isActive) return;
                
                // Get enemy position
                const enemyPos = enemy.getPosition();
                if (!enemyPos) return;
                
                // Calculate distance between effect and enemy
                const distance = Math.sqrt(
                    Math.pow(effectPos.x - enemyPos.x, 2) + 
                    Math.pow(effectPos.z - enemyPos.z, 2)
                );
                
                // Check if enemy is within effect radius
                if (distance < effectRadius) {
                    // Enemy is in area effect range!
                    
                    // Apply different damage based on enemy type
                    let damage = effect.userData.damage * this.engine.time.deltaTime; // Scale damage by time
                    
                    // Check if it's a boss
                    if (enemy.name && enemy.name.includes('Boss')) {
                        // Boss takes 10% of health as damage
                        const percentDamage = enemy.health * 0.1 * this.engine.time.deltaTime;
                        damage = Math.max(damage, percentDamage);
                        
                        // Use percentage damage if it's greater
                        if (percentDamage > effect.userData.damage * this.engine.time.deltaTime) {
                            this._showDamageText(enemy.getPosition(), "10%", 0xff0000);
                        }
                    } else {
                        // Regular villain takes 25% of health as damage
                        const percentDamage = enemy.health * 0.25 * this.engine.time.deltaTime;
                        damage = Math.max(damage, percentDamage);
                        
                        // Use percentage damage if it's greater
                        if (percentDamage > effect.userData.damage * this.engine.time.deltaTime) {
                            this._showDamageText(enemy.getPosition(), "25%", 0xff0000);
                        }
                    }
                    
                    // Deal damage to enemy
                    enemy.takeDamage(damage);
                }
            });
        });
    }
    
    /**
     * Check for direct attacks against enemies in range
     * Called when player uses a direct attack with a fruit
     */
    checkDirectAttackHits(position, range, damage, attackType) {
        // Get all enemies including boss
        const enemies = [...this.enemies];
        if (this.boss) {
            enemies.push(this.boss);
        }
        
        let hitAny = false;
        
        // Check each enemy to see if they're in range
        enemies.forEach(enemy => {
            // Skip inactive enemies
            if (!enemy || !enemy.isActive) return;
            
            // Get enemy position
            const enemyPos = enemy.getPosition();
            if (!enemyPos) return;
            
            // Calculate distance between attack position and enemy
            const distance = Math.sqrt(
                Math.pow(position.x - enemyPos.x, 2) + 
                Math.pow(position.z - enemyPos.z, 2)
            );
            
            // Check if enemy is within attack range
            if (distance <= range) {
                // Enemy is in attack range!
                hitAny = true;
                
                // Apply different damage based on enemy type
                let finalDamage = damage;
                
                // Check if it's a boss
                if (enemy.name && enemy.name.includes('Boss')) {
                    // Boss takes 10% of health as damage
                    const percentDamage = enemy.health * 0.1;
                    finalDamage = Math.max(damage, percentDamage);
                    console.log(`Boss hit! Taking ${finalDamage.toFixed(1)} damage (10% of health)`);
                    
                    // Use percentage damage if it's greater than normal damage
                    if (percentDamage > damage) {
                        this._showDamageText(enemy.getPosition(), "10% DAMAGE!", 0xff0000);
                    }
                } else {
                    // Regular villain takes 25% of health as damage
                    const percentDamage = enemy.health * 0.25;
                    finalDamage = Math.max(damage, percentDamage);
                    console.log(`Villain hit! Taking ${finalDamage.toFixed(1)} damage (25% of health)`);
                    
                    // Use percentage damage if it's greater than normal damage
                    if (percentDamage > damage) {
                        this._showDamageText(enemy.getPosition(), "25% DAMAGE!", 0xff0000);
                    }
                }
                
                // Deal damage to enemy
                enemy.takeDamage(finalDamage);
                
                // Create hit effect
                const hitEffect = {
                    userData: {
                        type: attackType
                    }
                };
                this.createHitEffect(hitEffect, enemy);
            }
        });
        
        return hitAny;
    }
    
    /**
     * Create visual effect when projectile hits enemy
     */
    createHitEffect(projectile, enemy) {
        // Get hit position (enemy position at hit time)
        const enemyPos = enemy.getPosition();
        if (!enemyPos) return;
        
        // Get projectile type
        const projectileType = projectile.userData.type;
        
        // Create hit effect based on projectile type
        let color = 0xffffff; // Default color
        
        switch(projectileType) {
            case 'fireball':
                color = 0xff4400; // Orange/red for flame
                break;
            case 'iceSpike':
                color = 0x00ddff; // Light blue for ice
                break;
            case 'lightBeam':
                color = 0xffff00; // Yellow for light
                break;
            case 'bombFragment':
                color = 0x888888; // Gray for bomb
                break;
        }
        
        // Create a flash effect at the hit position
        const geometry = new THREE.SphereGeometry(1.0, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const hitEffect = new THREE.Mesh(geometry, material);
        hitEffect.position.set(enemyPos.x, enemyPos.y + 1.0, enemyPos.z); // At enemy center
        
        // Add to scene
        this.engine.renderer.scene.add(hitEffect);
        
        // Animate the hit effect
        const startTime = Date.now();
        const duration = 300; // ms
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Scale up and fade out
            hitEffect.scale.set(1 + progress * 1.5, 1 + progress * 1.5, 1 + progress * 1.5);
            hitEffect.material.opacity = 0.8 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove effect when animation is complete
                this.engine.renderer.scene.remove(hitEffect);
                hitEffect.geometry.dispose();
                hitEffect.material.dispose();
            }
        };
        
        // Start animation
        animate();
    }
    
    /**
     * Show floating damage text above an enemy
     */
    _showDamageText(position, text, color = 0xff0000) {
        if (!position) return;
        
        const scene = this.engine.renderer.scene;
        if (!scene) return;
        
        // Create a canvas for the text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        // Draw the text
        context.font = 'bold 36px Arial';
        context.fillStyle = '#' + color.toString(16).padStart(6, '0');
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create sprite with text
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1.0
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.position.set(position.x, position.y + 3.0, position.z); // Position above enemy
        sprite.scale.set(3, 1.5, 1); // Scale for better visibility
        
        // Add to scene
        scene.add(sprite);
        
        // Animate rising and fading
        const startTime = Date.now();
        const duration = 1500; // 1.5 seconds
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Rise up
            sprite.position.y = position.y + 3.0 + progress * 2;
            
            // Fade out in the second half of the animation
            if (progress > 0.5) {
                sprite.material.opacity = 2 * (1 - progress);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove when animation is complete
                scene.remove(sprite);
                sprite.material.map.dispose();
                sprite.material.dispose();
            }
        };
        
        // Start animation
        animate();
    }
    
    /**
     * Update player movement based on input
     */
    updatePlayerMovement(deltaTime) {
        if (!this.player) return;
        
        // Player entity now handles its own movement
        this.player.update(deltaTime);
    }
    
    /**
     * Update camera for isometric view with mouse control for navigation
     */
    updateCamera() {
        if (!this.player) return;
        
        const camera = this.engine.renderer.camera;
        const input = this.engine.input;
        
        // Get player position
        const playerPosition = this.player.getPosition();
        if (!playerPosition) return;
        
        // Initialize camera offset if not set
        if (!this.cameraOffset) {
            this.cameraOffset = { x: 0, z: 0 };
        }
        
        // Mouse-based camera panning
        // Only when mouse is at screen edges
        const mousePos = input.getMousePosition();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Mouse edges detection for map navigation (edge panning)
        const edgeThreshold = 50; // pixels from the edge
        const panSpeed = 0.2 * this.engine.time.deltaTime;
        
        // Panning at screen edges
        if (mousePos.x < edgeThreshold) {
            // Left edge
            this.cameraOffset.x -= panSpeed;
        } else if (mousePos.x > screenWidth - edgeThreshold) {
            // Right edge
            this.cameraOffset.x += panSpeed;
        }
        
        if (mousePos.y < edgeThreshold) {
            // Top edge
            this.cameraOffset.z -= panSpeed;
        } else if (mousePos.y > screenHeight - edgeThreshold) {
            // Bottom edge
            this.cameraOffset.z += panSpeed;
        }
        
        // Limit camera panning to island bounds
        const maxOffset = 20;
        this.cameraOffset.x = Math.max(-maxOffset, Math.min(maxOffset, this.cameraOffset.x));
        this.cameraOffset.z = Math.max(-maxOffset, Math.min(maxOffset, this.cameraOffset.z));
        
        // Calculate center point (player position + camera offset)
        const centerPosition = new THREE.Vector3(
            playerPosition.x + this.cameraOffset.x,
            0, // Keep at ground level
            playerPosition.z + this.cameraOffset.z
        );
        
        // Smoothly shift the look target
        camera.lookAt(centerPosition);
    }
    
    /**
     * Exit gameplay state
     */
    exit() {
        super.exit();
        
        // Remove UI
        this.removeUI();
        
        // Clean up player
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        
        // Clean up enemies
        this.enemies.forEach(enemy => {
            if (enemy) enemy.destroy();
        });
        this.enemies = [];
        
        // Clean up boss
        if (this.boss) {
            this.boss.destroy();
            this.boss = null;
        }
        
        // Re-enable orbit controls if they exist
        if (this.engine.renderer.controls) {
            this.engine.renderer.controls.enabled = true;
        }
    }
    
    /**
     * Remove gameplay UI
     */
    removeUI() {
        if (this.gameplayUI && this.gameplayUI.parentNode) {
            this.gameplayUI.parentNode.removeChild(this.gameplayUI);
        }
    }
}