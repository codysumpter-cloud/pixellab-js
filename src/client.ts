import { settings } from "./settings.js";
import { generateImagePixflux } from "./api/generateImagePixflux.js";
import { generateImageBitforge } from "./api/generateImageBitforge.js";
import { getBalance } from "./api/getBalance.js";
import { animateWithSkeleton } from "./api/animateWithSkeleton.js";
import { animateWithText } from "./api/animateWithText.js";
import { estimateSkeleton } from "./api/estimateSkeleton.js";
import { inpaint } from "./api/inpaint.js";
import { rotate } from "./api/rotate.js";
import { rotate4WithTemplate } from "./api/rotate4WithTemplate.js";
import { rotate8WithTemplate } from "./api/rotate8WithTemplate.js";
import { animateWithTemplate } from "./api/animateWithTemplate.js";
import { generateTileset } from "./api/generateTileset.js";

export class PixelLabClient {
  public readonly secret: string;
  public readonly baseUrl: string;

  constructor(secret: string, baseUrl: string = "https://api.pixellab.ai") {
    this.secret = secret;
    this.baseUrl = baseUrl;
  }

  static fromEnv(): PixelLabClient {
    const config = settings();
    return new PixelLabClient(config.secret, config.baseUrl);
  }

  static fromEnvFile(envFile: string): PixelLabClient {
    const config = settings(envFile);
    return new PixelLabClient(config.secret, config.baseUrl);
  }

  headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.secret}`,
    };
  }

  // API methods - bound to the instance
  generateImagePixflux = generateImagePixflux.bind(this);
  generateImageBitforge = generateImageBitforge.bind(this);
  getBalance = getBalance.bind(this);
  animateWithSkeleton = animateWithSkeleton.bind(this);
  animateWithText = animateWithText.bind(this);
  estimateSkeleton = estimateSkeleton.bind(this);
  inpaint = inpaint.bind(this);
  rotate = rotate.bind(this);
  rotate4WithTemplate = rotate4WithTemplate.bind(this);
  rotate8WithTemplate = rotate8WithTemplate.bind(this);
  animateWithTemplate = animateWithTemplate.bind(this);
  generateTileset = generateTileset.bind(this);
}
