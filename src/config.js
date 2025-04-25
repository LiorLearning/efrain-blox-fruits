/**
 * Game configuration settings
 */
export const config = {
  // Renderer settings
  renderer: {
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      shadowMap: true,
      pixelRatio: window.devicePixelRatio
  },
  
  // Camera settings
  camera: {
      fov: 75,
      nearPlane: 0.1,
      farPlane: 1000,
      position: { x: 0, y: 5, z: 10 }
  },
  
  // Physics settings
  physics: {
      gravity: -9.8,
      timeStep: 1/60
  },
  
  // Game world settings
  world: {
      // Sea configurations
      seas: [
          { 
              name: "First Sea",
              islands: 3,
              unlocked: true
          },
          { 
              name: "Second Sea",
              islands: 3,
              unlocked: false
          },
          { 
              name: "Third Sea",
              islands: 3,
              unlocked: false
          }
      ]
  },
  
  // Player settings
  player: {
      name: "Efrain",
      speed: 5,
      jumpPower: 10,
      health: 100,
      maxFruits: 5
  },
  
  // Fruit powers settings
  fruits: [
      {
          name: "Flame Fruit",
          type: "flame",
          power: 10,
          attacks: ["Fireball", "Flame Dash", "Inferno"]
      },
      {
          name: "Ice Fruit",
          type: "ice",
          power: 8,
          attacks: ["Ice Spike", "Freeze", "Blizzard"]
      },
      {
          name: "Bomb Fruit",
          type: "bomb",
          power: 15,
          attacks: ["Bomb Toss", "Mine", "Mega Explosion"]
      },
      {
          name: "Light Fruit",
          type: "light",
          power: 7,
          attacks: ["Light Beam", "Flash Step", "Solar Flare"]
      },
      {
          name: "Magma Fruit",
          type: "magma",
          power: 12,
          attacks: ["Magma Ball", "Lava Slam", "Volcanic Eruption"]
      }
  ],
  
  // Debug settings
  debug: {
      enabled: true,
      showFPS: true,
      showColliders: true
  }
};