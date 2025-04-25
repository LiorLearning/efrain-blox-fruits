/**
 * Base state class for game states
 */
export class BaseState {
  constructor(engine) {
      this.engine = engine;
      this.initialized = false;
  }
  
  /**
   * Initialize the state (called once)
   */
  init() {
      if (this.initialized) return;
      this.initialized = true;
  }
  
  /**
   * Enter this state
   */
  enter(params = {}) {
      // Initialize if not initialized
      if (!this.initialized) {
          this.init();
      }
  }
  
  /**
   * Exit this state
   */
  exit() {
      // Clean up temporary resources
  }
  
  /**
   * Update the state
   */
  update(deltaTime) {
      // Update state logic
  }
  
  /**
   * Render the state
   */
  render() {
      // Custom rendering logic (if needed)
  }
  
  /**
   * Handle input for this state
   */
  handleInput() {
      // Process input
  }
  
  /**
   * Create UI elements for this state
   */
  createUI() {
      // Set up UI elements
  }
  
  /**
   * Remove UI elements for this state
   */
  removeUI() {
      // Clean up UI elements
  }
}