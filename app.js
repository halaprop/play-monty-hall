import Two from 'https://cdn.skypack.dev/two.js@latest';
import { gsap } from 'https://cdn.skypack.dev/gsap';

import { Host, Contestant, Door } from './scene-objects.js';
import { metrics } from './scene-metrics.js';
import { sprites, Chart } from './utils.js';

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

    gsap.ticker.add(() => {
      this.two.update();
    });
  }

  createScene() {
    this.host = new Host();
    this.host.createScene();

    const hostScale = 0.9 * metrics.doorHeight / this.host.height;
    const contestantScale = metrics.doorHeight / this.host.height;

    this.host.group.translation = new Two.Vector(metrics.hostX, metrics.hostY);
    this.host.group.scale = hostScale;

    this.doors = ['A', 'B', 'C'].map((label, index) => {
      const door = new Door();
      door.createScene(index, label);
      return door;
    });

    this.contestant = new Contestant();
    this.contestant.createScene();

    this.contestant.group.translation = new Two.Vector(metrics.playerX, metrics.playerY);
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
      if (index >= 0 && this.clickResolver) {
        this.clickResolver(index);
        this.clickResolver = null;
      }
    });
  }

  async getNextClick() {
    return new Promise(resolve => this.clickResolver = resolve);
  }

  async contestantWalk(toIndex) {
    const targetX = metrics.doorRects[toIndex].left - 15;
    await this.contestant.walk(targetX);
  }

  reset() {
    this.host.reset();
    this.contestant.reset();
    this.doors.forEach(door => door.reset());
  }

  // strategy is 'manual' 'switcher', 'sticker', 'random'
  async play(strategy='manual') {
    const pause = s => new Promise(resolve => setTimeout(resolve, strategy=='manual' ? s*1000 : 0));

    const prizeDoorIndex = Math.floor(Math.random() * 3);
    await pause(0.5);
    this.host.setTalking(true, 'Choose a door...');

    const initialChoice = strategy=='manual' ? await this.getNextClick() : Math.floor(Math.random() * 3);

    this.host.setTalking(false);
    await this.contestantWalk(initialChoice);
    this.contestant.setPointing(true);

    const revealable = [0, 1, 2].filter(i => i != initialChoice && i != prizeDoorIndex);
    const revealIndex = revealable[Math.floor(Math.random() * revealable.length)];

    await pause(0.5);
    this.host.setTalking(true, 'Switch?');
    this.doors[revealIndex].reveal();

    let finalChoice = await this.switchIndexForStrategy(strategy, initialChoice, revealIndex);

    if (finalChoice == initialChoice) {
      await this.contestant.shake(true, 6, 0.1);
    } else {
      await this.contestantWalk(finalChoice);
    }

    await pause(0.5);
    const contestentWon = finalChoice == prizeDoorIndex;
    this.doors.forEach((door, index) => {
      door.reveal(index == prizeDoorIndex, contestentWon);
    });

    if (contestentWon) {
      this.host.setTalking(true, 'You win!');
      await pause(0.25);
      await this.contestant.shake(false, 10, 0.1);
    } else {
      this.host.setTalking(true, 'You lose :-(');
      await pause(0.25);
      this.contestant.setPointing(false);
    }
    return contestentWon;
  }

  async switchIndexForStrategy(strategy, initialChoice, revealIndex) {
    if (strategy == 'manual') return await this.getNextClick();
    if (strategy == 'sticker') return initialChoice;

    const switchableIndex = [0, 1, 2].find(i => i != initialChoice && i != revealIndex);
    if (strategy == 'switcher') return switchableIndex;

    const shouldSwitch = Math.floor(Math.random() * 2);
    return shouldSwitch ? switchableIndex : initialChoice;
  }

  speedPlay(strategy) {
    const prizeDoorIndex = Math.floor(Math.random() * 3);
    const initialChoice = 0;
    const revealIndex = (prizeDoorIndex == 1) ? 2 : 1;

    let finalChoice = initialChoice;
    if ((strategy == 'switcher') || (strategy == 'random' && Math.floor(Math.random() * 2) == 0)) {
      finalChoice = (revealIndex == 1) ? 2 : 1;
    }
    const contestentWon = finalChoice == prizeDoorIndex;
    return contestentWon;
  }
}

/*********************************************************************************************************/


class Tournament {
  constructor() {
    this.games = ['#root_0', '#root_1', '#root_2'].map(id => new Game(id));
    this.labels = ['lbl-0', 'lbl-1', 'lbl-2'].map(id => document.getElementById(id));
    this.charts = ['chart_0', 'chart_1', 'chart_2'].map(id => new Chart(id)); 
  }

  pause(s) {
    return new Promise(resolve => setTimeout(resolve, s*1000));
  }

  static strategies() {
    return ['sticker', 'switcher', 'random'];
  }

  createScenes() {
    this.games.map(game => game.createScene());    
  }

  reset() {
    this.games.forEach(game => game.reset());
    this.labels.forEach(label => label.innerText = '');
    this.charts.forEach(chart => chart.reset());
  }

  async start(count, speedGames=false) {
    this.reset();
    for (let gameIndex=0; gameIndex<Tournament.strategies().length; gameIndex++) {
      this.playNGames(gameIndex, count, speedGames);
    }
  }

  async playNGames(gameIndex, count, speedGames) {
    const phasePause = speedGames ? 0 : 0.5;
    const loopPause = speedGames ? 0.001 : 0.5;
    await this.pause(Math.random() * phasePause);

    const game = this.games[gameIndex];
    const strategy = Tournament.strategies()[gameIndex];
    const label = this.labels[gameIndex];
    const chart = this.charts[gameIndex];

    let winCount = 0;

    for (let i=0; i<count; i++) {
      game.reset();
      const win = speedGames ? game.speedPlay(strategy) : await game.play(strategy);
      if (win) winCount++;
      label.innerText = `(${winCount} / ${i + 1})`;
      chart.setValue(winCount / (i+1));
      await this.pause(loopPause);
    }
  }
}

/*********************************************************************************************************/

const playButton = document.getElementById('play-btn');
const play10Button = document.getElementById('play-10-btn');
const play100Button = document.getElementById('play-100-btn');
const play1000Button = document.getElementById('play-1000-btn');
const playSpeed1kButton = document.getElementById('play-speed-1000-btn');

let tournament;

window.addEventListener('load', async (event) => {
  await sprites.loadAll();
  const soloGame = new Game('#solo-root');
  soloGame.createScene();
  
  playButton.addEventListener('click', async () => {
    soloGame.reset();
    await soloGame.play('manual');
    playButton.innerText = 'Replay';
  });
});

UIkit.util.on(document, 'shown', async (event) => {
  const switcher = document.querySelector('[uk-switcher]');
  if (switcher) {
    const activeIndex = UIkit.switcher(switcher).index();
    if (activeIndex == 1 && !tournament) {
      tournament = new Tournament();
      tournament.createScenes();

      play10Button.addEventListener('click', () => tournament.start(10));
      play100Button.addEventListener('click', () => tournament.start(100));
      play1000Button.addEventListener('click', () => tournament.start(1000));
      playSpeed1kButton.addEventListener('click', () => tournament.start(1000, true));
    }
  }
});
