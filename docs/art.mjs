// One deterministic drawing powers both the README print and the interactive garden.
export const branches = [
  { id: 'build', x: 190, y: 340, color: '#184fc6', angle: -0.8, size: 160 },
  { id: 'teach', x: 590, y: 160, color: '#ab482e', angle: 0.4, size: 145 },
  { id: 'research', x: 735, y: 380, color: '#087773', angle: 1.15, size: 135 },
  { id: 'wander', x: 325, y: 125, color: '#75549e', angle: -0.3, size: 125 },
];
export function drawGarden(seed = 2027, bendX = 0, bendY = 0, active = '') {
  let state = seed >>> 0;
  const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
  const n = value => value.toFixed(2);
  return branches.map(({ x, y, color, size, angle, id }) => {
    const turn = angle + (random() - 0.5) * 0.45;
    const extent = size * (0.86 + random() * 0.3);
    const paths = [];
    for (let i = 0; i < 38; i++) {
      const t = i / 37;
      const theta = t * Math.PI * 2;
      const petalX = Math.cos(theta) * extent * (0.74 + 0.2 * Math.sin(theta * 3));
      const petalY = Math.sin(theta) * extent * 0.8;
      const px = x + petalX * Math.cos(turn) - petalY * Math.sin(turn);
      const py = y + petalX * Math.sin(turn) + petalY * Math.cos(turn);
      const rootX = 435 + t * 26;
      paths.push(`<path d="M ${n(rootX)} 634 C ${n(rootX + bendX)} ${n(455 + bendY)}, ${n(px + bendX)} ${n(py + extent * 1.15)}, ${n(px)} ${n(py)} C ${n(px - extent * 0.45)} ${n(py - extent * 0.75)}, ${n(x - extent * 0.5)} ${n(y + extent * 0.5)}, ${x} ${y}"/>`);
    }
    const opacity = active && active !== id ? 0.14 : 0.58;
    return `<g fill="none" stroke="${color}" stroke-width="0.9" opacity="${opacity}">${paths.join('')}</g><circle cx="${x}" cy="${y}" r="5" fill="${color}"/>`;
  }).join('') + '<path d="M 418 643 Q 450 655 481 643" fill="none" stroke="#223e67" stroke-width="1.4"/>';
}
export function gardenSVG(seed = 2027) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700"><title>Signal garden by Vikram</title><rect width="900" height="700" fill="#eef3f7"/>${drawGarden(seed)}<text x="450" y="685" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#223e67">Signal garden · Vikram · ${seed}</text></svg>`;
}
