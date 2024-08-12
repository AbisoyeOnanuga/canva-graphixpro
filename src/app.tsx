import React, { useState } from "react";
import { upload, getTemporaryUrl, ImageRef } from "@canva/asset";
import { Button, Rows, Text, Select, Slider, Link } from "@canva/app-ui-kit";
import { useSelection } from "../utils/use_selection_hook";
import styles from "styles/components.css";
import { invertColors, transformRasterImage as transformInvertImage } from "./features/invertColor/invertColor";
import { applyFilmEffect, transformRasterImage as transformFilmImage } from "./features/filmEffect/filmEffect";
import { applyHalftonePatternGLFX as applyHalftonePattern, transformRasterImage as transformHalftoneImage } from "./features/halftonePattern/halftonePattern";
import { applyEffect, transformRasterImage as transformEffectImage } from "./features/watermark/effect";
import { addNativeElement, getCurrentPageContext } from "@canva/design";

export function App() {
  const currentSelection = useSelection("image");
  const isElementSelected = currentSelection.count > 0;
  const [effectType, setEffectType] = useState("grain");
  const [effectIntensity, setEffectIntensity] = useState(50);
  const [dotSize, setDotSize] = useState(5);
  const [angle, setAngle] = useState(0);
  const [effectTransparency, setEffectTransparency] = useState(0.5);
  const [effectSize, setEffectSize] = useState(0.5);
  const [effectPosition, setEffectPosition] = useState("bottom-right");

  async function handleClickEffect() {
    if (!isElementSelected) {
      return;
    }
  
    const draft = await currentSelection.read();
  
    for (const content of draft.contents) {
      const newImage = await transformEffectImage(
        content.ref,
        (ctx, imageData) => {
          return applyEffect(imageData, effectTransparency, effectSize);
        }
      );
  
      const asset = await upload({
        type: "IMAGE",
        url: newImage.dataUrl,
        mimeType: newImage.mimeType,
        thumbnailUrl: newImage.dataUrl,
        parentRef: content.ref,
      });
  
      const context = await getCurrentPageContext();
      const pageWidth = context.dimensions?.width ?? 100;
      const pageHeight = context.dimensions?.height ?? 100;
      const width = pageWidth * effectSize;
      const height = pageHeight * effectSize;
  
      if (effectPosition === "grid") {
        const gridSize = 3;
        const cellWidth = width / gridSize;
        const cellHeight = height / gridSize;
        const spacing = (pageWidth - width) / (gridSize + 1);
  
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const top = row * (cellHeight + spacing) + spacing;
            const left = col * (cellWidth + spacing) + spacing;
  
            await addNativeElement({
              type: "IMAGE",
              ref: asset.ref,
              width: cellWidth,
              height: cellHeight,
              top,
              left,
            });
          }
        }
      } else if (effectPosition === "corners") {
        const positions = [
          { top: 0, left: 0 }, // top-left
          { top: 0, left: pageWidth - width }, // top-right
          { top: pageHeight - height, left: 0 }, // bottom-left
          { top: pageHeight - height, left: pageWidth - width }, // bottom-right
        ];
  
        for (const pos of positions) {
          await addNativeElement({
            type: "IMAGE",
            ref: asset.ref,
            width,
            height,
            top: pos.top,
            left: pos.left,
          });
        }
      } else {
        let top = 0;
        let left = 0;
  
        switch (effectPosition) {
          case "top-left":
            top = 0;
            left = 0;
            break;
          case "top-right":
            top = 0;
            left = pageWidth - width;
            break;
          case "bottom-left":
            top = pageHeight - height;
            left = 0;
            break;
          case "bottom-right":
            top = pageHeight - height;
            left = pageWidth - width;
            break;
          default:
            top = pageHeight - height;
            left = pageWidth - width;
        }
  
        await addNativeElement({
          type: "IMAGE",
          ref: asset.ref,
          width,
          height,
          top,
          left,
        });
      }
  
      // Remove the original image
      content.ref = asset.ref;
    }
  
    await draft.save();
  }  
  
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

        <Text variant="bold">Apply Watermark Effect</Text>
        <Text>Watermark Transparency</Text>
        <Slider
          value={effectTransparency}
          onChange={(value) => setEffectTransparency(value)}
          min={0}
          max={1}
          step={0.1}
        />
        <Text>Watermark Size</Text>
        <Slider
          value={effectSize}
          onChange={(value) => setEffectSize(value)}
          min={0.1}
          max={0.5}
          step={0.1}
        />
        <Text>Watermark Position</Text>
        <Select
          options={[
            { label: "Bottom Right", value: "bottom-right" },
            { label: "Bottom Left", value: "bottom-left" },
            { label: "Top Right", value: "top-right" },
            { label: "Top Left", value: "top-left" },
            { label: "Grid", value: "grid" },
            { label: "Corners", value: "corners" },
          ]}
          value={effectPosition}
          onChange={(value) => setEffectPosition(value)}
        />
        <Button
          variant="primary"
          disabled={!isElementSelected}
          onClick={handleClickEffect}
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
            requestOpenExternalUrl={() => {
              console.log("Request to open external URL");
            }}
            title="Visit Our GitHub"
          >
            Visit Our GitHub
          </Link>
        </Text>
      </Rows>
    </div>
  );
}
