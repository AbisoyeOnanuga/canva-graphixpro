import React, { useState } from "react";
import { upload, getTemporaryUrl, ImageRef } from "@canva/asset";
import { Button, Rows, Text, Select, Slider, Link } from "@canva/app-ui-kit";
import { useSelection } from "../utils/use_selection_hook";
import styles from "styles/components.css";
import { invertColors, transformRasterImage as transformInvertImage } from "./features/invertColor/invertColor";
import { applyFilmEffect, transformRasterImage as transformFilmImage } from "./features/filmEffect/filmEffect";
import { applyHalftonePatternGLFX as applyHalftonePattern, transformRasterImage as transformHalftoneImage } from "./features/halftonePattern/halftonePattern";
import { applyWatermark, transformRasterImage as transformWatermarkImage } from "./features/watermark/watermark";

export function App() {
  const currentSelection = useSelection("image");
  const isElementSelected = currentSelection.count > 0;
  const [effectType, setEffectType] = useState("grain");
  const [effectIntensity, setEffectIntensity] = useState(50);
  const [dotSize, setDotSize] = useState(5);
  const [angle, setAngle] = useState(0);
  const [watermarkImage, setWatermarkImage] = useState<ImageRef | null>(null);
  const [watermarkPosition, setWatermarkPosition] = useState("bottom-right");
  const [watermarkTransparency, setWatermarkTransparency] = useState(0.5);
  const [watermarkSize, setWatermarkSize] = useState(0.3);

  async function handleClickInvert() {
    if (!isElementSelected) {
      return;
    }

    const draft = await currentSelection.read();

    for (const content of draft.contents) {
      const newImage = await transformInvertImage(
        content.ref,
        (_, { data }) => {
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
          }
        }
      );

      const asset = await upload({
        type: "IMAGE",
        url: newImage.dataUrl,
        mimeType: newImage.mimeType,
        thumbnailUrl: newImage.dataUrl,
        parentRef: content.ref,
      });

      content.ref = asset.ref;
    }

    await draft.save();
  }

  async function handleClickFilmEffect() {
    if (!isElementSelected) {
      return;
    }

    const draft = await currentSelection.read();

    for (const content of draft.contents) {
      const newImage = await transformFilmImage(
        content.ref,
        async (ctx, imageData) => {
          return await applyFilmEffect(imageData, effectType, effectIntensity);
        }
      );

      const asset = await upload({
        type: "IMAGE",
        url: newImage.dataUrl,
        mimeType: newImage.mimeType,
        thumbnailUrl: newImage.dataUrl,
        parentRef: content.ref,
      });

      content.ref = asset.ref;
    }

    await draft.save();
  }

  async function handleClickHalftonePattern() {
    if (!isElementSelected) {
      return;
    }

    const draft = await currentSelection.read();

    for (const content of draft.contents) {
      const newImage = await transformHalftoneImage(
        content.ref,
        (ctx, imageData) => {
          return applyHalftonePattern(imageData, dotSize, angle);
        }
      );

      const asset = await upload({
        type: "IMAGE",
        url: newImage.dataUrl,
        mimeType: newImage.mimeType,
        thumbnailUrl: newImage.dataUrl,
        parentRef: content.ref,
      });

      content.ref = asset.ref;
    }

    await draft.save();
  }

  async function handleClickWatermark() {
    if (!isElementSelected || !watermarkImage) {
      return;
    }
  
    const draft = await currentSelection.read();
  
    for (const content of draft.contents) {
      const newImage = await transformWatermarkImage(
        content.ref,
        async (ctx, imageData) => {
          const { url } = await getTemporaryUrl({
            type: "IMAGE",
            ref: watermarkImage,
          });
  
          const response = await fetch(url, { mode: "cors" });
          const imageBlob = await response.blob();
          const objectURL = URL.createObjectURL(imageBlob);
          const watermark = new Image();
          watermark.crossOrigin = "Anonymous";
  
          await new Promise((resolve, reject) => {
            watermark.onload = resolve;
            watermark.onerror = () => reject(new Error("Watermark could not be loaded"));
            watermark.src = objectURL;
          });
  
          const result = applyWatermark(imageData, watermark, watermarkPosition, watermarkTransparency, watermarkSize);
          URL.revokeObjectURL(objectURL);
          return result;
        }
      );
  
      const asset = await upload({
        type: "IMAGE",
        url: newImage.dataUrl,
        mimeType: newImage.mimeType,
        thumbnailUrl: newImage.dataUrl,
        parentRef: content.ref,
      });
  
      content.ref = asset.ref;
    }
  
    await draft.save();
  }
  
  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="4u">
        <Text variant="bold">Graphixpro</Text>
        <Text variant="bold">Graphixpro! Select a feature to get started.</Text>

<Text variant="regular">Invert Colors</Text>
<Button
  variant="primary"
  disabled={!isElementSelected}
  onClick={handleClickInvert}
  stretch
>
  Invert Colors
</Button>

<Text variant="regular">Apply Film Effect</Text>
<Select
  options={[
    { label: "Film Grain", value: "grain" },
  ]}
  value={effectType}
  onChange={(value) => setEffectType(value)}
/>
<Slider
  value={effectIntensity}
  onChange={(value) => setEffectIntensity(value)}
  min={0}
  max={100}
  step={1}
/>
<Button
  variant="primary"
  disabled={!isElementSelected}
  onClick={handleClickFilmEffect}
  stretch
>
  Apply Film Effect
</Button>

<Text variant="regular">Apply Halftone Pattern</Text>
<Text>Dot Size</Text>
<Slider
  value={dotSize}
  onChange={(value) => setDotSize(value)}
  min={1}
  max={20}
  step={1}
/>
<Text>Angle</Text>
<Slider
  value={angle}
  onChange={(value) => setAngle(value)}
  min={0}
  max={360}
  step={1}
/>
<Button
  variant="primary"
  disabled={!isElementSelected}
  onClick={handleClickHalftonePattern}
  stretch
>
  Apply Halftone Pattern
</Button>

<Text variant="regular">Apply Watermark</Text>
<Text>Watermark Position</Text>
<Select
  options={[
    { label: "Bottom Right", value: "bottom-right" },
    { label: "Bottom Left", value: "bottom-left" },
    { label: "Top Right", value: "top-right" },
    { label: "Top Left", value: "top-left" },
    { label: "Grid", value: "grid" },
  ]}
  value={watermarkPosition}
  onChange={(value) => setWatermarkPosition(value)}
/>
<Text>Watermark Transparency</Text>
<Slider
  value={watermarkTransparency}
  onChange={(value) => setWatermarkTransparency(value)}
  min={0}
  max={1}
  step={0.1}
/>
<Text>Watermark Size</Text>
<Slider
  value={watermarkSize}
  onChange={(value) => setWatermarkSize(value)}
  min={0.1}
  max={1}
  step={0.1}
/>
<Button
  variant="primary"
  disabled={!isElementSelected}
  onClick={handleClickWatermark}
  stretch
>
  Apply Watermark
</Button>

<Text variant="regular">About Us</Text>
<Text>
  Graphixpro is a powerful image editing app designed to help you create stunning visuals with ease. Our features include color inversion, film effects, halftone patterns, and watermarking. For more information, visit our GitHub repository.
</Text>
<Text size="medium">
  <Link
      href="https://github.com/AbisoyeOnanuga/canva-graphixpro"
      id="github-link"
      requestOpenExternalUrl={() => {}}
      title="Visit Our GitHub"
    >
      Visit Our GitHub
    </Link>
</Text>
</Rows>
</div>
);
}
