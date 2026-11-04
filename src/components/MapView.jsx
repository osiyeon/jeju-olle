import { useEffect, useRef } from 'react'
import L from 'leaflet'

const JEJU = [33.38, 126.55]

const pin = (label, color) =>
  L.divIcon({
    className: 'pin',
    html: `<div class="pin-body" style="background:${color}">${label}</div>`,
    iconSize: null,
    iconAnchor: [14, 34],
  })

// 지도는 Leaflet을 직접 다룬다 (react-leaflet 없이 가볍게)
export default function MapView({ current, points = [], places = [], course, follow, onUserMove, fitTrack }) {
  const el = useRef(null)
  const map = useRef(null)
  const L_ = useRef({})
  const firstFix = useRef(false)

  useEffect(() => {
    const m = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(JEJU, 10)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(m)
    L_.current = {
      course: L.layerGroup().addTo(m),
      places: L.layerGroup().addTo(m),
      track: L.polyline([], { color: '#F28C28', weight: 6, opacity: 0.95 }).addTo(m),
      acc: L.circle(JEJU, { radius: 0, color: '#1D86BF', weight: 1, fillOpacity: 0.12 }),
      me: L.circleMarker(JEJU, { radius: 8, color: '#fff', weight: 3, fillColor: '#1D86BF', fillOpacity: 1 }),
    }
    m.on('dragstart', () => onUserMove?.())
    map.current = m
    return () => m.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 코스 시작/종점
  useEffect(() => {
    const g = L_.current.course
    g.clearLayers()
    if (course?.start) L.marker([course.start.lat, course.start.lng], { icon: pin('시작', '#2E9E5B') }).bindPopup(course.start.name).addTo(g)
    if (course?.end) L.marker([course.end.lat, course.end.lng], { icon: pin('종점', '#D8432F') }).bindPopup(course.end.name).addTo(g)
  }, [course])

  // 맛집
  useEffect(() => {
    const g = L_.current.places
    g.clearLayers()
    places.forEach((p) => {
      L.marker([p.lat, p.lng], { icon: pin('🍜', '#fff') })
        .bindPopup(`<b>${escapeHtml(p.name)}</b>${p.rating ? ' ' + '★'.repeat(p.rating) : ''}<br>${escapeHtml(p.memo || '')}`)
        .addTo(g)
    })
  }, [places])

  // 경로
  useEffect(() => {
    L_.current.track.setLatLngs(points.map((p) => [p[0], p[1]]))
    if (fitTrack && points.length > 1) map.current.fitBounds(L_.current.track.getBounds(), { padding: [30, 30] })
  }, [points, fitTrack])

  // 내 위치
  useEffect(() => {
    if (!current) return
    const { me, acc } = L_.current
    const ll = [current.lat, current.lng]
    me.setLatLng(ll)
    acc.setLatLng(ll).setRadius(current.accuracy || 0)
    if (!map.current.hasLayer(me)) {
      acc.addTo(map.current)
      me.addTo(map.current)
    }
    if (!fitTrack && (follow || !firstFix.current)) {
      map.current.setView(ll, firstFix.current ? map.current.getZoom() : 16, { animate: true })
      firstFix.current = true
    }
  }, [current, follow, fitTrack])

  return <div ref={el} className="map" />
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}
