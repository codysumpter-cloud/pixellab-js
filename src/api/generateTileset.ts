import { z } from "zod";
import { fetch } from "../utils/fetch";
import {
  Base64Image,
  ImageSize,
  ImageSizeSchema,
  Usage,
  UsageSchema,
} from "../models/index.js";
import {
  CameraView,
  CameraViewSchema,
  Outline,
  OutlineSchema,
  Shading,
  ShadingSchema,
  Detail,
  DetailSchema,
} from "../types.js";
import { handleHttpError, ValidationError } from "../errors.js";
import type { PixelLabClient } from "../client.js";


export interface GenerateTilesetParams {
  innerDescription: string;
  outerDescription: string;
  imageSize?: ImageSize;
  tileSize?: ImageSize;
  transitionDescription?: string;
  transitionSize?: number;
  textGuidanceScale?: number;
  outline?: Outline;
  shading?: Shading;
  detail?: Detail;
  view?: CameraView;
  seed?: number;
}

export interface GenerateTilesetResponse {
  image: Base64Image;
  usage: Usage;
}


const GenerateTilesetParamsSchema = z.object({
  innerDescription: z.string().min(1),
  outerDescription: z.string().min(1),
  imageSize: ImageSizeSchema.default({ width: 128, height: 128 }),
  tileSize: ImageSizeSchema.default({ width: 16, height: 16 }),
  transitionDescription: z.string().optional(),
  transitionSize: z.number().min(0).max(1).default(0.0),
  textGuidanceScale: z.number().min(1.0).max(20.0).default(8.0),
  outline: OutlineSchema.optional(),
  shading: ShadingSchema.optional(),
  detail: DetailSchema.optional(),
  view: CameraViewSchema.optional(),
  seed: z.number().default(0),
});

const GenerateTilesetResponseSchema = z.object({
  image: z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
  usage: UsageSchema,
});

export async function generateTileset(
  this: PixelLabClient,
  params: GenerateTilesetParams
): Promise<GenerateTilesetResponse> {
  // Validate input parameters
  const validatedParams = GenerateTilesetParamsSchema.parse(params);

  const requestData: any = {
    inner_description: validatedParams.innerDescription,
    outer_description: validatedParams.outerDescription,
    image_size: validatedParams.imageSize,
    tile_size: validatedParams.tileSize,
    transition_size: validatedParams.transitionSize,
    text_guidance_scale: validatedParams.textGuidanceScale,
    seed: validatedParams.seed,
  };

  // Add optional parameters if provided
  if (validatedParams.transitionDescription) {
    requestData.transition_description = validatedParams.transitionDescription;
  }
  if (validatedParams.outline) {
    requestData.outline = validatedParams.outline;
  }
  if (validatedParams.shading) {
    requestData.shading = validatedParams.shading;
  }
  if (validatedParams.detail) {
    requestData.detail = validatedParams.detail;
  }
  if (validatedParams.view) {
    requestData.view = validatedParams.view;
  }

  try {
    const response = await fetch(`${this.baseUrl}/v2/generate-tileset`, {
      method: "POST",
      headers: {
        ...this.headers(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      await handleHttpError(response);
    }

    const data = await response.json();
    const parsedResponse = GenerateTilesetResponseSchema.parse(data);

    return {
      image: Base64Image.fromData(parsedResponse.image),
      usage: parsedResponse.usage,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Response validation failed", error);
    }
    throw error;
  }
}