import React from "react";
import { Button, Rows, Text } from "@canva/app-ui-kit";
import { useSelection } from "utils/use_selection_hook";
import { getTemporaryUrl, upload, ImageMimeType, ImageRef } from "@canva/asset";
import styles from "styles/components.css";

export function App() {
  const currentSelection = useSelection("image");
  const isElementSelected = currentSelection.count > 0;

  const invertColors = (imageData: ImageData) => {
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255 - imageData.data[i];     // Red
      imageData.data[i + 1] = 255 - imageData.data[i + 1]; // Green
      imageData.data[i + 2] = 255 - imageData.data[i + 2]; // Blue
    }
    return imageData;
  };

  async function handleClick() {
    if (!isElementSelected) {
      return;
    }

    const draft = await currentSelection.read();

    for (const content of draft.contents) {
      // Download and transform the image
      const newImage = await transformRasterImage(
        content.ref,
        (_, { data }) => {
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
          }
        }
      );

      // Upload the transformed image
      const asset = await upload({
        type: "IMAGE",
        url: newImage.dataUrl,
        mimeType: newImage.mimeType,
        thumbnailUrl: newImage.dataUrl,
        parentRef: content.ref,
      });

      // Replace the image
      content.ref = asset.ref;
    }

    await draft.save();
  }

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="1u">
        <Text>
          To make changes to this app, edit the <code>src/app.tsx</code> file,
          then close and reopen the app in the editor to preview the changes.
        </Text>
        <Button
          variant="primary"
          disabled={!isElementSelected}
          onClick={handleClick}
          stretch
        >
          Invert Colors
        </Button>
      </Rows>
    </div>
  );
}

/**
 * Downloads and transforms a raster image.
 * @param ref - A unique identifier that points to an image asset in Canva's backend.
 * @param transformer - A function that transforms the image.
 * @returns The data URL and MIME type of the transformed image.
 */
async function transformRasterImage(
  ref: ImageRef,
  transformer: (ctx: CanvasRenderingContext2D, imageData: ImageData) => void
): Promise<{ dataUrl: string; mimeType: ImageMimeType }> {
  // Get a temporary URL for the asset
  const { url } = await getTemporaryUrl({
    type: "IMAGE",
    ref,
  });

  // Download the image
  const response = await fetch(url, { mode: "cors" });
  const imageBlob = await response.blob();

  // Extract MIME type from the downloaded image
  const mimeType = imageBlob.type;

  // Warning: This doesn't attempt to handle SVG images
  if (!isSupportedMimeType(mimeType)) {
    throw new Error(`Unsupported mime type: ${mimeType}`);
  }

  // Create an object URL for the image
  const objectURL = URL.createObjectURL(imageBlob);

  // Define an image element and load image from the object URL
  const image = new Image();
  image.crossOrigin = "Anonymous";

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("Image could not be loaded"));
    image.src = objectURL;
  });

  // Create a canvas and draw the image onto it
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("CanvasRenderingContext2D is not available");
  }

  ctx.drawImage(image, 0, 0);

  // Get the image data from the canvas to manipulate pixels
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  transformer(ctx, imageData);

  // Put the transformed image data back onto the canvas
  ctx.putImageData(imageData, 0, 0);

  // Clean up: Revoke the object URL to free up memory
  URL.revokeObjectURL(objectURL);

  // Convert the canvas content to a data URL with the original MIME type
  const dataUrl = canvas.toDataURL(mimeType);

  return { dataUrl, mimeType };
}

function isSupportedMimeType(
  input: string
): input is "image/jpeg" | "image/heic" | "image/png" | "image/webp" {
  // This does not include "image/svg+xml"
  const mimeTypes = ["image/jpeg", "image/heic", "image/png", "image/webp"];
  return mimeTypes.includes(input);
}
