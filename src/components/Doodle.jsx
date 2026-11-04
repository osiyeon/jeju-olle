import { DOODLES, INK, TAB_ICONS } from '../lib/doodles'

export function Doodle({ name, size = 48, className, style }) {
  const dd = DOODLES[name]
  return (
    <svg className={className} style={style} width={size} height={(size * dd.h) / dd.w} viewBox={`0 0 ${dd.w} ${dd.h}`} aria-hidden="true">
      {dd.parts.map((p, i) => (
        <g key={i}>
          {p.fill && <path d={p.d} fill={p.fill} transform={p.dx || p.dy ? `translate(${p.dx || 0} ${p.dy || 0})` : undefined} />}
          {p.stroke && (
            <path d={p.d} fill="none" stroke={p.stroke === true ? INK : p.stroke} strokeWidth={p.sw || 2} strokeLinecap="round" strokeLinejoin="round" />
          )}
        </g>
      ))}
    </svg>
  )
}

export function TabIcon({ name, on }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      {TAB_ICONS[name].map((p, i) => (
        <g key={i}>
          {on && p.fill && <path d={p.d} fill={p.fill} transform="translate(.8 .8)" />}
          <path d={p.d} fill="none" stroke={on ? INK : '#9a9182'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  )
}
