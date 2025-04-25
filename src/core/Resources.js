/**
 * Resources manager for loading and managing game assets
 */
export class Resources {
  constructor() {
      this.loadingManager = null;
      this.textureLoader = null;
      this.gltfLoader = null;
      this.audioLoader = null;
      
      this.resources = {
          textures: {},
          models: {},
          sounds: {},
          fonts: {}
      };
      
      this.onProgress = null;
      this.onComplete = null;
      this.onError = null;
  }
  
  /**
   * Initialize the resource loaders
   */
  init() {
      
      if (!window.THREE) {
          console.error('THREE.js not available when initializing Resources manager');
          return;
      }
      
      // Create loading manager
      this.loadingManager = new THREE.LoadingManager();
      
      // Set up loading callbacks
      this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
          const progress = itemsLoaded / itemsTotal;
          
          // Update loading screen progress bar - using try/catch to avoid errors if element not available
          try {
              const progressBar = document.querySelector('.progress');
              if (progressBar) {
                  progressBar.style.width = `${progress * 100}%`;
              }
          } catch (e) {
              console.warn('Could not update progress bar:', e);
          }
          
          if (this.onProgress) {
              this.onProgress(url, itemsLoaded, itemsTotal, progress);
          }
      };
      
      this.loadingManager.onLoad = () => {
          
          if (this.onComplete) {
              this.onComplete();
          }
      };
      
      this.loadingManager.onError = (url) => {
          console.error(`Error loading resource: ${url}`);
          
          if (this.onError) {
              this.onError(url);
          }
      };
      
      // Create loaders
      this.textureLoader = new THREE.TextureLoader(this.loadingManager);
      
      // Create GLTF loader if available
      if (window.THREE && THREE.GLTFLoader) {
          this.gltfLoader = new THREE.GLTFLoader(this.loadingManager);
      } else {
      }
      
      // Create Audio loader if available
      if (window.THREE && THREE.AudioLoader) {
          this.audioLoader = new THREE.AudioLoader(this.loadingManager);
      } else {
      }
  }
  
  /**
   * Set loading callbacks
   */
  setCallbacks(onProgress, onComplete, onError) {
      this.onProgress = onProgress;
      this.onComplete = onComplete;
      this.onError = onError;
  }
  
  /**
   * Load a texture
   */
  loadTexture(name, path) {
      return new Promise((resolve, reject) => {
          this.textureLoader.load(
              path,
              (texture) => {
                  this.resources.textures[name] = texture;
                  resolve(texture);
              },
              undefined,
              (error) => {
                  console.error(`Error loading texture ${name}:`, error);
                  reject(error);
              }
          );
      });
  }
  
  /**
   * Load a 3D model
   */
  loadModel(name, path) {
      return new Promise((resolve, reject) => {
          if (!this.gltfLoader) {
              reject(new Error('GLTF Loader not available'));
              return;
          }
          
          this.gltfLoader.load(
              path,
              (gltf) => {
                  this.resources.models[name] = gltf;
                  resolve(gltf);
              },
              undefined,
              (error) => {
                  console.error(`Error loading model ${name}:`, error);
                  reject(error);
              }
          );
      });
  }
  
  /**
   * Load a sound
   */
  loadSound(name, path) {
      return new Promise((resolve, reject) => {
          if (!this.audioLoader) {
              reject(new Error('Audio Loader not available'));
              return;
          }
          
          this.audioLoader.load(
              path,
              (buffer) => {
                  this.resources.sounds[name] = buffer;
                  resolve(buffer);
              },
              undefined,
              (error) => {
                  console.error(`Error loading sound ${name}:`, error);
                  reject(error);
              }
          );
      });
  }
  
  /**
   * Get a loaded texture
   */
  getTexture(name) {
      return this.resources.textures[name];
  }
  
  /**
   * Get a loaded model
   */
  getModel(name) {
      return this.resources.models[name];
  }
  
  /**
   * Get a loaded sound
   */
  getSound(name) {
      return this.resources.sounds[name];
  }
  
  /**
   * Load multiple resources at once
   */
  loadResources(resources) {
      const promises = [];
      
      // Load textures
      if (resources.textures) {
          resources.textures.forEach(texture => {
              promises.push(this.loadTexture(texture.name, texture.path));
          });
      }
      
      // Load models
      if (resources.models) {
          resources.models.forEach(model => {
              promises.push(this.loadModel(model.name, model.path));
          });
      }
      
      // Load sounds
      if (resources.sounds) {
          resources.sounds.forEach(sound => {
              promises.push(this.loadSound(sound.name, sound.path));
          });
      }
      
      return Promise.all(promises);
  }
}