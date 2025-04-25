/**
 * Game state management system
 */
export class StateManager {
  constructor() {
      this.states = {};
      this.currentState = null;
      this.previousState = null;
      this.stateHistory = [];
  }
  
  /**
   * Register a new game state
   */
  registerState(name, state) {
      this.states[name] = state;
  }
  
  /**
   * Get a registered game state
   */
  getState(name) {
      return this.states[name];
  }
  
  /**
   * Change to a different game state
   */
  changeState(name, params = {}) {
      // Make sure the state exists
      if (!this.states[name]) {
          console.error(`State "${name}" does not exist`);
          return false;
      }
      
      // Exit current state
      if (this.currentState) {
          this.currentState.exit();
          this.previousState = this.currentState;
      }
      
      // Change to new state
      this.currentState = this.states[name];
      
      // Add to history
      this.stateHistory.push({
          name: name,
          timestamp: Date.now()
      });
      
      // Enter new state
      this.currentState.enter(params);
      
      console.log(`Changed state to "${name}"`);
      return true;
  }
  
  /**
   * Return to the previous state
   */
  returnToPreviousState(params = {}) {
      if (!this.previousState) {
          console.error("No previous state to return to");
          return false;
      }
      
      // Find the name of the previous state
      const previousStateName = Object.keys(this.states).find(
          key => this.states[key] === this.previousState
      );
      
      if (!previousStateName) {
          console.error("Previous state not found in registry");
          return false;
      }
      
      return this.changeState(previousStateName, params);
  }
  
  /**
   * Update the current state
   */
  update(deltaTime) {
      if (this.currentState && this.currentState.update) {
          this.currentState.update(deltaTime);
      }
  }
  
  /**
   * Render the current state
   */
  render() {
      if (this.currentState && this.currentState.render) {
          this.currentState.render();
      }
  }
  
  /**
   * Get the current state
   */
  getCurrentState() {
      return this.currentState;
  }
  
  /**
   * Get the name of the current state
   */
  getCurrentStateName() {
      for (const [name, state] of Object.entries(this.states)) {
          if (state === this.currentState) {
              return name;
          }
      }
      return null;
  }
  
  /**
   * Get state history
   */
  getStateHistory() {
      return [...this.stateHistory];
  }
}