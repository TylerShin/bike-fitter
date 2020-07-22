import React, { useRef, useEffect } from "react";
import isMobile from "ismobilejs";
import {
  load,
  toColoredPartMask,
  drawPixelatedMask,
} from "@tensorflow-models/body-pix";
import { BodyPixInput } from "@tensorflow-models/body-pix/dist/types";
import { ModelConfig } from "@tensorflow-models/body-pix/dist/body_pix_model";
import { RAINBOW } from "./constants/colorSet";
import { drawKeypoints, drawSkeleton, drawAngles } from "./utils/draw";

function getModelConfig(): ModelConfig {
  if (isMobile(window.navigator).any) {
    return {
      architecture: "MobileNetV1",
      outputStride: 16,
      multiplier: 0.5,
      quantBytes: 2,
    };
  }
  return {
    architecture: "MobileNetV1",
    outputStride: 16,
    multiplier: 0.75,
    quantBytes: 2,
  };
}

function App() {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function loadAndPredict(media: BodyPixInput) {
    const net = await load(getModelConfig());

    const segmentation = await net.segmentPersonParts(media);
    return segmentation;
  }

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    loadAndPredict(imgRef.current!).then((segmentation) => {
      const coloredPartImage = toColoredPartMask(segmentation, RAINBOW);
      const opacity = 0.5;
      const flipHorizontal = false;
      const maskBlurAmount = 0;
      const pixelCellWidth = 5.0;

      drawPixelatedMask(
        canvasRef.current!,
        imgRef.current!,
        coloredPartImage,
        opacity,
        maskBlurAmount,
        flipHorizontal,
        pixelCellWidth
      );

      if (segmentation.allPoses[0].keypoints) {
        drawKeypoints(segmentation.allPoses[0].keypoints, 0.1, ctx);
        drawSkeleton(segmentation.allPoses[0].keypoints, 0.1, ctx);
        drawAngles(segmentation.allPoses[0].keypoints, 0.1, ctx);
      }
    });
  }, []);

  return (
    <div>
      <h1>DEMO</h1>
      <canvas ref={canvasRef} id="canvas" />
      <img
        ref={imgRef}
        src={`${process.env.PUBLIC_URL}/img/demo6.jpg`}
        alt="demo"
        style={{ display: "none" }}
      />
    </div>
  );
}

export default App;
