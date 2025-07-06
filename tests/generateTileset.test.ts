import { promises as fs } from "fs";
import path from "path";
import { Client } from "../src/index";
import { retryWithBackoff } from "./utils";

describe("Generate Tileset", () => {
  test("should generate seamless tileset", async () => {
    const client = Client.fromEnvFile(".env.development.secrets");

    const response = await retryWithBackoff(async () => {
      return await client.generateTileset({
        innerDescription: "grass field",
        outerDescription: "forest",
        imageSize: { width: 32, height: 32 },
        tileSize: { width: 8, height: 8 },
        transitionDescription: "edge between grass and trees",
        textGuidanceScale: 8.0,
        view: "high top-down",
        seed: 0,
      });
    }, 5, 3000); // 5 retries with 3 second base delay

    // Verify we got a valid response
    expect(response.image).toBeDefined();
    expect(response.image.base64).toBeDefined();
    expect(response.image.format).toBeDefined();
    expect(response.usage).toBeDefined();
    expect(response.usage.type).toBe("usd");
    expect(typeof response.usage.usd).toBe("number");

    // Verify image buffer
    const buffer = response.image.toBuffer();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // Create results directory
    const resultsDir = path.join("tests", "results");
    await fs.mkdir(resultsDir, { recursive: true });

    // Save the generated tileset
    const outputPath = path.join(resultsDir, "generated_tileset.png");
    await response.image.saveToFile(outputPath);

    // Verify file was created
    const stats = await fs.stat(outputPath);
    expect(stats.size).toBeGreaterThan(0);
  }, 300000); // 5 minute timeout
});