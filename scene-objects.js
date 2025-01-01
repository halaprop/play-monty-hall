
import Two from 'https://cdn.skypack.dev/two.js@latest';
import { gsap } from 'https://cdn.skypack.dev/gsap';

import { sprites } from './utils.js';
import { metrics } from './scene-metrics.js';

/*********************************************************************************************************/

export class Host {
  constructor() {
  }

  createScene() {
    const svg = sprites.sprite('monty')
    this.width = svg.width;
    this.height = svg.height;

    const { bubbleXOffsetB, bubbleXOffsetC, bubbleY } = metrics.talkBubbleParams;

    const bubble = new Two.RoundedRectangle(this.width*2, -bubbleY, this.width*2, bubbleY, 10);
    const bubbleTail = new Two.Path([
      new Two.Anchor(this.width, -bubbleY),
      new Two.Anchor(this.width+bubbleXOffsetB, bubbleY/2),
      new Two.Anchor(this.width+bubbleXOffsetC, -bubbleY/2)
    ]);

    this.text = new Two.Text('', this.width*2, -bubbleY, {
      size: 38, alignment: 'center', family: 'Arial'
    });
    this.talkBubble = new Two.Group([bubble, bubbleTail, this.text]);

    this.group = new Two.Group([svg.group, this.talkBubble]);
    this.setTalking(false);
  }

  setTalking(talking, text = '') {
    this.text.value = text;
    this.talkBubble.opacity = talking ? 1 : 0;
  }

  reset() {
    this.setTalking(false);
  }
}

/*********************************************************************************************************/

export class Contestant {
  constructor() {
  }

  createScene() {
    const defaultSvg = sprites.sprite('contst');
    const pointingSvg = sprites.sprite('contst-point');

    this.defaultGroup = defaultSvg.group;
    this.pointingGroup = pointingSvg.group;

    this.group = new Two.Group([this.defaultGroup, this.pointingGroup]);
    this.setPointing(false);
  }

  setPointing(pointing) {
    this.defaultGroup.visible = !pointing;
    this.pointingGroup.visible = pointing;
  }

  async walk(targetX, pxps = 260) {
    const distance = Math.abs(targetX - this.group.translation.x);
    const durationAdj = distance / pxps;
    return gsap.to(this.group.translation, {
      x: targetX,
      duration: durationAdj,
      ease: 'sine'
    });
  }

  async shake(isHorizontal, count, duration) {
    const params = {
      duration,
      repeat: Math.max(1, count - 1),
      yoyo: true,
    };
    if (isHorizontal) {
      params.x = "-=8";
    } else {
      params.y = "+=8";
    }
    return gsap.to(this.group.translation, params);
  }

  reset() {
    this.setPointing(false);
    this.group.translation = new Two.Vector(metrics.playerX, metrics.playerY);
  }
}

/*********************************************************************************************************/

export class Door {
  constructor() {
  }

  createScene(index, label) {
    this.label = label;
    const metric = metrics.doorRects[index];
    this.rRect = new Two.RoundedRectangle(...metric.asParams(), 10);
    this.text = new Two.Text(label, metric.centerX, metric.top + 42, {
      size: 18, alignment: 'center', family: 'Arial'
    });

    const goatSvg = sprites.sprite('goat');
    
    const goatScale = metrics.doorWidth / goatSvg.width * 0.70;
    const goatX = 5 + metric.centerX - (goatSvg.width / 2 * goatScale);
    const goatY = 15 + metric.centerY - (goatSvg.height / 2 * goatScale);

    this.goatGroup = goatSvg.group;
    this.goatGroup.translation = new Two.Vector(goatX, goatY);
    this.goatGroup.scale = goatScale;
    this.goatGroup.visible = false;

    this.group = new Two.Group([this.rRect, this.text, this.goatGroup]);
    return this;
  }

  setGoatVisible(goatVisible) {
    this.rRect.visible = !goatVisible;
    this.text.visible = !goatVisible;
    this.goatGroup.visible = goatVisible;
  }

  reveal(isPrizeDoor, contestantIsWinner=false) {
    if (isPrizeDoor) {
      this.rRect.fill = contestantIsWinner ? 'green' : 'white';
      this.text.fill = contestantIsWinner ? 'white' : 'black';
      this.text.value = '$';
      this.text.size = 32;    
    } else {
      this.setGoatVisible(true);
    }
  }

  reset() {
    this.setGoatVisible(false);
    this.rRect.fill = 'white';
    this.text.fill = 'black';
    this.text.value = this.label;
    this.text.size = 18;    
  }
}
