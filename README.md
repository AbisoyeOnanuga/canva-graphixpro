# Canva Graphixpro

## overview
This repository contains projects developed for the Canva AI and Integration Hackathon. Our primary focus is on creating innovative design editing features using the Canva Apps SDK, including Invert Color, 3D Image, and Film Effect tools.

## features
- [Invert-colour](#invert)
- [Film-effect](#film)

## Invert Colour
### Overview
The Invert Color feature allows users to invert the colors of selected images within the Canva editor. This feature reads the selected image, inverts its colors, and replaces the original image with the transformed one.

### Implementation Steps
1. Selection Hook: Use the useSelection hook to get the current selection of elements in the Canva editor.
2. Invert Colors Function: Define a function to invert the colors of the image data.
3. Handle Click Function: Implement a function to read the selected image, invert its colors, upload the transformed image, and replace the original image with the transformed one.
4. Transform Raster Image Function: Create a function to handle downloading the image, transforming it, and returning the transformed image data URL and MIME type.
