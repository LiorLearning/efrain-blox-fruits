import * as THREE from 'three';

// Export THREE both as default and named exports
export default THREE;
export * from 'three';

// Expose THREE to window for components that expect it globally
window.THREE = THREE; 