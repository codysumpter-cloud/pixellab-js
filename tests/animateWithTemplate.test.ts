import { promises as fs } from "fs";
import path from "path";
import { Client } from "../src/index";
import { retryWithBackoff } from "./utils";

describe("Animate with Template", () => {
  test("should generate animation frames", async () => {
    const client = Client.fromEnvFile(".env.development.secrets");

    const response = await retryWithBackoff(async () => {
      return await client.animateWithTemplate({
        description: "human warrior",
        action: "walk",
        imageSize: { width: 32, height: 32 },
        nFrames: 4,
        textGuidanceScale: 8.0,
        view: "low top-down",
        direction: "south",
        seed: 0,
      });
    }, 5, 3000); // 5 retries with 3 second base delay

    // Verify we got a valid response
    expect(response.images).toBeDefined();
    expect(Array.isArray(response.images)).toBe(true);
    expect(response.images.length).toBeGreaterThan(0);
    expect(response.frameCount).toBeDefined();
    expect(response.frameCount).toBe(response.images.length);
    expect(response.usage).toBeDefined();
    expect(response.usage.type).toBe("usd");
    expect(typeof response.usage.usd).toBe("number");

    // Verify each image
    response.images.forEach((image, index) => {
      expect(image.base64).toBeDefined();
      expect(image.format).toBeDefined();
      
      // Verify image buffer
      const buffer = image.toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    // Create results directory
    const resultsDir = path.join("tests", "results");
    await fs.mkdir(resultsDir, { recursive: true });

    // Save the generated images
    for (let i = 0; i < response.images.length; i++) {
      const outputPath = path.join(resultsDir, `animation_frame_${i}.png`);
      await response.images[i].saveToFile(outputPath);

      // Verify file was created
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    }

    // If spritesheet exists, save it
    if (response.spritesheet) {
      const spritesheetPath = path.join(resultsDir, "animation_spritesheet.png");
      await response.spritesheet.saveToFile(spritesheetPath);

      // Verify file was created
      const stats = await fs.stat(spritesheetPath);
      expect(stats.size).toBeGreaterThan(0);
    }
  }, 300000); // 5 minute timeout
});