export function calculateAngle(px: number, py: number, ax: number, ay: number) {
    return Math.atan2(ay - py, ax - px) * 180 / Math.PI;
  }