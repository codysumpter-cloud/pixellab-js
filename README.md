# PixelLab JavaScript SDK

[![npm version](https://badge.fury.io/js/@pixellab-code%2Fpixellab.svg)](https://badge.fury.io/js/@pixellab-code%2Fpixellab)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)

This JavaScript/Node.js client simplifies interaction with the [PixelLab developer API](http://api.pixellab.ai/v1).

Create characters and items, animate them, and generate rotated views. Useful for game development and other pixel art projects.

For questions or discussions, join us on [Discord](https://discord.gg/pBeyTBF8T7).

## Features

- **Generate Image (Pixflux)**: Create characters, items, and environments from text descriptions
- **Generate Image (Bitforge)**: Use reference images to match a specific art style
- **Animation with Text**: Animate with text prompts
- **Animation with Templates**: Generate animations using pre-made templates for consistent character movements
- **Animation with Skeletons**: Animate bi-pedal and quadrupedal characters and monsters with skeleton-based animations
- **Estimate Skeleton**: Estimate skeletons from images
- **Inpainting**: Edit existing pixel art
- **Rotation**: Generate rotated views of characters and objects
- **Generate Tileset**: Create cohesive tilesets for game environments
- **Generate 4 Rotations**: Generate 4 directional views (north, south, east, west) of characters
- **Generate 8 Rotations**: Generate 8 directional views including diagonals

## Installation

```bash
npm install @pixellab-code/pixellab
```

## Usage

### Basic Usage

```javascript
import { PixelLabClient } from "@pixellab-code/pixellab";

const client = PixelLabClient.fromEnv();
// Or: const client = PixelLabClient.fromEnvFile(".env.development.secrets");
// Or: const client = new PixelLabClient("your-secret-key");

// Generate image
const response = await client.generateImagePixflux({
  description: "cute dragon",
  imageSize: { width: 64, height: 64 },
});

// Save image to file
await response.image.saveToFile("dragon.png");

// Or get as data URL for browser usage
console.log(response.image.dataUrl);
```

### Environment Variables

Create a `.env` file or set environment variables:

```bash
PIXELLAB_SECRET=your-secret-key-here
PIXELLAB_BASE_URL=https://api.pixellab.ai/v1  # Optional
```

### API Methods

#### Generate Image (Pixflux)

```javascript
const response = await client.generateImagePixflux({
  description: "cute dragon",
  imageSize: { width: 64, height: 64 },
  negativeDescription: "ugly, blurry",
  textGuidanceScale: 8.0,
  noBackground: true,
  outline: "single color black outline",
  shading: "basic shading",
  detail: "medium detail",
});
```

#### Generate Image (Bitforge)

```javascript
import { Base64Image } from "@pixellab-code/pixellab";

const styleImage = await Base64Image.fromFile("style.png");

const response = await client.generateImageBitforge({
  description: "boy with wings",
  imageSize: { width: 64, height: 64 },
  styleImage,
  styleStrength: 50.0,
  noBackground: true,
});
```

#### Animate with Templates

```javascript
const animationResponse = await client.animateWithTemplate({
  description: "wizard character",
  action: "walk",
  imageSize: { width: 64, height: 64 },
  reference: {
    type: "template",
    templateId: "humanoid-1",
  },
  templateAnimationId: "walking-432",
});

// Save animation frames
for (let i = 0; i < animationResponse.images.length; i++) {
  await animationResponse.images[i].saveToFile(`wizard_walk_${i}.png`);
}
```

#### Generate 4 Rotations

```javascript
const rotationsResponse = await client.generate4Rotations({
  description: "knight with sword",
  imageSize: { width: 64, height: 64 },
});

// Save each direction
await rotationsResponse.images.south.saveToFile("knight_south.png");
await rotationsResponse.images.north.saveToFile("knight_north.png");
await rotationsResponse.images.east.saveToFile("knight_east.png");
await rotationsResponse.images.west.saveToFile("knight_west.png");
```

#### Get Balance

```javascript
const balance = await client.getBalance();
console.log(`Balance: ${balance.balance} ${balance.currency}`);
```

## Development

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/pixellab-code/pixellab-js.git
cd pixellab-js

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Project Structure

```
pixellab-js/
├── src/
│   ├── client.ts          # Main client class
│   ├── types.ts           # TypeScript types
│   ├── models/            # Data models
│   ├── api/               # API method implementations
│   ├── errors.ts          # Error classes
│   ├── settings.ts        # Configuration
│   └── index.ts           # Main exports
├── tests/                 # Test files
└── dist/                  # Compiled output
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test
npm test -- generateImagePixflux
```

Make sure to set up your test environment variables in `.env.development.secrets`:

```bash
PIXELLAB_SECRET=your-test-secret-key
```

## API Documentation

For complete API documentation, visit [api.pixellab.ai/v1/docs](https://api.pixellab.ai/v1/docs).

## Support

- Documentation: [api.pixellab.ai/v1/docs](https://api.pixellab.ai/v1/docs)
- Discord Community: [Join us](https://discord.gg/pBeyTBF8T7)
- Issues: Please report any SDK issues on our GitHub repository

## License

MIT License - see LICENSE file for details.
