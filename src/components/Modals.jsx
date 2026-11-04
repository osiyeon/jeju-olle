import { useEffect, useState } from 'react'
import { COURSES } from '../lib/courses'
import { loadPhoto, resizeImage } from '../lib/store'
import { makeShareCard, shareOrDownload } from '../lib/shareCard'
import { todayISO } from '../lib/geo'

export function Sheet({ title, onClose, children }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

export function Stars({ value, onChange }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={n <= value ? 'on' : ''} onClick={() => onChange?.(n === value ? 0 : n)}>★</button>
      ))}
    </div>
  )
}

export function PhotoThumb({ id, className = 'thumb' }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let u
    loadPhoto(id).then((b) => {
      if (b) setUrl((u = URL.createObjectURL(b)))
    })
    return () => u && URL.revokeObjectURL(u)
  }, [id])
  return url ? <img src={url} className={className} alt="" /> : null
}

export function PlaceForm({ pos, courseId, onSave, onClose }) {
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')
  const [rating, setRating] = useState(0)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [cid, setCid] = useState(courseId || '')
  const [busy, setBusy] = useState(false)

  const pick = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const b = await resizeImage(f)
    setPhoto(b)
    setPreview(URL.createObjectURL(b))
  }

  return (
    <Sheet title="맛집 저장" onClose={onClose}>
      {!pos && <p className="warn">위치를 아직 못 잡았어요. 지도 핀 없이 저장돼요.</p>}
      <label>이름<input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 함덕 고기국수" autoFocus /></label>
      <label>별점<Stars value={rating} onChange={setRating} /></label>
      <label>메모<textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder="메뉴, 가격, 한줄평" /></label>
      <label>코스
        <select value={cid} onChange={(e) => setCid(e.target.value)}>
          <option value="">선택 안 함</option>
          {COURSES.map((c) => <option key={c.id} value={c.id}>{c.id}코스 · {c.name}</option>)}
        </select>
      </label>
      <label className="file-btn">
        사진 {photo ? '바꾸기' : '추가'}
        <input type="file" accept="image/*" onChange={pick} hidden />
      </label>
      {preview && <img src={preview} className="preview" alt="" />}
      <button
        className="btn primary block"
        disabled={!name.trim() || busy}
        onClick={async () => {
          setBusy(true)
          await onSave({ name: name.trim(), memo, rating, courseId: cid, lat: pos?.lat, lng: pos?.lng }, photo)
        }}
      >
        저장
      </button>
    </Sheet>
  )
}

export function ShareSheet({ walk, course, placeCount, onClose }) {
  const [photo, setPhoto] = useState(null)
  const [blob, setBlob] = useState(null)
  const [url, setUrl] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let u
    makeShareCard({ walk, course, photoBlob: photo, placeCount }).then((b) => {
      setBlob(b)
      setUrl((u = URL.createObjectURL(b)))
    })
    return () => u && URL.revokeObjectURL(u)
  }, [walk, course, photo, placeCount])

  return (
    <Sheet title="공유 카드" onClose={onClose}>
      {url ? <img src={url} className="card-preview" alt="공유 카드" /> : <div className="card-preview loading">만드는 중…</div>}
      <div className="row">
        <label className="btn">
          배경 사진 넣기
          <input type="file" accept="image/*" hidden onChange={async (e) => e.target.files?.[0] && setPhoto(await resizeImage(e.target.files[0], 2000))} />
        </label>
        {photo && <button className="btn" onClick={() => setPhoto(null)}>사진 빼기</button>}
      </div>
      <button
        className="btn primary block"
        disabled={!blob}
        onClick={async () => {
          const r = await shareOrDownload(blob, `olle-${course.id}.jpg`, `제주올레 ${course.id}코스 ${course.name}`)
          if (r === 'downloaded') setMsg('이미지를 저장했어요.')
        }}
      >
        공유하기
      </button>
      {msg && <p className="hint">{msg}</p>}
      <p className="hint">공유 창에서 ‘이미지 저장’을 누르면 사진 앱에 들어가요.</p>
    </Sheet>
  )
}

export function CourseSheet({ course, record, onSave, onRemove, onWalk, onShare, onClose }) {
  const [date, setDate] = useState(record?.date || todayISO())
  const [memo, setMemo] = useState(record?.memo || '')
  return (
    <Sheet title={`${course.id}코스 · ${course.name}`} onClose={onClose}>
      {course.start && (
        <p className="hint">
          {course.start.name} → {course.end.name}
          {course.km ? ` · 약 ${course.km}km` : ''}
        </p>
      )}
      <label>완주한 날<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <label>메모<textarea rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="기억하고 싶은 것" /></label>
      <button className="btn primary block" onClick={() => onSave({ ...record, date, memo })}>{record ? '저장' : '완주로 기록'}</button>
      <div className="row">
        <button className="btn" onClick={onWalk}>이 코스 걷기</button>
        {record && <button className="btn" onClick={onShare}>공유 카드</button>}
        {record && <button className="btn danger" onClick={onRemove}>완주 취소</button>}
      </div>
    </Sheet>
  )
}
