import { Rect } from "./utils.js";

/*********************************************************************************************************/

class SceneMetrics {
  constructor() {
    this.worldWidth = 600
    this.worldHeight = 300;
    this.marginX = 20;
  }

  get worldCenterX() {
    return this.worldWidth / 2;
  }
  get worldCenterY() {
    return this.worldHeight / 2;
  }
  get doorCenterY() {
    return this.worldCenterY * 7 / 8;
  }
  get doorHeight() {
    return this.worldHeight / 2;
  }
  get doorWidth() {
    return this.doorHeight * 1 / 2;
  }
  get doorRects() {
    return [
      new Rect(this.worldCenterX - this.doorWidth - this.marginX, this.doorCenterY, this.doorWidth, this.doorHeight),
      new Rect(this.worldCenterX, this.doorCenterY, this.doorWidth, this.doorHeight),
      new Rect(this.worldCenterX + this.doorWidth + this.marginX, this.doorCenterY, this.doorWidth, this.doorHeight),
    ];
  }
  get hostX() {
    return this.doorRects[0].centerX - this.doorWidth - (4 * this.marginX);
  }
  get hostY() {
    return this.doorRects[0].top;
  }

  get talkBubbleParams() {
    return {
      bubbleXOffsetB: -50,
      bubbleXOffsetC: 20,
      bubbleY: 70
    };
  }

  get playerX() {
    return this.hostX + this.doorWidth;
  }
  get playerY() {
    return this.worldCenterY - this.doorHeight / 3;
  }
}

export const metrics = new SceneMetrics();