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


export interface AnimateWithTemplateParams {
  description: string;
  action?: string;
  imageSize?: ImageSize;
  nFrames?: number;
  textGuidanceScale?: number;
  view?: CameraView;
  direction?: Direction;
  reference?: Record<string, any>;
  outline?: Outline;
  shading?: Shading;
  detail?: Detail;
  isometric?: boolean;
  seed?: number;
}

export interface AnimateWithTemplateResponse {
  images: Base64Image[];
  frameCount: number;
  spritesheet?: Base64Image;
  usage: Usage;
}


const AnimateWithTemplateParamsSchema = z.object({
  description: z.string().min(1),
  action: z.string().default("walking"),
  imageSize: ImageSizeSchema.default({ width: 64, height: 64 }),
  nFrames: z.number().min(2).max(12).optional(),
  textGuidanceScale: z.number().min(1.0).max(20.0).default(8.0),
  view: CameraViewSchema.default("low top-down"),
  direction: DirectionSchema.default("south"),
  reference: z.record(z.any()).optional(),
  outline: OutlineSchema.optional(),
  shading: ShadingSchema.optional(),
  detail: DetailSchema.optional(),
  isometric: z.boolean().default(false),
  seed: z.number().default(0),
});

const AnimateWithTemplateResponseSchema = z.object({
  images: z.union([
    z.array(z.object({
      type: z.literal("base64"),
      base64: z.string(),
      format: z.string().optional().default("png"),
    })),
    z.record(z.object({
      type: z.literal("base64"),
      base64: z.string(),
      format: z.string().optional().default("png"),
    }))
  ]),
  frame_count: z.number(),
  spritesheet: z.object({
    type: z.literal("base64"),
    base64: z.string(),
    format: z.string().optional().default("png"),
  }).optional(),
  usage: UsageSchema,
});

export async function animateWithTemplate(
  this: PixelLabClient,
  params: AnimateWithTemplateParams
): Promise<AnimateWithTemplateResponse> {
  // Validate input parameters
  const validatedParams = AnimateWithTemplateParamsSchema.parse(params);

  const requestData: any = {
    description: validatedParams.description,
    action_description: validatedParams.action,
    image_size: validatedParams.imageSize,
    text_guidance_scale: validatedParams.textGuidanceScale,
    view: validatedParams.view,
    direction: validatedParams.direction,
    isometric: validatedParams.isometric,
    seed: validatedParams.seed,
  };
  
  // Only add n_frames if it's defined
  if (validatedParams.nFrames !== undefined) {
    requestData.n_frames = validatedParams.nFrames;
  }

  // Add optional parameters if provided
  if (validatedParams.reference) {
    (requestData as any).reference = validatedParams.reference;
  }
  if (validatedParams.outline) {
    (requestData as any).outline = validatedParams.outline;
  }
  if (validatedParams.shading) {
    (requestData as any).shading = validatedParams.shading;
  }
  if (validatedParams.detail) {
    (requestData as any).detail = validatedParams.detail;
  }

  try {
    const response = await fetch(`${this.baseUrl}/v2/animate-with-template`, {
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
    const parsedResponse = AnimateWithTemplateResponseSchema.parse(data);

    // Convert images to array if it's an object
    let imagesArray: any[];
    if (Array.isArray(parsedResponse.images)) {
      imagesArray = parsedResponse.images;
    } else {
      // Convert object with frame_0, frame_1, etc. to array
      imagesArray = Object.keys(parsedResponse.images)
        .sort((a, b) => {
          const numA = parseInt(a.replace('frame_', ''));
          const numB = parseInt(b.replace('frame_', ''));
          return numA - numB;
        })
        .map(key => (parsedResponse.images as any)[key]);
    }

    return {
      images: imagesArray.map(imageData => Base64Image.fromData(imageData)),
      frameCount: parsedResponse.frame_count,
      spritesheet: parsedResponse.spritesheet ? Base64Image.fromData(parsedResponse.spritesheet) : undefined,
      usage: parsedResponse.usage,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Response validation failed", error);
    }
    throw error;
  }
}