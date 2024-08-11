import { getTemporaryUrl, upload, ImageMimeType, ImageRef } from "@canva/asset";

export const applyWatermark = (
  imageData: ImageData,
  watermark: HTMLImageElement,
  position: string,
  transparency: number,
  size: number
) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CanvasRenderingContext2D is not available");

  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);

  const watermarkWidth = canvas.width * size;
  const watermarkHeight = (watermark.height / watermark.width) * watermarkWidth;

  ctx.globalAlpha = transparency;

  let x = 0;
  let y = 0;

  switch (position) {
    case "top-left":
      x = 10;
      y = 10;
      break;
    case "top-right":
      x = canvas.width - watermarkWidth - 10;
      y = 10;
      break;
    case "bottom-left":
      x = 10;
      y = canvas.height - watermarkHeight - 10;
      break;
    case "bottom-right":
      x = canvas.width - watermarkWidth - 10;
      y = canvas.height - watermarkHeight - 10;
      break;
    default:
      x = canvas.width - watermarkWidth - 10;
      y = canvas.height - watermarkHeight - 10;
  }

  ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);

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
