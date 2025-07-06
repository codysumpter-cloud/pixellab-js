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


export interface Rotation8Images {
  south: Base64Image;
  "south-east": Base64Image;
  east: Base64Image;
  "north-east": Base64Image;
  north: Base64Image;
  "north-west": Base64Image;
  west: Base64Image;
  "south-west": Base64Image;
}

export interface Generate8RotationsParams {
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

export interface Generate8RotationsResponse {
  images: Rotation8Images;
  usage: Usage;
}


const Rotation8ImagesSchema = z.object({
  south: z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
  "south-east": z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
  east: z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
  "north-east": z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
  north: z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
  "north-west": z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
  west: z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
  "south-west": z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }),
});

const Generate8RotationsParamsSchema = z.object({
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

const Generate8RotationsResponseSchema = z.object({
  images: z.union([Rotation8ImagesSchema, z.record(z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }))]),
  usage: UsageSchema,
});

export async function rotate8WithTemplate(
  this: PixelLabClient,
  params: Generate8RotationsParams
): Promise<Generate8RotationsResponse> {
  // Validate input parameters
  const validatedParams = Generate8RotationsParamsSchema.parse(params);

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
    const response = await fetch(`${this.baseUrl}/v2/rotate8-with-template`, {
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
    const parsedResponse = Generate8RotationsResponseSchema.parse(data);

    // Handle both structured and dict formats
    let images: Rotation8Images;
    if ('south' in parsedResponse.images && 'east' in parsedResponse.images) {
      // Structured format - check for both hyphenated and underscore keys
      const imgData = parsedResponse.images as any;
      images = {
        south: Base64Image.fromData(imgData.south),
        "south-east": Base64Image.fromData(imgData["south-east"] || imgData["south_east"]),
        east: Base64Image.fromData(imgData.east),
        "north-east": Base64Image.fromData(imgData["north-east"] || imgData["north_east"]),
        north: Base64Image.fromData(imgData.north),
        "north-west": Base64Image.fromData(imgData["north-west"] || imgData["north_west"]),
        west: Base64Image.fromData(imgData.west),
        "south-west": Base64Image.fromData(imgData["south-west"] || imgData["south_west"]),
      };
    } else {
      // Dict format - convert to structured
      const imageDict = parsedResponse.images as Record<string, any>;
      images = {
        south: Base64Image.fromData(imageDict.south),
        "south-east": Base64Image.fromData(imageDict["south-east"] || imageDict["south_east"]),
        east: Base64Image.fromData(imageDict.east),
        "north-east": Base64Image.fromData(imageDict["north-east"] || imageDict["north_east"]),
        north: Base64Image.fromData(imageDict.north),
        "north-west": Base64Image.fromData(imageDict["north-west"] || imageDict["north_west"]),
        west: Base64Image.fromData(imageDict.west),
        "south-west": Base64Image.fromData(imageDict["south-west"] || imageDict["south_west"]),
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