import { getTemporaryUrl, upload, ImageMimeType, ImageRef } from "@canva/asset";

export const applyWatermark = async (imageData: ImageData, watermarkUrl: string) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CanvasRenderingContext2D is not available");

  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);

  const watermark = new Image();
  watermark.crossOrigin = "Anonymous";
  await new Promise((resolve, reject) => {
    watermark.onload = resolve;
    watermark.onerror = () => reject(new Error("Watermark could not be loaded"));
    watermark.src = watermarkUrl;
  });

  const watermarkWidth = canvas.width * 0.3; // Adjust size as needed
  const watermarkHeight = (watermark.height / watermark.width) * watermarkWidth;
  ctx.drawImage(watermark, canvas.width - watermarkWidth - 10, canvas.height - watermarkHeight - 10, watermarkWidth, watermarkHeight);

  return canvas.toDataURL();
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

  return { dataUrl: newImageDataUrl, mimeType };
}

function isSupportedMimeType(
  input: string
): input is "image/jpeg" | "image/heic" | "image/png" | "image/webp" {
  const mimeTypes = ["image/jpeg", "image/heic", "image/png", "image/webp"];
  return mimeTypes.includes(input);
}
