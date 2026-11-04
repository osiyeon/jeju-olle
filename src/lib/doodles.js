// 손그림 낙서 모음. SVG(화면)와 Canvas(공유 카드)가 같은 path 데이터를 쓴다.
// part: { d, fill?, stroke?(true=잉크색|색), sw?(선 굵기), dx?, dy?(칠을 선에서 살짝 비껴 찍기) }
export const INK = '#3b342c'
const GYUL = '#f59b3c'
const LEAF = '#7fae5c'
const STONE = '#5a554f'
const SEA = '#5b8fb0'

export const DOODLES = {
  gyul: {
    w: 48, h: 48,
    parts: [
      { d: 'M24 13C33 13 40 19 40 28C40 36 33 42 24 42C15 42 8 36 8 28C8 19 15 13 24 13Z', fill: GYUL, dx: 2, dy: 1.5 },
      { d: 'M23.5 13.2C32.6 12.4 40.3 19.2 39.6 28.1C39.1 36.4 32.2 42.3 23.8 41.8C15.1 41.6 8.2 35.6 8.6 27.4C9 19.5 15.2 13.8 23.5 13.2Z', stroke: true },
      { d: 'M13.8 25.5C14 21.6 16.2 18.6 19.2 17.4', stroke: '#fff7ea', sw: 2.2 },
      { d: 'M16.5 23.5h.01M31 34h.01M19 33.5h.01M29.5 21h.01', stroke: true, sw: 2.2 },
      { d: 'M24.2 13.4C24.4 11.6 24.9 10.2 25.8 8.9', stroke: true },
      { d: 'M25.6 9.6C28.4 5.6 33.6 5.2 36.4 7.4C34.2 11 29.4 12.1 25.6 9.6Z', fill: LEAF, stroke: true },
      { d: 'M27 9.4C30 8.4 32.5 7.9 35 7.6', stroke: true, sw: 1.1 },
    ],
  },
  harubang: {
    w: 48, h: 64,
    parts: [
      { d: 'M13 18C10 30 10 48 12.5 58H35.5C38 48 38 30 35 18Z', fill: '#a49e95', dx: 1.5, dy: 1.5 },
      { d: 'M14 18C13.5 9 34.5 9 34 18Z', fill: '#8c867d', dx: 1.5, dy: 1.5 },
      { d: 'M13.2 18.2C10.2 29 10.4 47.6 12.8 58.2L35.4 57.8C37.8 47.4 37.8 30.2 34.8 18.1', stroke: true },
      { d: 'M14.2 17.6C13.4 8.8 34.6 8.4 33.8 17.6', stroke: true },
      { d: 'M10.8 18.6C18 16.6 30 16.4 37.2 18.4', stroke: true },
      { d: 'M8.6 58.4C18 57.6 30 57.6 39.4 58.4', stroke: true },
      { d: 'M16 24.5C16 22.4 17.6 21 19.4 21.2C21.2 21.4 22.4 23 22.2 24.8C22 26.6 20.4 27.8 18.8 27.6C17.2 27.4 16 26.2 16 24.5Z', fill: '#f6f1e7', stroke: true },
      { d: 'M26 24.5C26 22.4 27.6 21 29.4 21.2C31.2 21.4 32.4 23 32.2 24.8C32 26.6 30.4 27.8 28.8 27.6C27.2 27.4 26 26.2 26 24.5Z', fill: '#f6f1e7', stroke: true },
      { d: 'M19.6 24.8h.01M29.6 24.8h.01', stroke: true, sw: 3.2 },
      { d: 'M24 26C21.8 30.6 21.6 34.4 23.4 35.6C24.6 36.2 26.2 35.2 26 33.4C25.8 31 25 28.4 24 26Z', stroke: true, sw: 1.6 },
      { d: 'M14.8 31.6C14.8 30.4 18.2 30.4 18.2 31.6C18.2 32.8 14.8 32.8 14.8 31.6Z', fill: '#f2a7a0' },
      { d: 'M29.8 31.6C29.8 30.4 33.2 30.4 33.2 31.6C33.2 32.8 29.8 32.8 29.8 31.6Z', fill: '#f2a7a0' },
      { d: 'M19.6 37.4C22.4 40.6 25.8 40.6 28.6 37.2', stroke: true },
      { d: 'M13.6 47.6C17.4 46.2 21.4 46.6 24.2 48.6C25 49.2 24.6 50.2 23.6 50', stroke: true, sw: 1.7 },
      { d: 'M34.4 52.4C30.6 51 26.6 51.4 23.8 53.4C23 54 23.4 55 24.4 54.8', stroke: true, sw: 1.7 },
      { d: 'M33 36h.01M16 52h.01M31 54h.01M20 55h.01M30 13.5h.01M19 14h.01', stroke: '#5d5850', sw: 1.8 },
    ],
  },
  oreum: {
    w: 96, h: 32,
    parts: [
      { d: 'M0 30C10 30 14 13 27 13C38 13 40 26 50 26C58 26 61 18 70 18C80 18 84 30 96 30Z', fill: '#cfe0b4', dy: 1.5 },
      { d: 'M0 30C10 30 14 13 27 13C38 13 40 26 50 26C58 26 61 18 70 18C80 18 84 30 96 30', stroke: true },
      { d: 'M22 18.5l1-2M30 17.5l-1-2M67 21.5l1-2M73 21l-.6-2', stroke: '#6e9a4f', sw: 1.5 },
    ],
  },
  wave: {
    w: 60, h: 12,
    parts: [{ d: 'M2 7C6 2 10 2 14 6C18 10 22 10 26 6C30 2 34 2 38 6C42 10 46 10 50 6C53 3 56 3 58 5', stroke: SEA, sw: 2 }],
  },
  stonewall: {
    w: 120, h: 28,
    parts: [
      {
        d: 'M2 26C1 18 4 13 11 13C18 13 22 18 21 26ZM22 26C21 16 26 10 34 11C41 12 44 18 43 26ZM44 26C44 19 48 15 54 15C61 15 64 20 63 26ZM64 26C63 17 69 11 77 12C85 13 88 19 86 26ZM87 26C87 20 91 16 97 16C104 16 107 21 106 26ZM107 26C107 19 111 14 116 15C119 16 120 20 119 26Z',
        fill: STONE, stroke: true,
      },
      { d: 'M9 19h.01M30 16h.01M37 21h.01M52 20h.01M75 17h.01M81 22h.01M97 21h.01M113 20h.01M14 22h.01M58 22h.01', stroke: '#9a9286', sw: 2 },
    ],
  },
  camellia: {
    w: 32, h: 32,
    parts: [
      { d: 'M16 6C20 6 22 10 20 13C24 11 28 14 26 18C29 21 26 26 22 24C21 28 15 29 14 25C10 27 6 23 9 20C5 17 8 12 12 13C10 9 12 6 16 6Z', fill: '#d9534a', dx: 1, dy: 1 },
      { d: 'M16 6C20 6 22 10 20 13C24 11 28 14 26 18C29 21 26 26 22 24C21 28 15 29 14 25C10 27 6 23 9 20C5 17 8 12 12 13C10 9 12 6 16 6Z', stroke: true, sw: 1.6 },
      { d: 'M13.6 17C13.6 14.6 18.4 14.6 18.4 17C18.4 19.4 13.6 19.4 13.6 17Z', fill: '#f5c84c', stroke: true, sw: 1.4 },
    ],
  },
  bowl: {
    w: 48, h: 40,
    parts: [
      { d: 'M17 12C15 9 19 7 17 4M24 12C22 9 26 7 24 4M31 12C29 9 33 7 31 4', stroke: '#b9b0a2', sw: 1.6 },
      { d: 'M28 16L44 4M31 17L46 7', stroke: '#c98a4b', sw: 2.4 },
      { d: 'M6 18H42C42 28 34 35 24 35C14 35 6 28 6 18Z', fill: '#f1ebdf', dx: 1.5, dy: 1.5 },
      { d: 'M8.6 24.4C18 26.4 30 26.4 39.4 24.4', stroke: SEA, sw: 2 },
      { d: 'M8 18.2C13 15.6 19 16 24 18C29 16 35 15.6 40 18.2', stroke: true, sw: 1.5 },
      { d: 'M5.6 18.2C14 17.6 34 17.6 42.4 18C42.2 28.4 34 35.2 24 35.2C14 35.4 5.8 28.6 5.6 18.2Z', stroke: true },
      { d: 'M18 35.4L19 38.4H29L30 35.4', stroke: true },
    ],
  },
  // 빈 원(아직 안 걸은 코스 도장 자리)
  ring: {
    w: 48, h: 48,
    parts: [{ d: 'M24 5.5C34.5 5 42.6 13.2 42.4 23.8C42.2 34.6 34.4 42.6 23.6 42.4C13.2 42.2 5.4 34.2 5.6 23.6C5.8 13.4 13.6 6 24 5.5Z', stroke: '#c9bfae', sw: 1.8 }],
  },
}

// 탭 아이콘 (24x24). on일 때만 칠한다
export const TAB_ICONS = {
  walk: [
    { d: 'M8 4.5C10 4.5 11 6.5 11 9.5C11 12.5 10 14 8 14C6 14 5 12.5 5 9.5C5 6.5 6 4.5 8 4.5Z', fill: GYUL },
    { d: 'M7 16C8.5 16 9.5 17 9.2 18.4C9 19.6 8 20 7 20C6 20 5 19.4 5 18.2C5 17 5.8 16 7 16Z', fill: GYUL },
    { d: 'M16 2.5C18 2.5 19 4.5 19 7.5C19 10.5 18 12 16 12C14 12 13 10.5 13 7.5C13 4.5 14 2.5 16 2.5Z', fill: GYUL },
    { d: 'M15 14C16.5 14 17.5 15 17.2 16.4C17 17.6 16 18 15 18C14 18 13 17.4 13 16.2C13 15 13.8 14 15 14Z', fill: GYUL },
  ],
  courses: [
    { d: 'M1.5 20.5C5 20.5 7 12 12 12C17 12 18.5 20.5 22.5 20.5', fill: '#cfe0b4' },
    { d: 'M12 12V3' },
    { d: 'M12 3.5L18.5 5.6L12 8', fill: GYUL },
  ],
  places: [
    { d: 'M14 9L21 3M16.5 10L22.5 5' },
    { d: 'M3 11.5H21C21 16.5 17 20.5 12 20.5C7 20.5 3 16.5 3 11.5Z', fill: '#bcd4e2' },
    { d: 'M8.5 8C7.5 6.5 9.5 5.5 8.5 3.5' },
  ],
  history: [
    { d: 'M6 2.8H18C19 2.8 19.6 3.4 19.6 4.4V19.8C19.6 20.8 19 21.4 18 21.4H6C5 21.4 4.4 20.8 4.4 19.8V4.4C4.4 3.4 5 2.8 6 2.8Z', fill: '#f6d7a8' },
    { d: 'M8 8H16M8 12H16M8 16H12.5' },
  ],
}

// Canvas에 그리기 (공유 카드용). size = 그릴 폭(px)
export function drawDoodle(ctx, name, x, y, size, { rotate = 0 } = {}) {
  const dd = DOODLES[name]
  const s = size / dd.w
  ctx.save()
  ctx.translate(x, y)
  if (rotate) {
    ctx.translate((dd.w * s) / 2, (dd.h * s) / 2)
    ctx.rotate(rotate)
    ctx.translate((-dd.w * s) / 2, (-dd.h * s) / 2)
  }
  ctx.scale(s, s)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const p of dd.parts) {
    const path = new Path2D(p.d)
    if (p.fill) {
      ctx.save()
      ctx.translate(p.dx || 0, p.dy || 0)
      ctx.fillStyle = p.fill
      ctx.fill(path)
      ctx.restore()
    }
    if (p.stroke) {
      ctx.strokeStyle = p.stroke === true ? INK : p.stroke
      ctx.lineWidth = p.sw || 2
      ctx.stroke(path)
    }
  }
  ctx.restore()
}

// Leaflet divIcon 등 문자열 HTML이 필요한 곳용
export function doodleSvg(name, size) {
  const dd = DOODLES[name]
  const h = (size * dd.h) / dd.w
  const body = dd.parts
    .map((p) => {
      const t = p.dx || p.dy ? ` transform="translate(${p.dx || 0} ${p.dy || 0})"` : ''
      const fill = p.fill ? `<path d="${p.d}" fill="${p.fill}"${t}/>` : ''
      const stroke = p.stroke ? `<path d="${p.d}" fill="none" stroke="${p.stroke === true ? INK : p.stroke}" stroke-width="${p.sw || 2}" stroke-linecap="round" stroke-linejoin="round"/>` : ''
      return fill + stroke
    })
    .join('')
  return `<svg width="${size}" height="${h}" viewBox="0 0 ${dd.w} ${dd.h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
}
