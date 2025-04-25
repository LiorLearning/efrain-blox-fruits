/**
 * Renderer class for handling Three.js rendering
 */
export class Renderer {
  constructor(canvas, config) {
      this.canvas = canvas;
      this.config = config;
      
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
  }
  
  /**
   * Initialize the Three.js renderer
   */
  init() {
      // Create a new Three.js scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
      
      // Create camera
      this.camera = new THREE.PerspectiveCamera(
          this.config.fov || 75,
          this.config.width / this.config.height,
          this.config.nearPlane || 0.1,
          this.config.farPlane || 1000
      );
      
      // Set camera position
      this.camera.position.set(
          this.config.position?.x || 0,
          this.config.position?.y || 5,
          this.config.position?.z || 10
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
      
      // Create orbit controls for development/testing
      if (window.THREE && THREE.OrbitControls) {
          this.controls = new THREE.OrbitControls(this.camera, this.canvas);
          this.controls.enableDamping = true;
          this.controls.dampingFactor = 0.05;
      }
      
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
      
      // Render the scene
      this.renderer.render(this.scene, this.camera);
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
}