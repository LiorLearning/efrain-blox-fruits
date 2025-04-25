#!/bin/bash

# Find all JS files that import from '../lib/three.js' and replace with 'three'
find src -type f -name "*.js" -exec sed -i '' "s/from '..\/lib\/three.js'/from 'three'/g" {} \;

echo "Updated Three.js imports in all files" 