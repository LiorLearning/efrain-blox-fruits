/**
 * Renderer class for handling Three.js rendering
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Renderer {
  constructor(canvas, config) {
      this.canvas = canvas;
      this.config = config;
      
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.debugMode = false;
  }
  
  /**
   * Initialize the Three.js renderer
   */
  init() {
      // Create a new Three.js scene
      this.scene = new THREE.Scene();
      
      // Default background color (will be replaced by texture when loaded)
      this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
      
      // Initialize Three.js Stats if in debug mode
      if (this.debugMode) {
          this._initDebugTools();
      }
      
      // Create camera with isometric perspective
      this.camera = new THREE.PerspectiveCamera(
          this.config.fov || 45, // Lower FOV for more isometric look
          this.config.width / this.config.height,
          this.config.nearPlane || 0.1,
          this.config.farPlane || 1000
      );
      
      // Set camera position for isometric view
      this.camera.position.set(
          this.config.position?.x || 20,
          this.config.position?.y || 20,
          this.config.position?.z || 20
      );
      this.camera.lookAt(0, 0, 0);
      
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          antialias: this.config.antialias || true,
          alpha: true
      });
      
      // Set renderer properties
      this.renderer.setSize(this.config.width, this.config.height);
      this.renderer.setPixelRatio(this.config.pixelRatio || window.devicePixelRatio);
      
      // Enable shadows
      if (this.config.shadowMap) {
          this.renderer.shadowMap.enabled = true;
          this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      
      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambientLight);
      
      // Add directional light (sun)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 7.5);
      directionalLight.castShadow = true;
      
      // Set up shadow properties
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      directionalLight.shadow.camera.left = -20;
      directionalLight.shadow.camera.right = 20;
      directionalLight.shadow.camera.top = 20;
      directionalLight.shadow.camera.bottom = -20;
      
      this.scene.add(directionalLight);
      
      // Create orbit controls (only for menu/non-gameplay states)
      this.controls = new OrbitControls(this.camera, this.canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      
      // Lock rotation to maintain isometric feel when enabled
      this.controls.minPolarAngle = Math.PI / 6; // 30 degrees
      this.controls.maxPolarAngle = Math.PI / 3; // 60 degrees
      
      console.log('Three.js renderer initialized');
  }
  
  /**
   * Render the current scene
   */
  render() {
      if (!this.scene || !this.camera || !this.renderer) return;
      
      // Update orbit controls if available
      if (this.controls) {
          this.controls.update();
      }
      
      // Update debug stats if enabled
      if (this.debugMode && this.stats) {
          this.stats.begin();
      }
      
      // Render the scene
      this.renderer.render(this.scene, this.camera);
      
      // End stats measurement
      if (this.debugMode && this.stats) {
          this.stats.end();
      }
  }
  
  /**
   * Handle resize of the renderer
   */
  resize(width, height) {
      if (!this.camera || !this.renderer) return;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
  }
  
  /**
   * Add an object to the scene
   */
  add(object) {
      if (!this.scene) return;
      this.scene.add(object);
  }
  
  /**
   * Remove an object from the scene
   */
  remove(object) {
      if (!this.scene) return;
      this.scene.remove(object);
  }
  
  /**
   * Clean up Three.js resources
   */
  destroy() {
      if (this.renderer) {
          this.renderer.dispose();
      }
      
      if (this.controls) {
          this.controls.dispose();
      }
      
      // Clean up debug tools
      if (this.debugMode && this.stats && this.stats.dom && this.stats.dom.parentElement) {
          this.stats.dom.parentElement.removeChild(this.stats.dom);
      }
      
      // Dispose of geometries and materials
      if (this.scene) {
          this.scene.traverse((object) => {
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
  }
  
  /**
   * Initialize debug tools
   */
  _initDebugTools() {
      // Import Stats.js dynamically
      import('three/examples/jsm/libs/stats.module.js').then(({ default: Stats }) => {
          // Create stats panel
          this.stats = new Stats();
          this.stats.dom.style.position = 'absolute';
          this.stats.dom.style.top = '0px';
          this.stats.dom.style.zIndex = '100';
          document.body.appendChild(this.stats.dom);
          
          // Enable scene inspector
          import('three/examples/jsm/utils/SceneUtils.js').then(() => {
              console.log('Three.js debug tools initialized');
          });
      });
  }
  
  /**
   * Toggle debug mode
   */
  toggleDebugMode() {
      this.debugMode = !this.debugMode;
      
      if (this.debugMode) {
          this._initDebugTools();
      } else if (this.stats && this.stats.dom && this.stats.dom.parentElement) {
          this.stats.dom.parentElement.removeChild(this.stats.dom);
          this.stats = null;
      }
      
      console.log(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
      return this.debugMode;
  }
}