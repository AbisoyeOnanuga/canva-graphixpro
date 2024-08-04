import { getTemporaryUrl, upload, ImageMimeType, ImageRef } from "@canva/asset";

export const applyChevronPattern = (imageData: ImageData, patternSize: number): string => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CanvasRenderingContext2D is not available");

  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);

  ctx.fillStyle = "#000";
  for (let y = 0; y < canvas.height; y += patternSize * 2) {
    for (let x = 0; x < canvas.width; x += patternSize * 2) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + patternSize, y + patternSize);
      ctx.lineTo(x, y + patternSize * 2);
      ctx.lineTo(x - patternSize, y + patternSize);
      ctx.closePath();
      ctx.fill();
    }
  }

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
  const newImageData = transformer(ctx, imageData);
  URL.revokeObjectURL(objectURL);

  return { dataUrl: newImageData, mimeType };
}

function isSupportedMimeType(
  input: string
): input is "image/jpeg" | "image/heic" | "image/png" | "image/webp" {
  const mimeTypes = ["image/jpeg", "image/heic", "image/png", "image/webp"];
  return mimeTypes.includes(input);
}
