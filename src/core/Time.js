/**
 * Time management for the game loop
 */
export class Time {
  constructor() {
      this.deltaTime = 0;      // Time between frames in seconds
      this.elapsedTime = 0;    // Total elapsed time in seconds
      this.frameCount = 0;     // Total frames rendered
      this.startTime = 0;      // Game start time
      this.lastTime = 0;       // Last frame time
      this.fps = 0;            // Current FPS
      this.fpsUpdateInterval = 0.5; // How often to update FPS (in seconds)
      this.fpsTimer = 0;       // Timer for FPS calculation
      this.fpsFrameCount = 0;  // Frames since last FPS calculation
  }
  
  /**
   * Reset the time system
   */
  reset() {
      const now = performance.now();
      this.startTime = now;
      this.lastTime = now;
      this.deltaTime = 0;
      this.elapsedTime = 0;
      this.frameCount = 0;
      this.fps = 0;
      this.fpsTimer = 0;
      this.fpsFrameCount = 0;
  }
  
  /**
   * Update time values for current frame
   */
  update() {
      const now = performance.now();
      
      // Calculate delta time in seconds
      this.deltaTime = (now - this.lastTime) / 1000;
      
      // Cap delta time to prevent huge jumps if game is paused/delayed
      // Max of 100ms (0.1 seconds)
      this.deltaTime = Math.min(this.deltaTime, 0.1);
      
      // Update total time
      this.elapsedTime = (now - this.startTime) / 1000;
      
      // Update frame count
      this.frameCount++;
      
      // Update FPS calculation
      this.fpsFrameCount++;
      this.fpsTimer += this.deltaTime;
      
      if (this.fpsTimer >= this.fpsUpdateInterval) {
          this.fps = Math.round(this.fpsFrameCount / this.fpsTimer);
          this.fpsFrameCount = 0;
          this.fpsTimer = 0;
      }
      
      // Save current time for next frame
      this.lastTime = now;
  }
  
  /**
   * Get current FPS
   */
  getFPS() {
      return this.fps;
  }
  
  /**
   * Get game running time in seconds
   */
  getElapsedTime() {
      return this.elapsedTime;
  }
  
  /**
   * Get total frame count
   */
  getFrameCount() {
      return this.frameCount;
  }
}