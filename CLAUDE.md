# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Information
- A Three.js-based game named "Blox Fruits" 
- Uses ES modules
- Runs directly in browser, no build step required

## Running the Project
- Open index.html in a browser
- For development: Use a local server (e.g., `python -m http.server`)

## Code Style Guidelines
- Use ES6+ features (classes, arrow functions, etc.)
- Follow proper JSDoc comments for all functions and classes
- Prefix private methods with underscore (_methodName)
- Use camelCase for variables and methods
- Use PascalCase for classes
- Handle errors with try/catch and proper console logging
- Use consistent 4-space indentation

## Import Conventions
- Use explicit module imports: `import { Feature } from './path/to/Feature.js'`
- Group imports by type: core modules, then game modules

## Architecture
- Core modules in src/core/ handle engine functionality
- Game states in src/states/ manage game flow
- Entity system in src/entities/
- Fruit powers in src/powers/