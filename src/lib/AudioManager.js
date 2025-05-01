/**
 * Global Audio Manager for the game
 * Manages all audio playback, including background music and sound effects
 */
import * as THREE from 'three';

class AudioManager {
    constructor() {
        this.initialized = false;
        this.soundEnabled = true;
        
        this.audioListener = null;
        this.bgMusic = null;
    }
    
    /**
     * Initialize the audio manager with a camera
     * @param {THREE.Camera} camera - Camera to attach the audio listener to
     */
    init(camera) {
        if (this.initialized) return;
        
        // Create an audio listener
        this.audioListener = new THREE.AudioListener();
        camera.add(this.audioListener);
        
        // Create a global Audio source for background music
        this.bgMusic = new THREE.Audio(this.audioListener);
        
        this.initialized = true;
    }
    
    /**
     * Play background music
     * @param {AudioBuffer} audioBuffer - The audio buffer to play
     * @param {number} volume - Volume level (0.0 to 1.0)
     * @param {boolean} loop - Whether to loop the music
     */
    playBackgroundMusic(audioBuffer, volume = 0.5, loop = true) {
        // Only play if not already playing and sound is enabled
        if (!this.initialized) {
            console.warn('AudioManager not initialized');
            return;
        }
        
        if (this.bgMusic && !this.bgMusic.isPlaying && this.soundEnabled) {
            if (audioBuffer) {
                // Set the audio buffer to the audio source
                this.bgMusic.setBuffer(audioBuffer);
                // Set to loop
                this.bgMusic.setLoop(loop);
                // Set volume
                this.bgMusic.setVolume(volume);
                // Play the audio
                this.bgMusic.play();
            } else {
                console.warn('Background music not loaded');
            }
        }
    }
    
    /**
     * Pause background music
     */
    pauseBackgroundMusic() {
        if (this.bgMusic && this.bgMusic.isPlaying) {
            this.bgMusic.pause();
        }
    }
    
    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        if (this.bgMusic) {
            this.bgMusic.stop();
        }
    }
    
    /**
     * Toggle sound on/off
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        
        if (!this.soundEnabled && this.bgMusic && this.bgMusic.isPlaying) {
            this.bgMusic.pause();
        } else if (this.soundEnabled && this.bgMusic && !this.bgMusic.isPlaying && this.bgMusic.buffer) {
            this.bgMusic.play();
        }
        
        return this.soundEnabled;
    }
    
    /**
     * Set sound enabled/disabled
     * @param {boolean} enabled - Whether sound should be enabled
     */
    setSoundEnabled(enabled) {
        if (this.soundEnabled !== enabled) {
            this.toggleSound();
        }
    }
    
    /**
     * Play a sound effect
     * @param {AudioBuffer} audioBuffer - The audio buffer to play
     * @param {number} volume - Volume level (0.0 to 1.0)
     * @param {boolean} loop - Whether to loop the sound
     * @returns {THREE.Audio} The audio object for further control
     */
    playSound(audioBuffer, volume = 1.0, loop = false) {
        if (!this.initialized || !this.soundEnabled) {
            return null;
        }
        
        const sound = new THREE.Audio(this.audioListener);
        
        if (audioBuffer) {
            sound.setBuffer(audioBuffer);
            sound.setVolume(volume);
            sound.setLoop(loop);
            sound.play();
            return sound;
        }
        
        return null;
    }
}

// Create and export a singleton instance
const audioManager = new AudioManager();
export default audioManager; 