

export async function loadSvg(two, name) {
  const url = `./svgs/${name}.svg`;
  return new Promise(resolve => {
    two.load(url, (group, svg) => {
      const viewBox = svg.getAttribute('viewBox');
      const [_0, _1, width, height] = viewBox.split(' ').map(Number);
      resolve({ group, width, height })
    });
  });
}

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

  setValue(value) {
    Plotly.restyle(this.rootID, {
      value: [value],               // New value
      'delta.reference': [this.value] // Use the current value as the new reference
    }, 0);
    this.value = value; // Update `this.value` after the restyle
  }
}
