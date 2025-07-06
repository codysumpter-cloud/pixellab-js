import { promises as fs } from "fs";
import path from "path";
import { Client } from "../src/index";
import { retryWithBackoff } from "./utils";

describe("Rotate 4 With Template", () => {
  test("should generate character in 4 directions", async () => {
    const client = Client.fromEnvFile(".env.development.secrets");

    const response = await retryWithBackoff(async () => {
      return await client.rotate4WithTemplate({
        description: "cute wizard",
        imageSize: { width: 32, height: 32 },
        textGuidanceScale: 8.0,
        view: "low top-down",
        seed: 0,
      });
    }, 5, 3000); // 5 retries with 3 second base delay

    // Verify we got a valid response
    expect(response.images).toBeDefined();
    expect(response.images.south).toBeDefined();
    expect(response.images.west).toBeDefined();
    expect(response.images.east).toBeDefined();
    expect(response.images.north).toBeDefined();
    expect(response.usage).toBeDefined();
    expect(response.usage.type).toBe("usd");
    expect(typeof response.usage.usd).toBe("number");

    // Verify each image
    for (const [direction, image] of Object.entries(response.images)) {
      expect(image.base64).toBeDefined();
      expect(image.format).toBeDefined();
      
      // Verify image buffer
      const buffer = image.toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    }

    // Create results directory
    const resultsDir = path.join("tests", "results");
    await fs.mkdir(resultsDir, { recursive: true });

    // Save the generated images
    for (const [direction, image] of Object.entries(response.images)) {
      const outputPath = path.join(resultsDir, `4_rotations_${direction}.png`);
      await image.saveToFile(outputPath);

      // Verify file was created
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    }
  }, 300000); // 5 minute timeout
});