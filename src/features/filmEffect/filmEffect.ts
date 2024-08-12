import { getTemporaryUrl, upload, ImageMimeType, ImageRef } from "@canva/asset";

export const applyFilmEffect = (imageData: ImageData, effectType: string, intensity: number) => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("CanvasRenderingContext2D is not available");

  switch (effectType) {
    case "grain":
      for (let i = 0; i < imageData.data.length; i += 4) {
        const grain = (Math.random() - 0.5) * intensity;
        imageData.data[i] += grain;     // Red
        imageData.data[i + 1] += grain; // Green
        imageData.data[i + 2] += grain; // Blue
      }
      break;
    case "grunge":
      for (let i = 0; i < imageData.data.length; i += 4) {
        const dirt = (Math.random() - 0.5) * intensity;
        imageData.data[i] += dirt;     // Red
        imageData.data[i + 1] += dirt; // Green
        imageData.data[i + 2] += dirt; // Blue
      }

      for (let i = 0; i < intensity * 10; i++) {
        const x = Math.floor(Math.random() * imageData.width);
        const y = Math.floor(Math.random() * imageData.height);
        const length = Math.floor(Math.random() * 20);
        const angle = Math.random() * Math.PI * 2;
        for (let j = 0; j < length; j++) {
          const dx = Math.floor(x + j * Math.cos(angle));
          const dy = Math.floor(y + j * Math.sin(angle));
          if (dx >= 0 && dx < imageData.width && dy >= 0 && dy < imageData.height) {
            const index = (dy * imageData.width + dx) * 4;
            imageData.data[index] = 255;     // Red
            imageData.data[index + 1] = 255; // Green
            imageData.data[index + 2] = 255; // Blue
          }
        }
      }
      break;
    default:
      break;
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
