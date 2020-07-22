import * as posenet from "@tensorflow-models/posenet";
import { Keypoint, Vector2D } from "@tensorflow-models/body-pix/dist/types";

const COLOR = "aqua";
const LINE_WIDTH = 2;

function calculateAngle(
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
  [cx, cy]: [number, number]
) {
  const dx1 = ax - bx;
  const dy1 = ay - by;
  const dx2 = cx - bx;
  const dy2 = cy - by;
  const a1 = Math.atan2(dy1, dx1);
  const a2 = Math.atan2(dy2, dx2);
  return [a1, a2];
}

export function drawAngles(
  keypoints: Keypoint[],
  minConfidence: number,
  ctx: CanvasRenderingContext2D
) {
  function toTuple({ x, y }: Vector2D): [number, number] {
    return [x, y];
  }

  const leftShoulder = keypoints.find(
    (keypoint) => keypoint.part === "leftShoulder"
  );
  const leftHip = keypoints.find((keypoint) => keypoint.part === "leftHip");
  const leftKnee = keypoints.find((keypoint) => keypoint.part === "leftKnee");
  const leftAnkle = keypoints.find((keypoint) => keypoint.part === "leftAnkle");

  const rightShoulder = keypoints.find(
    (keypoint) => keypoint.part === "rightShoulder"
  );
  const rightHip = keypoints.find((keypoint) => keypoint.part === "rightHip");
  const rightKnee = keypoints.find((keypoint) => keypoint.part === "rightKnee");
  const rightAnkle = keypoints.find(
    (keypoint) => keypoint.part === "rightAnkle"
  );

  if (
    !leftShoulder ||
    !leftHip ||
    !leftKnee ||
    !leftAnkle ||
    !rightShoulder ||
    !rightHip ||
    !rightKnee ||
    !rightAnkle
  )
    throw new Error("Can not find pose");

  const leftScore =
    leftShoulder.score + leftHip.score + leftKnee.score + leftAnkle.score;
  const rightScore =
    rightShoulder.score + rightHip.score + rightKnee.score + rightAnkle.score;

  const adjacentKeyPoints =
    leftScore > rightScore
      ? [
          [leftShoulder, leftHip, leftKnee],
          [leftHip, leftKnee, leftAnkle],
        ]
      : [
          [rightShoulder, rightHip, rightKnee],
          [rightHip, rightKnee, rightAnkle],
        ];

  adjacentKeyPoints.forEach((keypoints) => {
    const [a1, a2] = calculateAngle(
      toTuple(keypoints[0].position),
      toTuple(keypoints[1].position),
      toTuple(keypoints[2].position)
    );

    console.log(leftScore, rightScore, 'leftscore rightscore');

    ctx.beginPath();
    ctx.moveTo(keypoints[1].position.x, keypoints[1].position.y);
    ctx.arc(keypoints[1].position.x, keypoints[1].position.y, 10, a1, a2);
    ctx.closePath();
    ctx.strokeStyle = "red";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(keypoints[1].position.x, keypoints[1].position.y);
    ctx.arc(keypoints[1].position.x, keypoints[1].position.y, 10, a1, a2, true);
    ctx.closePath();
    ctx.strokeStyle = "blue";
    ctx.stroke();

    ctx.fillStyle = "#333";
    ctx.font = "16px sans-serif";
    const angle1 = Math.floor((((a2 - a1) * 180) / Math.PI + 360) % 360);
    ctx.fillText(
      angle1.toString() + "°",
      keypoints[1].position.x + 10,
      keypoints[1].position.y + 20
    );

    const angle2 = Math.floor((((a1 - a2) * 180) / Math.PI + 360) % 360);
    ctx.fillText(
      angle2.toString() + "°",
      keypoints[1].position.x - ((leftScore > rightScore ? 35 : 35)),
      keypoints[1].position.y + 20
    );
  });
}

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  y: number,
  x: number,
  r: number,
  color: string
) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawSegment(
  [ay, ax]: [number, number],
  [by, bx]: [number, number],
  color: string,
  scale: number,
  ctx: CanvasRenderingContext2D
) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = LINE_WIDTH;
  ctx.strokeStyle = color;
  ctx.stroke();
}

export function drawSkeleton(
  keypoints: Keypoint[],
  minConfidence: number,
  ctx: CanvasRenderingContext2D,
  scale = 1
) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
    keypoints,
    minConfidence
  );

  function toTuple({ y, x }: Vector2D) {
    return [y, x] as [number, number];
  }

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(
      toTuple(keypoints[0].position),
      toTuple(keypoints[1].position),
      COLOR,
      scale,
      ctx
    );
  });
}

export function drawKeypoints(
  keypoints: Keypoint[],
  minConfidence: number,
  ctx: CanvasRenderingContext2D,
  scale = 1
) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const { y, x } = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, COLOR);
  }
}
