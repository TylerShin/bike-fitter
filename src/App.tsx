import React, { useRef, useEffect, useState } from 'react';
import { load, toColoredPartMask, drawPixelatedMask } from '@tensorflow-models/body-pix';
import { RAINBOW } from './constants/colorSet';
import { drawKeypoints, drawSkeleton, drawAngles } from './utils/draw';
import s from './App.module.scss';

async function loadModel() {
  const net = await load({ architecture: 'ResNet50', outputStride: 32, quantBytes: 2 });
  return net;
}

function App() {
  const [file, setFile] = useState<File>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!file || (!file.type.includes('image') && !file.type.includes('video'))) return;
    if (!canvasRef.current) return;

    console.log(file.type);

    const ctx = canvasRef.current.getContext('2d');
    const opacity = 0.7;
    const flipHorizontal = false;
    const maskBlurAmount = 0;
    const pixelCellWidth = 5.0;

    async function handleImage() {
      const bodyPix = await loadModel();
      const url = URL.createObjectURL(file);
      imageRef.current!.src = url;

      imageRef.current!.onload = async () => {
        const segmentation = await bodyPix.segmentPersonParts(imageRef.current!);
        const coloredPartImage = toColoredPartMask(segmentation, RAINBOW);

        drawPixelatedMask(
          canvasRef.current!,
          imageRef.current!,
          coloredPartImage,
          opacity,
          maskBlurAmount,
          flipHorizontal,
          pixelCellWidth
        );

        if (segmentation.allPoses.length > 0 && segmentation.allPoses[0].keypoints) {
          drawKeypoints(segmentation.allPoses[0].keypoints, 0.1, ctx!);
          drawSkeleton(segmentation.allPoses[0].keypoints, 0.1, ctx!);
          drawAngles(segmentation.allPoses[0].keypoints, 0.1, ctx!);
        }
      }
    }

    async function handleVideo() {
      console.log("START");
      const bodyPix = await loadModel();
      const url = URL.createObjectURL(file);
      console.log('make url');
      videoRef.current!.onloadedmetadata = () => {
        videoRef.current!.width = videoRef.current!.videoWidth;
        videoRef.current!.height = videoRef.current!.videoHeight;
      }
      videoRef.current!.onloadeddata = async () => {
        console.log("onload!")
        async function segment() {
          const segmentation = await bodyPix.segmentPersonParts(videoRef.current!);
          const coloredPartImage = toColoredPartMask(segmentation, RAINBOW);

          console.log(segmentation);

          drawPixelatedMask(
            canvasRef.current!,
            videoRef.current!,
            coloredPartImage,
            opacity,
            maskBlurAmount,
            flipHorizontal,
            pixelCellWidth
          );

          if (segmentation.allPoses.length > 0 && segmentation.allPoses[0].keypoints) {
            drawKeypoints(segmentation.allPoses[0].keypoints, 0.1, ctx!);
            drawSkeleton(segmentation.allPoses[0].keypoints, 0.1, ctx!);
            drawAngles(segmentation.allPoses[0].keypoints, 0.1, ctx!);
          }

          requestAnimationFrame(segment);
        }

        segment();
      }

      videoRef.current!.src = url;
    }

    if (file.type.includes('image')) {
      handleImage();
    } else {
      handleVideo();
    }
  }, [file]);

  return (
    <div className={s.container}>
      <h1>Simple road-cycle fitter</h1>
      <div className={s.fileForm}>
        <label>
          <input accept="image/*, video/*" onChange={(e) => setFile(e.currentTarget.files?.[0])} type="file" />
          Please upload your riding photo or video
        </label>
      </div>
      <div>
        <canvas ref={canvasRef} id="canvas" />
      </div>
      <img ref={imageRef} style={{ display: 'none' }} alt="Riding img" />
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        loop
        style={{ display: "none" }}
      />
    </div>
  );
}

export default App;
