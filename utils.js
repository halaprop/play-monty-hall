
import Two from 'https://cdn.skypack.dev/two.js@latest';

/*********************************************************************************************************/

class Sprites {
  constructor() {
  }

  async loadAll() {
    const promises = ['monty', 'contst', 'contst-point', 'goat'].map(async key => {
      const svg = await Sprites.loadSvg(key);
      return [key, svg];
    });
    const entries = await Promise.all(promises);
    this.sprites = Object.fromEntries(entries);
  }

  sprite(key) {
    const { group, width, height } = this.sprites[key];
    return { group: group.clone(), width, height };
  }

  static async loadSvg(name) {
    const url = `./svgs/${name}.svg`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${response.statusText}`);
    }
    const svgText = await response.text();

    const parser = new DOMParser();
    const svg = parser.parseFromString(svgText, "image/svg+xml").documentElement;
    const viewBox = svg.getAttribute('viewBox');
    if (!viewBox) {
      throw new Error('SVG does not have a viewBox attribute');
    }
    const [_0, _1, width, height] = viewBox.split(' ').map(Number);
    const two = new Two({ width, height });
    const group = two.interpret(svg);

    return { group, width, height };
  }
}

export const sprites = new Sprites();

/*********************************************************************************************************/

export class Rect {
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

export class Chart {
  constructor(rootID) {
    this.rootID = rootID;
    this.value = 0

    this.data = [
      {
        type: "indicator",
        value: this.value,
        delta: { reference: 0 },
        gauge: { axis: { visible: false, range: [0, 1.0] } },
        domain: { x: [0, 1], y: [0, 1] } // Full plot area for a single gauge
      },
    ];

    this.layout = {
      width: 240, // Adjust the width
      height: 190, // Adjust the height
      margin: { t: 0, b: 60, l: 5, r: 5 },
      template: {
        data: {
          indicator: [
            {
              mode: "number+delta+gauge",
              delta: { reference: 90 }
            }
          ]
        }
      }
    };
    Plotly.newPlot(this.rootID, this.data, this.layout);
  }

  reset() {
    this.value = 0;
    this.setValue(0);
  }

  setValue(value) {
    Plotly.restyle(this.rootID, {
      value: [value],               // New value
      'delta.reference': [this.value] // Use the current value as the new reference
    }, 0);
    this.value = value; // Update `this.value` after the restyle
  }
}
