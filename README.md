# HyperView 4D

An interactive **visualizer for 4-dimensional objects** (polytopes). This application enables users to explore the fascinating world of higher-dimensional geometry by projecting 4D shapes into 3D space, and then to the 2D screen.

Interacting with 4D objects can be mind-bending. By rotating the object along planes involving the 4th dimension (W-axis), you can observe "inside-out" transformations that are mathematically consistent but visually surreal.

## Features

- **Interactive 4D Rotation**: Control rotation on 6 separate planes:
  - **3D Planes**: XY, XZ, YZ
  - **4D Planes**: XW, YW, ZW (The "magic" rotations)
- **Shape Library**: specialized 4D polytopes including the Tesseract.
- **Dynamic Rendering**: Real-time projection from 4D $\to$ 3D $\to$ 2D using HTML5 Canvas.
- **Customizable Presets**: From "Slow & Hypnotic" to "Chaotic" rotation modes.

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Rendering**: Custom 4D rendering engine on HTML5 Canvas
- **Build Tool**: Vite

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
