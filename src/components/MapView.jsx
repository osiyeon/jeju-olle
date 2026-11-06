import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { courseTrack } from '../lib/courses'
import { doodleSvg } from '../lib/doodles'
import { segments } from '../lib/geo'
import { mapSource, safeUrl } from '../lib/mapLink'

const JEJU = [33.38, 126.55]

const pin = (label, color) =>
  L.divIcon({
    className: 'pin',
    html: `<div class="pin-body" style="background:${color}">${label}</div>`,
    iconSize: null,
    iconAnchor: [14, 34],
    popupAnchor: [0, -30], // 말풍선이 핀을 가리지 않게 핀 위에서
  })

const dot = L.divIcon({ className: 'pin pin-gyul', html: doodleSvg('gyul', 28), iconSize: [28, 28], iconAnchor: [14, 20], popupAnchor: [0, -16] })

// 지도는 Leaflet을 직접 다룬다 (react-leaflet 없이 가볍게)
// fitPlaces: 맛집 핀이 다 보이게 맞춤(맛집 탭). focus: { id } 바뀌면 그 맛집으로 이동해 말풍선 열기
export default function MapView({ current, points = [], places = [], course, follow, onUserMove, fitTrack, fitPlaces, focus }) {
  const el = useRef(null)
  const map = useRef(null)
  const L_ = useRef({})
  const firstFix = useRef(false)
  const markers = useRef(new Map())

  useEffect(() => {
    const m = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(JEJU, 10)
    firstFix.current = false // 지도를 새로 만들면 첫 위치 확대도 다시
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(m)
    m.attributionControl.setPrefix(false) // OSM 출처만 남김
    m.createPane('coursePane').style.zIndex = 350 // 걸은 경로(overlayPane 400) 아래
    L_.current = {
      courseLine: L.layerGroup().addTo(m),
      course: L.layerGroup().addTo(m),
      places: L.layerGroup().addTo(m),
      track: L.polyline([], { color: '#f08a24', weight: 6, opacity: 0.95 }).addTo(m),
      acc: L.circle(JEJU, { radius: 0, color: '#24577a', weight: 1, fillOpacity: 0.1 }),
      me: L.circleMarker(JEJU, { radius: 8, color: '#fff', weight: 3, fillColor: '#24577a', fillOpacity: 1 }),
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
    const line = L_.current.courseLine
    line.clearLayers()
    const segs = course && courseTrack(course.id)
    if (segs) L.polyline(segs, { pane: 'coursePane', color: '#3f7aa0', weight: 4, opacity: 0.7, dashArray: '1 9', lineCap: 'round' }).addTo(line)
    if (course?.start) L.marker([course.start.lat, course.start.lng], { icon: pin('시작', '#bcd4e2') }).bindPopup(`<span class="pop-label">출발점</span>${escapeHtml(course.start.name)}`).addTo(g)
    if (course?.end) L.marker([course.end.lat, course.end.lng], { icon: pin('종점', '#f6d2cd') }).bindPopup(`<span class="pop-label">종점</span>${escapeHtml(course.end.name)}`).addTo(g)
  }, [course])

  // 맛집
  useEffect(() => {
    const g = L_.current.places
    g.clearLayers()
    markers.current.clear()
    places.forEach((p) => {
      const mk = L.marker([p.lat, p.lng], { icon: dot })
        .bindPopup(
          `<b>${escapeHtml(p.name)}</b>${p.rating ? ' ' + '★'.repeat(p.rating) : ''}<br>${escapeHtml(p.memo || '')}` +
            (safeUrl(p.link) ? `<br><a href="${escapeHtml(safeUrl(p.link))}" target="_blank" rel="noreferrer">${mapSource(p.link)}에서 보기</a>` : ''),
        )
        .addTo(g)
      markers.current.set(p.id, mk)
    })
    if (fitPlaces && places.length) {
      const b = L.latLngBounds(places.map((p) => [p.lat, p.lng]))
      map.current.fitBounds(b, { padding: [40, 40], maxZoom: 15 })
    }
  }, [places, fitPlaces])

  // 목록에서 고른 맛집으로 이동
  useEffect(() => {
    const mk = focus && markers.current.get(focus.id)
    if (!mk) return
    map.current.setView(mk.getLatLng(), Math.max(map.current.getZoom(), 16), { animate: true })
    mk.openPopup()
  }, [focus])

  // 경로
  useEffect(() => {
    L_.current.track.setLatLngs(segments(points)) // 일시정지로 끊긴 곳은 선을 잇지 않음
    if (!fitTrack) return
    const b = L.latLngBounds([])
    if (points.length > 1) b.extend(L_.current.track.getBounds())
    L_.current.courseLine.eachLayer((l) => b.extend(l.getBounds()))
    if (b.isValid()) map.current.fitBounds(b, { padding: [30, 30] })
  }, [points, fitTrack, course])

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
    if (!fitTrack && !fitPlaces && (follow || !firstFix.current)) {
      map.current.setView(ll, firstFix.current ? map.current.getZoom() : 16, { animate: firstFix.current }) // 첫 위치는 바로 확대
      firstFix.current = true
    }
  }, [current, follow, fitTrack, fitPlaces])

  return <div ref={el} className="map" />
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}
