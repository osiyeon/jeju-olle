import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapView from './components/MapView'
import { CourseSheet, PhotoThumb, PlaceForm, ShareSheet, Sheet, Stars } from './components/Modals'
import { COURSES, courseById } from './lib/courses'
import { fmtDate, fmtDuration, fmtDurationKo, fmtKm, fmtPace, haversine } from './lib/geo'
import { delPhoto, exportAll, importAll, load, save, savePhoto, uid } from './lib/store'

const SIM = new URLSearchParams(location.search).has('sim') // ?sim → 가짜 GPS로 테스트
const MAX_ACC = 50 // m, 이보다 부정확한 위치는 경로에 안 넣음
const MAX_SPEED = 12 // m/s, 튀는 점 제거

export default function App() {
  const [tab, setTab] = useState('walk')
  const [ready, setReady] = useState(false)
  const [walks, setWalks] = useState([])
  const [places, setPlaces] = useState([])
  const [done, setDone] = useState({}) // { courseId: { date, memo, walkId } }
  const [courseId, setCourseId] = useState(localStorage.getItem('courseId') || '19')
  const [active, setActiveState] = useState(null)
  const activeRef = useRef(null)
  const [pos, setPos] = useState(null)
  const [gpsErr, setGpsErr] = useState('')
  const [follow, setFollow] = useState(true)
  const [now, setNow] = useState(() => Date.now())
  const [sheet, setSheet] = useState(null) // { type, ... }

  const course = courseById(courseId)

  // ---- 저장소 로드 ----
  useEffect(() => {
    Promise.all([load('walks', []), load('places', []), load('done', {}), load('active', null)]).then(([w, p, d, a]) => {
      setWalks(w)
      setPlaces(p)
      setDone(d)
      if (a) {
        activeRef.current = a
        setActiveState(a)
        setCourseId(a.courseId)
      }
      setReady(true)
    })
  }, [])

  useEffect(() => localStorage.setItem('courseId', courseId), [courseId])

  const setActive = (a) => {
    activeRef.current = a
    setActiveState(a)
    save('active', a)
  }
  const updateWalks = (w) => (setWalks(w), save('walks', w))
  const updatePlaces = (p) => (setPlaces(p), save('places', p))
  const updateDone = (d) => (setDone(d), save('done', d))

  // ---- GPS ----
  const onPosition = useCallback((p) => {
    setPos(p)
    setGpsErr('')
    const a = activeRef.current
    if (!a || p.accuracy > MAX_ACC) return
    const pt = [p.lat, p.lng, p.t]
    const last = a.points[a.points.length - 1]
    let add = 0
    if (last) {
      const d = haversine(last, pt)
      const dt = (pt[2] - last[2]) / 1000
      if (d < Math.max(8, p.accuracy * 0.5)) return
      if (dt > 0 && d / dt > MAX_SPEED) return
      add = d
    }
    const next = { ...a, points: [...a.points, pt], distance: a.distance + add }
    activeRef.current = next
    setActiveState(next)
    save('active', next)
  }, [])

  useEffect(() => {
    if (SIM) {
      const c = courseById(localStorage.getItem('courseId') || '19')
      let i = 0
      const s = c?.start || { lat: 33.5384, lng: 126.6344 }
      const e = c?.end || { lat: 33.5592, lng: 126.7433 }
      const id = setInterval(() => {
        i++
        const f = Math.min(1, i / 600)
        onPosition({
          lat: s.lat + (e.lat - s.lat) * f + Math.sin(i / 20) * 0.001,
          lng: s.lng + (e.lng - s.lng) * f,
          accuracy: 8,
          t: Date.now(),
        })
      }, 1000)
      return () => clearInterval(id)
    }
    if (!('geolocation' in navigator)) return setGpsErr('이 브라우저는 위치를 지원하지 않아요.')
    const id = navigator.geolocation.watchPosition(
      (g) => onPosition({ lat: g.coords.latitude, lng: g.coords.longitude, accuracy: g.coords.accuracy, t: g.timestamp }),
      (err) => setGpsErr(err.code === 1 ? '위치 권한이 꺼져 있어요. 설정 > 개인정보 보호 > 위치 서비스 > Safari 에서 허용해 주세요.' : '위치를 찾는 중…'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [onPosition])

  // ---- 화면 꺼짐 방지 (걷는 중에만) ----
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock
    const req = () => navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {})
    req()
    const onVis = () => document.visibilityState === 'visible' && req()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      lock?.release()
    }
  }, [active?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- 걷기 ----
  const startWalk = () => {
    const a = { id: uid(), courseId, startedAt: Date.now(), points: [], distance: 0 }
    if (pos && pos.accuracy <= MAX_ACC) a.points.push([pos.lat, pos.lng, Date.now()])
    setActive(a)
    setFollow(true)
  }

  const finishWalk = (completed) => {
    const a = activeRef.current
    const w = { ...a, endedAt: Date.now(), completed }
    updateWalks([w, ...walks])
    if (completed) updateDone({ ...done, [a.courseId]: { ...done[a.courseId], date: new Date(a.startedAt).toISOString().slice(0, 10), walkId: w.id } })
    setActive(null)
    setSheet(completed ? { type: 'share', walk: w } : null)
    if (!completed) setTab('history')
  }

  const remaining = course?.end && pos ? haversine([pos.lat, pos.lng], [course.end.lat, course.end.lng]) : null
  const elapsed = active ? now - active.startedAt : 0
  const coursePlaces = useMemo(() => places.filter((p) => p.lat != null), [places])
  const doneCount = Object.keys(done).length

  // ---- 맛집 ----
  const savePlace = async (data, photo) => {
    const p = { id: uid(), createdAt: Date.now(), photo: !!photo, ...data }
    if (photo) await savePhoto(p.id, photo)
    updatePlaces([p, ...places])
    setSheet(null)
  }
  const removePlace = async (p) => {
    if (!confirm(`'${p.name}' 삭제할까요?`)) return
    if (p.photo) await delPhoto(p.id)
    updatePlaces(places.filter((x) => x.id !== p.id))
  }

  const shareForCourse = (cid) => {
    const rec = done[cid]
    const w = walks.find((x) => x.id === rec?.walkId) || { startedAt: new Date(rec.date).getTime(), points: [], distance: 0, courseId: cid }
    setSheet({ type: 'share', walk: w })
  }

  if (!ready) return <div className="splash">올레 기록장</div>

  return (
    <div className="app">
      {/* ===== 걷기 ===== */}
      {tab === 'walk' && (
        <div className="walk">
          <MapView current={pos} points={active?.points} places={coursePlaces} course={course} follow={follow} onUserMove={() => setFollow(false)} />

          <div className="walk-top">
            <button className="course-chip" disabled={!!active} onClick={() => setSheet({ type: 'pickCourse' })}>
              <b>{course.id}코스</b>{course.name}{!active && <span className="caret">▼</span>}
            </button>
            {gpsErr && <div className="gps-err">{gpsErr}</div>}
            {SIM && <div className="gps-err">시뮬레이션 모드</div>}
          </div>

          {!follow && (
            <button className="fab locate" onClick={() => setFollow(true)} aria-label="내 위치로">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="5.5" /><circle cx="10" cy="10" r="1.6" fill="currentColor" /><path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3" /></svg>
            </button>
          )}

          <div className="walk-panel">
            {active ? (
              <>
                <div className="stats">
                  <div><span>거리</span><b>{fmtKm(active.distance)}<small>km</small></b></div>
                  <div><span>시간</span><b>{fmtDuration(elapsed)}</b></div>
                  <div><span>페이스</span><b>{fmtPace(elapsed, active.distance)}</b></div>
                </div>
                {remaining != null && <p className="remain">{course.end.name}까지 직선 {fmtKm(remaining)}km</p>}
                <div className="row">
                  <button className="btn" onClick={() => setSheet({ type: 'place' })}>맛집 저장</button>
                  <button className="btn danger" onClick={() => setSheet({ type: 'finish' })}>그만 걷기</button>
                </div>
              </>
            ) : (
              <>
                <p className="status">
                  {pos ? `현재 위치 오차 ±${Math.round(pos.accuracy)}m` : '위치 찾는 중…'}
                  {done[course.id] && ` · ${done[course.id].date} 완주`}
                </p>
                {remaining != null && course.start && (
                  <p className="remain">출발점({course.start.name})까지 {fmtKm(haversine([pos.lat, pos.lng], [course.start.lat, course.start.lng]))}km</p>
                )}
                <div className="row">
                  <button className="btn" onClick={() => setSheet({ type: 'place' })}>맛집 저장</button>
                  <button className="btn primary grow" onClick={startWalk}>걷기 시작</button>
                </div>
                <p className="hint">화면이 꺼지면 기록도 멈춰요. 걷는 동안엔 켜 두세요.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== 코스 ===== */}
      {tab === 'courses' && (
        <div className="page">
          <h2>올레 스탬프</h2>
          <div className="progress">
            <p><b>{doneCount}</b> / {COURSES.length}코스</p>
            <div className="ticks">{COURSES.map((c) => <i key={c.id} className={done[c.id] ? 'on' : ''} />)}</div>
          </div>
          <ul className="course-list">
            {COURSES.map((c) => (
              <li key={c.id} className={done[c.id] ? 'done' : ''} onClick={() => setSheet({ type: 'course', id: c.id })}>
                <span className="stamp">{c.id}</span>
                <div>
                  <b>{c.id}코스</b> <span>{c.name}</span>
                  {done[c.id] && <small>{done[c.id].date} 완주</small>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== 맛집 ===== */}
      {tab === 'places' && (
        <div className="page">
          <div className="page-head">
            <h2>맛집</h2>
            <button className="btn primary" onClick={() => setSheet({ type: 'place' })}>지금 위치 저장</button>
          </div>
          {places.length === 0 && <p className="empty">아직 저장한 곳이 없어요.</p>}
          <ul className="place-list">
            {places.map((p) => (
              <li key={p.id}>
                {p.photo && <PhotoThumb id={p.id} />}
                <div className="grow">
                  <b>{p.name}</b> {p.rating > 0 && <Stars value={p.rating} />}
                  {p.memo && <p>{p.memo}</p>}
                  <small>{p.courseId && `${p.courseId}코스 · `}{fmtDate(p.createdAt)}</small>
                  <div className="links">
                    {p.lat != null && (
                      <>
                        <a href={`https://map.kakao.com/link/map/${encodeURIComponent(p.name)},${p.lat},${p.lng}`} target="_blank" rel="noreferrer">지도</a>
                        <a href={`https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`} target="_blank" rel="noreferrer">길찾기</a>
                      </>
                    )}
                    <a href={`https://map.naver.com/p/search/${encodeURIComponent('제주 ' + p.name)}`} target="_blank" rel="noreferrer">네이버</a>
                    <button onClick={() => removePlace(p)}>삭제</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== 기록 ===== */}
      {tab === 'history' && (
        <div className="page">
          <h2>걷기 기록</h2>
          {walks.length === 0 && <p className="empty">아직 기록이 없어요.</p>}
          <ul className="walk-list">
            {walks.map((w) => (
              <li key={w.id} onClick={() => setSheet({ type: 'walk', walk: w })}>
                <div>
                  <b>{w.courseId}코스</b>{w.completed ? <span className="tag done">완주</span> : <span className="tag part">일부</span>}
                  <small>{fmtDate(w.startedAt)}</small>
                </div>
                <div className="right">
                  <b>{fmtKm(w.distance)}km</b>
                  <small>{fmtDurationKo(w.endedAt - w.startedAt)}</small>
                </div>
              </li>
            ))}
          </ul>
          <Backup />
        </div>
      )}

      <nav className="tabs">
        {[['walk', '걷기'], ['courses', '코스'], ['places', '맛집'], ['history', '기록']].map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </nav>

      {/* ===== 시트 ===== */}
      {sheet?.type === 'place' && <PlaceForm pos={pos} courseId={active?.courseId || courseId} onSave={savePlace} onClose={() => setSheet(null)} />}

      {sheet?.type === 'pickCourse' && (
        <Sheet title="코스 선택" onClose={() => setSheet(null)}>
          <ul className="pick-list">
            {COURSES.map((c) => (
              <li key={c.id} className={c.id === courseId ? 'on' : ''} onClick={() => (setCourseId(c.id), setSheet(null))}>
                <b>{c.id}코스</b>{c.name}{done[c.id] && <span className="tag done">완주</span>}
              </li>
            ))}
          </ul>
        </Sheet>
      )}

      {sheet?.type === 'finish' && (
        <Sheet title="오늘 걷기 마무리" onClose={() => setSheet(null)}>
          <p className="big-stat">{fmtKm(active.distance)}km · {fmtDurationKo(elapsed)}</p>
          <button className="btn primary block" onClick={() => finishWalk(true)}>{active.courseId}코스 완주</button>
          <button className="btn block" onClick={() => finishWalk(false)}>중간까지 걸었어요</button>
          <button className="btn block danger-text" onClick={() => confirm('지금까지 걸은 기록을 버릴까요?') && (setActive(null), setSheet(null))}>기록 버리기</button>
        </Sheet>
      )}

      {sheet?.type === 'share' && (
        <ShareSheet
          walk={sheet.walk}
          course={courseById(sheet.walk.courseId)}
          placeCount={places.filter((p) => p.courseId === sheet.walk.courseId).length}
          onClose={() => setSheet(null)}
        />
      )}

      {sheet?.type === 'course' && (
        <CourseSheet
          course={courseById(sheet.id)}
          record={done[sheet.id]}
          onClose={() => setSheet(null)}
          onSave={(r) => (updateDone({ ...done, [sheet.id]: r }), setSheet(null))}
          onRemove={() => {
            if (!confirm('완주 기록을 지울까요?')) return
            const d = { ...done }
            delete d[sheet.id]
            updateDone(d)
            setSheet(null)
          }}
          onWalk={() => (active ? alert('걷는 중인 코스가 있어요.') : setCourseId(sheet.id), setSheet(null), setTab('walk'))}
          onShare={() => shareForCourse(sheet.id)}
        />
      )}

      {sheet?.type === 'walk' && (
        <Sheet title={`${sheet.walk.courseId}코스 · ${fmtDate(sheet.walk.startedAt)}`} onClose={() => setSheet(null)}>
          <div className="mini-map">
            <MapView points={sheet.walk.points} course={courseById(sheet.walk.courseId)} fitTrack />
          </div>
          <div className="stats">
            <div><span>거리</span><b>{fmtKm(sheet.walk.distance)}<small>km</small></b></div>
            <div><span>시간</span><b>{fmtDuration(sheet.walk.endedAt - sheet.walk.startedAt)}</b></div>
            <div><span>페이스</span><b>{fmtPace(sheet.walk.endedAt - sheet.walk.startedAt, sheet.walk.distance)}</b></div>
          </div>
          <button className="btn primary block" onClick={() => setSheet({ type: 'share', walk: sheet.walk })}>공유 카드 만들기</button>
          <button
            className="btn block danger-text"
            onClick={() => {
              if (!confirm('이 기록을 삭제할까요?')) return
              updateWalks(walks.filter((x) => x.id !== sheet.walk.id))
              setSheet(null)
            }}
          >
            기록 삭제
          </button>
        </Sheet>
      )}
    </div>
  )
}

function Backup() {
  const [msg, setMsg] = useState('')
  return (
    <div className="backup">
      <h4>백업</h4>
      <p className="hint">기록은 이 휴대폰 Safari에만 남아요. 걷고 난 날엔 백업 파일을 받아 두세요.</p>
      <div className="row">
        <button
          className="btn"
          onClick={async () => {
            const data = await exportAll()
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
            const file = new File([blob], `olle-backup-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' })
            if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] }).catch(() => {})
            else {
              const a = document.createElement('a')
              a.href = URL.createObjectURL(file)
              a.download = file.name
              a.click()
            }
          }}
        >
          백업 받기
        </button>
        <label className="btn">
          백업에서 복원
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f || !confirm('지금 기록을 백업 파일 내용으로 덮어쓸까요?')) return
              await importAll(JSON.parse(await f.text()))
              setMsg('복원했어요. 다시 불러올게요.')
              setTimeout(() => location.reload(), 800)
            }}
          />
        </label>
      </div>
      {msg && <p className="hint">{msg}</p>}
    </div>
  )
}
