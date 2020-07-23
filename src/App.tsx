import React, { useRef, useEffect } from "react";
import isMobile from "ismobilejs";
import {
  load,
  toColoredPartMask,
  drawPixelatedMask,
} from "@tensorflow-models/body-pix";
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
    multiplier: 0.5,
    quantBytes: 2,
  };
}

async function loadModel() {
  const net = await load(getModelConfig());
  return net;
}

function App() {
  // const imgRef = useRef<HTMLImageElement>(null);
  const imgRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    imgRef.current!.onloadeddata = () => {
      imgRef.current!.playbackRate = 0.1;
      loadModel().then((bodyPix) => {
        async function bodySegmentationFrame() {
          if (!canvasRef.current) return;
          const ctx = canvasRef.current.getContext("2d");
          if (!ctx) return;

          const segmentation = await bodyPix.segmentPersonParts(
            imgRef.current!
          );
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

          requestAnimationFrame(bodySegmentationFrame);
        }

        bodySegmentationFrame();
      });
    };
  }, []);

  return (
    <div>
      <h1>DEMO</h1>
      <canvas ref={canvasRef} id="canvas" />
      <img
        // ref={imgRef}
        src={`${process.env.PUBLIC_URL}/img/demo6.jpg`}
        alt="demo"
        style={{ display: "none" }}
      />
      <video
        ref={imgRef}
        width={800}
        height={600}
        autoPlay
        muted
        playsInline
        loop
        style={{ display: "none" }}
        src={`${process.env.PUBLIC_URL}/img/demo_video.mp4`}
      ></video>
    </div>
  );
}

export default App;
