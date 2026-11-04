import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { Doodle } from './Doodle'

// 지도를 움직여 가운데 귤 핀을 가게 위치에 맞추고 고르는 화면
export default function LocationPicker({ initial, current, onPick, onCancel }) {
  const el = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    const start = initial || current || { lat: 33.38, lng: 126.55 }
    const m = L.map(el.current, { zoomControl: false }).setView([start.lat, start.lng], initial || current ? 17 : 10)
    m.attributionControl.setPrefix(false)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m)
    if (current) L.circleMarker([current.lat, current.lng], { radius: 7, color: '#fff', weight: 3, fillColor: '#24577a', fillOpacity: 1 }).addTo(m)
    map.current = m
    return () => m.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="picker">
      <p className="hint">지도를 움직여 귤 핀을 가게 위치에 맞춰 주세요.</p>
      <div className="picker-map">
        <div ref={el} className="map" />
        <div className="picker-pin" aria-hidden="true">
          <Doodle name="gyul" size={40} />
        </div>
      </div>
      <div className="row">
        {current && (
          <button className="btn" onClick={() => map.current.setView([current.lat, current.lng], 17)}>내 위치로</button>
        )}
        <button className="btn" onClick={onCancel}>취소</button>
        <button
          className="btn primary"
          onClick={() => {
            const c = map.current.getCenter()
            onPick({ lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6) })
          }}
        >
          여기로 정하기
        </button>
      </div>
    </div>
  )
}
