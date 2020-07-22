import React, { useRef, useEffect } from "react";
import isMobile from "ismobilejs";
import {
  load,
  toColoredPartMask,
  drawPixelatedMask,
} from "@tensorflow-models/body-pix";
import { BodyPixInput } from "@tensorflow-models/body-pix/dist/types";
import { ModelConfig } from "@tensorflow-models/body-pix/dist/body_pix_model";

function calculateAngle(px: number, py: number, ax: number, ay: number) {
  return Math.atan2(ay - py, ax - px) * 180 / Math.PI;
}

const rainbow = [
  [110, 64, 170],
  [106, 72, 183],
  [100, 81, 196],
  [92, 91, 206],
  [84, 101, 214],
  [75, 113, 221],
  [66, 125, 224],
  [56, 138, 226],
  [48, 150, 224],
  [40, 163, 220],
  [33, 176, 214],
  [29, 188, 205],
  [26, 199, 194],
  [26, 210, 182],
  [28, 219, 169],
  [33, 227, 155],
  [41, 234, 141],
  [51, 240, 128],
  [64, 243, 116],
  [79, 246, 105],
  [96, 247, 97],
  [115, 246, 91],
  [134, 245, 88],
  [155, 243, 88],
];

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
    loadAndPredict(imgRef.current!).then((segmentation) => {
      console.log("figured out segments");
      console.log(segmentation);
      const coloredPartImage = toColoredPartMask(
        segmentation,
        rainbow as [number, number, number][]
      );
      const opacity = 0.7;
      const flipHorizontal = false;
      const maskBlurAmount = 0;
      const pixelCellWidth = 5.0;
      // Draw the pixelated colored part image on top of the original image onto a
      // canvas.  Each pixel cell's width will be set to 10 px. The pixelated colored
      // part image will be drawn semi-transparent, with an opacity of 0.7, allowing
      // for the original image to be visible under.
      drawPixelatedMask(
        canvasRef.current!,
        imgRef.current!,
        coloredPartImage,
        opacity,
        maskBlurAmount,
        flipHorizontal,
        pixelCellWidth
      );

      const rightHip = segmentation.allPoses[0].keypoints.find(
        (point) => point.part === "rightHip"
      );
      const rightKnee = segmentation.allPoses[0].keypoints.find(
        (point) => point.part === "rightKnee"
      );
      const rightAnkle = segmentation.allPoses[0].keypoints.find(
        (point) => point.part === "rightAnkle"
      );
      console.log(
        calculateAngle(
          rightHip!.position.x,
          rightHip!.position.y,
          rightKnee!.position.x,
          rightKnee!.position.y
        )
      );
    });
  }, []);

  return (
    <div>
      <h1>DEMO</h1>
      <canvas ref={canvasRef} id="canvas" />
      <img
        ref={imgRef}
        src={`${process.env.PUBLIC_URL}/img/demo1.jpg`}
        alt="demo"
        style={{ display: "none" }}
      />
    </div>
  );
}

export default App;
