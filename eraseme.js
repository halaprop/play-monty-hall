/*********************************************************************************************************/
/*********************************************************************************************************/

// const rootEl = document.body.querySelector('#solo-root');
// const sceneWidth = rootEl.offsetWidth;
// const sceneHeight = Math.round(sceneWidth * 9 / 16);

// const two = new Two({ width: sceneWidth, height: sceneHeight }).appendTo(rootEl);

// //const rect = two.makeRectangle(sceneWidth / 2, sceneHeight / 2, sceneWidth, sceneHeight);
// //rect.fill = 'lightblue';

// let contestantGroup;
// let contestantA, contestantB;

// let sceneScale = 1;

async function start() {
  let { group: montyGroup, width: montyWidth, height: montyHeight } = await loadSvg('./monty.svg');

  const doorWidth = 140;
  const doorHeight = montyHeight;
  const margin = 20;

  const centerY = (sceneHeight - montyHeight) / 2;
  const bX = sceneWidth / 2;
  const aX = bX - doorWidth - margin;
  const cX = bX + doorWidth + margin;
  const hostX = aX - doorWidth - montyWidth;
  montyGroup.translation = new Two.Vector(hostX, centerY)

  const doorA = new Two.RoundedRectangle(aX, centerY + doorHeight / 2, doorWidth, doorHeight, 10);
  const doorB = new Two.RoundedRectangle(bX, centerY + doorHeight / 2, doorWidth, doorHeight, 10);
  const doorC = new Two.RoundedRectangle(cX, centerY + doorHeight / 2, doorWidth, doorHeight, 10);

  two.add(doorA);
  two.add(doorB);
  two.add(doorC);
  two.add(montyGroup);

  let { group: groupA, width: conWidth, height: conHeight } = await loadSvg('./contst.svg');
  let { group: groupB } = await loadSvg('./contst-point.svg');

  contestantGroup = new Two.Group([groupA, groupB]);
  contestantA = groupA;
  contestantB = groupB;
  contestantB.visible = false;
  const contestantY = centerY + montyHeight / 3;

  contestantGroup.translation = new Two.Vector(hostX + montyWidth - margin, contestantY);

  two.add(contestantGroup);
  two.scene.scale = sceneScale;
  // two.update();

  const t = centerY;
  const b = centerY + doorHeight;
  const w2 = doorWidth / 2;
  const doors = [
    { id: 0, t, b, l: aX - w2, r: aX + w2 },
    { id: 1, t, b, l: bX - w2, r: bX + w2 },
    { id: 2, t, b, l: cX - w2, r: cX + w2 }
  ]
  two.renderer.domElement.addEventListener('click', async (event) => {
    const rect = two.renderer.domElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) / sceneScale;
    const y = (event.clientY - rect.top) / sceneScale;

    const door = doors.find(d => x > d.l && x < d.r && y > d.t && y < d.b);
    if (door) {
      console.log('hit', x, y, door);
      // contestantGroup.translation = new Two.Vector(door.l - margin, contestantY);
      await walk(contestantGroup, door.l - margin, 1);
      contestantA.visible = false;
      contestantB.visible = true;
      // two.update();
    } else {
      console.log('click', x, y);
    }
    // two.update();
  });
}

// start();

// gsap.ticker.add(() => {
//   two.update();
// });

async function walk(group, targetX, duration) {
  return gsap.to(group.translation, {
    x: targetX,
    duration: duration
  })
}

async function loadSvg(two, url) {
  return new Promise(resolve => {
    two.load(url, (group, svg) => {
      const viewBox = svg.getAttribute('viewBox');
      const [_0, _1, width, height] = viewBox.split(' ').map(Number);
      resolve({ group, width, height })
    });
  });
}

