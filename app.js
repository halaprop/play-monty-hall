import Two from 'https://cdn.skypack.dev/two.js@latest';
import { gsap } from 'https://cdn.skypack.dev/gsap';

async function loadSvg(two, url) {
  return new Promise(resolve => {
    two.load(url, (group, svg) => {
      const viewBox = svg.getAttribute('viewBox');
      const [_0, _1, width, height] = viewBox.split(' ').map(Number);
      resolve({ group, width, height })
    });
  });
}

/*********************************************************************************************************/

class Rect {
  constructor(centerX, centerY, width, height) {
    Object.assign(this, { centerX, centerY, width, height });
  }

  asParams() {
    return [this.centerX, this.centerY, this.width, this.height];
  }

  get left() { return this.centerX - this.width / 2; }
  get right() { return this.centerX + this.width / 2; }
  get top() { return this.centerY - this.height / 2; }
  get bottom() { return this.centerY + this.height / 2; }

  containsPoint(x, y) {
    return x >= this.left && x < this.right && y >= this.top && y < this.bottom;
  }
}

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

/*********************************************************************************************************/

class Host {
  constructor() {
  }

  async createScene(two) {
    const svg = await loadSvg(two, './monty.svg');
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
}

/*********************************************************************************************************/

class Contestant {
  constructor() {
  }

  async createScene(two) {
    const defaultSvg = await loadSvg(two, './contst.svg');
    const pointingSvg = await loadSvg(two, './contst-point.svg');

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
    gsap.to(this.group.translation, params);
  }
}

/*********************************************************************************************************/

class Door {
  constructor() {
  }

  // djh - svg load is pretty slow. class level caches the svg. 
  static async goatSvg(two) {
    if (!this._goatSvg) {
      this._goatSvg = await loadSvg(two, './goat.svg');
    }
    return this._goatSvg;
  }

  // instance level caches a clone
  async goatSvg(two) {
    if (!this._goatSvg) {
      const { group, width, height } = await Door.goatSvg(two);
      this._goatSvg = { group: group.clone(), width, height };
    }
    return this._goatSvg;
  }


  async createScene(two, index, label) {
    this.label = label;
    const metric = metrics.doorRects[index];
    this.rRect = new Two.RoundedRectangle(...metric.asParams(), 10);
    this.text = new Two.Text(label, metric.centerX, metric.top + 42, {
      size: 18, alignment: 'center', family: 'Arial'
    });

    const goatSvg = await this.goatSvg(two);
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

  setWinVisible(win) {
    this.rRect.fill = win ? 'green' : 'white';
    this.text.fill = win ? 'white' : 'black';
    this.text.value = win ? '$' : this.label;
    this.text.size = win ? 32 : 18;
  }
}

/*********************************************************************************************************/

class Game {
  constructor(querySelector) {

    this.rootEl = document.body.querySelector(querySelector);
    const elWidth = this.rootEl.offsetWidth;
    const elHeight = elWidth * (metrics.worldHeight / metrics.worldWidth);
    this.two = new Two({ width: elWidth, height: elHeight });

    this.two.appendTo(this.rootEl);

    this.two.scene.translation = new Two.Vector(0, 0);
    const sceneScale = elWidth / metrics.worldWidth;
    this.two.scene.scale = sceneScale;

    // for debug
    // const rect = this.two.makeRectangle(elWidth/sceneScale/2, elHeight/sceneScale/2, elWidth/sceneScale, elHeight/sceneScale-3);
    // rect.fill = 'lightblue';

    gsap.ticker.add(() => {
      this.two.update();
    });
  }

  async createScene() {
    this.host = new Host();
    await this.host.createScene(this.two);

    const hostScale = 0.9 * metrics.doorHeight / this.host.height;
    const contestantScale = metrics.doorHeight / this.host.height;

    this.host.group.translation = new Two.Vector(metrics.hostX, metrics.hostY);
    this.host.group.scale = hostScale;

    const doorQs = ['A', 'B', 'C'].map((label, index) => {
      const door = new Door();
      return door.createScene(this.two, index, label);
    });
    this.doors = await Promise.all(doorQs);

    this.contestant = new Contestant();
    await this.contestant.createScene(this.two);

    this.contestant.group.translation = new Two.Vector(metrics.playerX, metrics.playerY)
    this.contestant.group.scale = contestantScale;

    this.two.add(...this.doors.map(d => d.group));
    this.two.add(this.contestant.group);
    this.two.add(this.host.group);

    this.two.renderer.domElement.addEventListener('click', async (event) => {
      const rect = this.two.renderer.domElement.getBoundingClientRect();
      const sceneScale = this.two.scene.scale;
      const x = (event.clientX - rect.left) / sceneScale;
      const y = (event.clientY - rect.top) / sceneScale;

      const index = metrics.doorRects.findIndex(d => d.containsPoint(x, y));
      if (index >= 0) {
        this.walkToDoor(index);
        //console.log('hit', x, y, door);
      } else {
        //console.log('click', x, y);
      }
    });
  }

  async walkToDoor(index) {
    const targetX = metrics.doorRects[index].left;
    await this.contestant.walk(targetX - 15);
    this.contestant.setPointing(true);
    await this.contestant.shake(false, 10, 0.1);
    this.host.setTalking(true, 'Dumpling');
    this.doors[index].setWinVisible(true);
    this.doors[1].setGoatVisible(true);
    this.doors[0].setGoatVisible(true);
    this.contestant.setPointing(true);

  }
}

/*********************************************************************************************************/

const metrics = new SceneMetrics();

let soloGame, game0, game1, game2;

soloGame = new Game('#solo-root');
soloGame.createScene();

UIkit.util.on(document, 'shown', (event) => {
  const switcher = document.querySelector('[uk-switcher]');
  if (switcher) {
    const activeIndex = UIkit.switcher(switcher).index();
    if (activeIndex == 1 && !game0) {
      game0 = new Game('#root_0');
      game1 = new Game('#root_1');
      game2 = new Game('#root_2');

      [game0, game1, game2].forEach(game => game.createScene());
    }
  }
});


