import { getTemporaryUrl, upload, ImageMimeType, ImageRef } from "@canva/asset";
import * as fx from 'glfx';

export const applyHalftonePatternGLFX = (imageData: ImageData, dotSize: number, angle: number) => {
  const canvas = fx.canvas();
  const texture = canvas.texture(imageData);

  canvas.draw(texture)
    .dotScreen(canvas.width / 2, canvas.height / 2, angle, dotSize)
    .update();

  return canvas.toDataURL('image/png'); // Ensure the format is PNG
};

export async function transformRasterImage(
  ref: ImageRef,
  transformer: (ctx: CanvasRenderingContext2D, imageData: ImageData) => string
): Promise<{ dataUrl: string; mimeType: ImageMimeType }> {
  const { url } = await getTemporaryUrl({
    type: "IMAGE",
    ref,
  });

  const response = await fetch(url, { mode: "cors" });
  const imageBlob = await response.blob();
  const mimeType = imageBlob.type;

  if (!isSupportedMimeType(mimeType)) {
    throw new Error(`Unsupported mime type: ${mimeType}`);
  }

  const objectURL = URL.createObjectURL(imageBlob);
  const image = new Image();
  image.crossOrigin = "Anonymous";

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("Image could not be loaded"));
    image.src = objectURL;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("CanvasRenderingContext2D is not available");
  }

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const newImageDataUrl = transformer(ctx, imageData);
  URL.revokeObjectURL(objectURL);

  return { dataUrl: newImageDataUrl, mimeType: 'image/png' }; // Ensure the mime type is PNG
}

function isSupportedMimeType(
  input: string
): input is "image/jpeg" | "image/heic" | "image/png" | "image/webp" {
  const mimeTypes = ["image/jpeg", "image/heic", "image/png", "image/webp"];
  return mimeTypes.includes(input);
}
