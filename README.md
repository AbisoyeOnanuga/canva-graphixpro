# Canva Graphixpro

## overview
This repository contains projects developed for the Canva AI and Integration Hackathon. Our primary focus is on creating innovative design editing features using the Canva Apps SDK, including Invert Color, 3D Image, and Film Effect tools.

## Prerequisites
- Canva.com account
- Node.js `v18` or `v20.10.0`
- npm `v9` or `v10`
- Basic knowledge of TypeScript, React, and webpack

## Cloning the Repository
To get started, clone the repository:
`
git clone https://github.com/canva-sdks/canva-apps-sdk-starter-kit.git
cd canva-apps-sdk-starter-kit
npm install
`

# Starting the App
To start the local development server:
`
npm run start
`
The server will run at `http://localhost:8080`.

## features
- [Invert-color](#invert-colour)
- [Film-effect](#film-effect)
- [Halftone-pattern](#halftone-pattern)
- [Watermark](#watermark)

## Invert Colour
### Overview
The Invert Color feature allows users to invert the colors of selected images within the Canva editor. This feature reads the selected image, inverts its colors, and replaces the original image with the transformed one.

### Implementation Steps
1. Selection Hook: Use the useSelection hook to get the current selection of elements in the Canva editor.
2. Invert Colors Function: Define a function to invert the colors of the image data.
3. Handle Click Function: Implement a function to read the selected image, invert its colors, upload the transformed image, and replace the original image with the transformed one.
4. Transform Raster Image Function: Create a function to handle downloading the image, transforming it, and returning the transformed image data URL and MIME type.

## Film Effect
### Overview
The Film Effect feature adds a vintage film look to images, mimicking the grain and color variations of old film stock.

- Usage: Users can apply the Film Effect and adjust settings like grain intensity and color tone.
- Implementation: The feature uses CSS filters and JavaScript to overlay grain textures and adjust color properties.

## Halftone Pattern
The Halftone Pattern feature simulates the look of traditional halftone printing, creating a dotted effect that varies in size to represent different shades.

- Usage: Users can apply the Halftone Pattern to their images and adjust parameters such as dot size, shape, and spacing.
- Implementation: This feature leverages the HTML5 Canvas API to manipulate image pixels and create the halftone effect.

## Watermark
### Overview
The watermark feature allows users to apply a watermark to their designs. This pattern can create a watermark at corners of the canvas or on a grid.

- Usage: Users can select the watermark style from the effects panel and adjust the position of the watermark.
- Implementation: The feature uses a combination of ... dynamically generate the watermark based on user selection.

## Conclusion
This documentation provides the necessary steps to set up and use the image asset editing features in our Canva app. For further assistance, refer to the Canva Apps SDK documentation.
