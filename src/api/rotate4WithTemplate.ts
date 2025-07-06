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
  Direction,
  DirectionSchema,
  Outline,
  OutlineSchema,
  Shading,
  ShadingSchema,
  Detail,
  DetailSchema,
} from "../types.js";
import { handleHttpError, ValidationError } from "../errors.js";
import type { PixelLabClient } from "../client.js";


export interface RotationImages {
  south: Base64Image;
  west: Base64Image;
  east: Base64Image;
  north: Base64Image;
}

export interface Generate4RotationsParams {
  description: string;
  imageSize: ImageSize;
  textGuidanceScale?: number;
  reference?: Record<string, any>;
  view?: CameraView;
  outline?: Outline;
  shading?: Shading;
  detail?: Detail;
  direction?: Direction;
  isometric?: boolean;
  colorImage?: { base64: string } | { type: string; base64: string };
  forceColors?: boolean;
  seed?: number;
  outputType?: "dict" | "list";
}

export interface Generate4RotationsResponse {
  images: RotationImages;
  usage: Usage;
}


const RotationImagesSchema = z.object({
  south: z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
  west: z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
  east: z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
  north: z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
});

const Generate4RotationsParamsSchema = z.object({
  description: z.string().min(1),
  imageSize: ImageSizeSchema,
  textGuidanceScale: z.number().min(1.0).max(20.0).default(8.0),
  reference: z.record(z.any()).optional(),
  view: CameraViewSchema.default("low top-down"),
  outline: OutlineSchema.optional(),
  shading: ShadingSchema.optional(),
  detail: DetailSchema.optional(),
  direction: DirectionSchema.optional(),
  isometric: z.boolean().default(false),
  colorImage: z.union([
    z.object({ base64: z.string() }),
    z.object({ type: z.string(), base64: z.string() })
  ]).optional(),
  forceColors: z.boolean().default(false),
  seed: z.number().optional(),
  outputType: z.enum(["dict", "list"]).default("dict"),
});

const Generate4RotationsResponseSchema = z.object({
  images: z.union([RotationImagesSchema, z.record(z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }))]),
  usage: UsageSchema,
});

export async function rotate4WithTemplate(
  this: PixelLabClient,
  params: Generate4RotationsParams
): Promise<Generate4RotationsResponse> {
  // Validate input parameters
  const validatedParams = Generate4RotationsParamsSchema.parse(params);

  const requestData: any = {
    description: validatedParams.description,
    image_size: validatedParams.imageSize,
    text_guidance_scale: validatedParams.textGuidanceScale,
    view: validatedParams.view,
    isometric: validatedParams.isometric,
    force_colors: validatedParams.forceColors,
    output_type: validatedParams.outputType,
  };

  // Add optional parameters if provided
  if (validatedParams.reference) {
    requestData.reference = validatedParams.reference;
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
  if (validatedParams.direction) {
    requestData.direction = validatedParams.direction;
  }
  if (validatedParams.colorImage) {
    requestData.color_image = validatedParams.colorImage;
  }
  if (validatedParams.seed !== undefined) {
    requestData.seed = validatedParams.seed;
  }

  try {
    const response = await fetch(`${this.baseUrl}/v2/rotate4-with-template`, {
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
    const parsedResponse = Generate4RotationsResponseSchema.parse(data);

    // Handle both structured and dict formats
    let images: RotationImages;
    if ('south' in parsedResponse.images && 'west' in parsedResponse.images) {
      // Structured format
      images = {
        south: Base64Image.fromData((parsedResponse.images as any).south),
        west: Base64Image.fromData((parsedResponse.images as any).west),
        east: Base64Image.fromData((parsedResponse.images as any).east),
        north: Base64Image.fromData((parsedResponse.images as any).north),
      };
    } else {
      // Dict format - convert to structured
      const imageDict = parsedResponse.images as Record<string, any>;
      images = {
        south: Base64Image.fromData(imageDict.south),
        west: Base64Image.fromData(imageDict.west),
        east: Base64Image.fromData(imageDict.east),
        north: Base64Image.fromData(imageDict.north),
      };
    }

    return {
      images,
      usage: parsedResponse.usage,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Response validation failed", error);
    }
    throw error;
  }
}