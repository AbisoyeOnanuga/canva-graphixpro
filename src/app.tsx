import React, { useState } from "react";
import { upload } from "@canva/asset";
import { Button, Rows, Text, Select, Slider } from "@canva/app-ui-kit";
import { useSelection } from "utils/use_selection_hook";
import styles from "styles/components.css";
import { invertColors, transformRasterImage as transformInvertImage } from "./features/invertColor/invertColor";
import { applyFilmEffect, transformRasterImage as transformFilmImage } from "./features/filmEffect/filmEffect";
import { applyChevronPattern, transformRasterImage as transformChevronImage } from "./features/chevronPattern/chevronPattern";
import { applyHalftonePatternWebGL as applyHalftonePattern, transformRasterImage as transformHalftoneImage } from "./features/halftonePattern/halftonePattern";

export function App() {
  const currentSelection = useSelection("image");
  const isElementSelected = currentSelection.count > 0;
  const [effectType, setEffectType] = useState("grain");
  const [effectIntensity, setEffectIntensity] = useState(50);
  const [patternSize, setPatternSize] = useState(10);
  const [dotSize, setDotSize] = useState(5);
  const [angle, setAngle] = useState(0);

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

  async function handleClickChevronPattern() {
    if (!isElementSelected) {
      return;
    }

    const draft = await currentSelection.read();

    for (const content of draft.contents) {
      const newImage = await transformChevronImage(
        content.ref,
        (ctx, imageData) => {
          return applyChevronPattern(imageData, patternSize);
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
      <Rows spacing="2u">
        <Text>
          To make changes to this app, edit the <code>src/app.tsx</code> file,
          then close and reopen the app in the editor to preview the changes.
        </Text>
        <Button
          variant="primary"
          disabled={!isElementSelected}
          onClick={handleClickInvert}
          stretch
        >
          Invert Colors
        </Button>
        <Select
          options={[
            { label: "Film Grain", value: "grain" },
            { label: "Grunge", value: "grunge" },
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
        <Slider
          value={dotSize}
          onChange={(value) => setDotSize(value)}
          min={1}
          max={20}
          step={1}
        />
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
        <Slider
          value={patternSize}
          onChange={(value) => setPatternSize(value)}
          min={1}
          max={50}
          step={1}
        />
        <Button
          variant="primary"
          disabled={!isElementSelected}
          onClick={handleClickChevronPattern}
          stretch
        >
          Apply Chevron Pattern
        </Button>
      </Rows>
    </div>
  );
}
