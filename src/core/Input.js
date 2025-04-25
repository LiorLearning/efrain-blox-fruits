/**
 * Input handling system
 */
export class Input {
  constructor(element) {
      this.element = element;
      
      // Key states
      this.keys = {};
      this.previousKeys = {};
      
      // Mouse states
      this.mouse = {
          position: { x: 0, y: 0 },
          buttons: [false, false, false], // Left, middle, right
          previousButtons: [false, false, false]
      };
      
      // Touch states
      this.touches = [];
      this.previousTouches = [];
      
      // Bind event handlers
      this._bindEventListeners();
  }
  
  /**
   * Update input states for the next frame
   */
  update() {
      // Update previous key states
      this.previousKeys = { ...this.keys };
      
      // Update previous mouse button states
      this.mouse.previousButtons = [...this.mouse.buttons];
      
      // Update previous touch states
      this.previousTouches = [...this.touches];
  }
  
  /**
   * Check if a key is currently pressed
   */
  isKeyDown(key) {
      return this.keys[key] === true;
  }
  
  /**
   * Check if a key was just pressed this frame
   */
  isKeyPressed(key) {
      return this.keys[key] === true && this.previousKeys[key] !== true;
  }
  
  /**
   * Check if a key was just released this frame
   */
  isKeyReleased(key) {
      return this.keys[key] !== true && this.previousKeys[key] === true;
  }
  
  /**
   * Check if a mouse button is currently down
   */
  isMouseButtonDown(button = 0) {
      return this.mouse.buttons[button] === true;
  }
  
  /**
   * Check if a mouse button was just pressed this frame
   */
  isMouseButtonPressed(button = 0) {
      return this.mouse.buttons[button] === true && this.mouse.previousButtons[button] !== true;
  }
  
  /**
   * Check if a mouse button was just released this frame
   */
  isMouseButtonReleased(button = 0) {
      return this.mouse.buttons[button] !== true && this.mouse.previousButtons[button] === true;
  }
  
  /**
   * Get current mouse position
   */
  getMousePosition() {
      return { ...this.mouse.position };
  }
  
  /**
   * Bind all input event listeners
   */
  _bindEventListeners() {
      // Keyboard events
      window.addEventListener('keydown', this._onKeyDown.bind(this));
      window.addEventListener('keyup', this._onKeyUp.bind(this));
      
      // Mouse events
      this.element.addEventListener('mousedown', this._onMouseDown.bind(this));
      window.addEventListener('mouseup', this._onMouseUp.bind(this));
      this.element.addEventListener('mousemove', this._onMouseMove.bind(this));
      this.element.addEventListener('wheel', this._onMouseWheel.bind(this));
      
      // Touch events for mobile
      this.element.addEventListener('touchstart', this._onTouchStart.bind(this));
      window.addEventListener('touchend', this._onTouchEnd.bind(this));
      window.addEventListener('touchcancel', this._onTouchEnd.bind(this));
      this.element.addEventListener('touchmove', this._onTouchMove.bind(this));
      
      // Prevent context menu on right-click
      this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  /**
   * Handle key down events
   */
  _onKeyDown(event) {
      this.keys[event.code] = true;
  }
  
  /**
   * Handle key up events
   */
  _onKeyUp(event) {
      this.keys[event.code] = false;
  }
  
  /**
   * Handle mouse down events
   */
  _onMouseDown(event) {
      this.mouse.buttons[event.button] = true;
      this._updateMousePosition(event);
  }
  
  /**
   * Handle mouse up events
   */
  _onMouseUp(event) {
      this.mouse.buttons[event.button] = false;
      this._updateMousePosition(event);
  }
  
  /**
   * Handle mouse move events
   */
  _onMouseMove(event) {
      this._updateMousePosition(event);
  }
  
  /**
   * Update stored mouse position
   */
  _updateMousePosition(event) {
      const rect = this.element.getBoundingClientRect();
      this.mouse.position.x = event.clientX - rect.left;
      this.mouse.position.y = event.clientY - rect.top;
  }
  
  /**
   * Handle mouse wheel events
   */
  _onMouseWheel(event) {
      // Can be implemented for zoom or other features
  }
  
  /**
   * Handle touch start events
   */
  _onTouchStart(event) {
      for (let i = 0; i < event.changedTouches.length; i++) {
          const touch = event.changedTouches[i];
          this.touches.push({
              id: touch.identifier,
              x: touch.clientX,
              y: touch.clientY
          });
      }
      
      // For simple tap detection, simulate a mouse click
      if (event.touches.length === 1) {
          this.mouse.buttons[0] = true;
          const rect = this.element.getBoundingClientRect();
          this.mouse.position.x = event.touches[0].clientX - rect.left;
          this.mouse.position.y = event.touches[0].clientY - rect.top;
      }
  }
  
  /**
   * Handle touch end events
   */
  _onTouchEnd(event) {
      for (let i = 0; i < event.changedTouches.length; i++) {
          const touchId = event.changedTouches[i].identifier;
          const index = this.touches.findIndex(t => t.id === touchId);
          
          if (index !== -1) {
              this.touches.splice(index, 1);
          }
      }
      
      // Release mouse button if no touches remain
      if (event.touches.length === 0) {
          this.mouse.buttons[0] = false;
      }
  }
  
  /**
   * Handle touch move events
   */
  _onTouchMove(event) {
      for (let i = 0; i < event.changedTouches.length; i++) {
          const touch = event.changedTouches[i];
          const index = this.touches.findIndex(t => t.id === touch.identifier);
          
          if (index !== -1) {
              this.touches[index].x = touch.clientX;
              this.touches[index].y = touch.clientY;
          }
      }
      
      // Update mouse position for the first touch
      if (event.touches.length === 1) {
          const rect = this.element.getBoundingClientRect();
          this.mouse.position.x = event.touches[0].clientX - rect.left;
          this.mouse.position.y = event.touches[0].clientY - rect.top;
      }
  }
  
  /**
   * Remove all event listeners
   */
  destroy() {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
      
      this.element.removeEventListener('mousedown', this._onMouseDown);
      window.removeEventListener('mouseup', this._onMouseUp);
      this.element.removeEventListener('mousemove', this._onMouseMove);
      this.element.removeEventListener('wheel', this._onMouseWheel);
      
      this.element.removeEventListener('touchstart', this._onTouchStart);
      window.removeEventListener('touchend', this._onTouchEnd);
      window.removeEventListener('touchcancel', this._onTouchEnd);
      this.element.removeEventListener('touchmove', this._onTouchMove);
      
      this.element.removeEventListener('contextmenu', (e) => e.preventDefault());
  }
}