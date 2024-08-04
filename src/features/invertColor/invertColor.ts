import { getTemporaryUrl, upload, ImageMimeType, ImageRef } from "@canva/asset";

export const invertColors = (imageData: ImageData) => {
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = 255 - imageData.data[i];     // Red
    imageData.data[i + 1] = 255 - imageData.data[i + 1]; // Green
    imageData.data[i + 2] = 255 - imageData.data[i + 2]; // Blue
  }
  return imageData;
};

export async function transformRasterImage(
  ref: ImageRef,
  transformer: (ctx: CanvasRenderingContext2D, imageData: ImageData) => void
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
  transformer(ctx, imageData);
  ctx.putImageData(imageData, 0, 0);
  URL.revokeObjectURL(objectURL);
  const dataUrl = canvas.toDataURL(mimeType);

  return { dataUrl, mimeType };
}

function isSupportedMimeType(
  input: string
): input is "image/jpeg" | "image/heic" | "image/png" | "image/webp" {
  const mimeTypes = ["image/jpeg", "image/heic", "image/png", "image/webp"];
  return mimeTypes.includes(input);
}
