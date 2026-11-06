import { useEffect, useState } from 'react'
import { COURSES } from '../lib/courses'
import { loadPhoto, resizeImage } from '../lib/store'
import { makeShareCard, shareOrDownload } from '../lib/shareCard'
import { todayISO } from '../lib/geo'
import { parseShared, readClipboard, safeUrl, searchLinks } from '../lib/mapLink'
import LocationPicker from './LocationPicker'
import { kakaoReady, locatePlace } from '../lib/kakao'

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
  const [link, setLink] = useState('')
  const [address, setAddress] = useState('')
  const [linkMsg, setLinkMsg] = useState('')
  // 위치: 기본은 지금 GPS 위치. 지도에서 고르면 그걸 씀
  const [picked, setPicked] = useState(null)
  const [pickedFrom, setPickedFrom] = useState('') // 'map' 지도에서 고름 | 'kakao' 주소로 찾음
  const [picking, setPicking] = useState(false)
  const [locating, setLocating] = useState(false)
  const where = picked || (pos ? { lat: pos.lat, lng: pos.lng } : null)
  // 지도 링크를 붙였는데 가게 위치는 안 정함 → 지금 위치로 저장하면 엉뚱한 곳에 핀이 찍힘
  const needPick = !!link && !picked

  // 지도 앱에서 복사한 글 → 링크, (이름이 비어 있으면) 이름, 주소
  const applyShared = (text) => {
    const r = parseShared(text)
    if (!r.url) return setLinkMsg('복사한 내용에 링크가 없어요. 지도 앱에서 공유 → 복사를 눌러 주세요.')
    setLink(r.url)
    if (!name.trim() && r.name) setName(r.name)
    if (r.address) setAddress(r.address)
    setLinkMsg('')
    // 카카오 키가 있으면 주소(없으면 가게 이름)로 위치를 찾아 넣음
    if (kakaoReady() && (r.address || r.name || name.trim())) {
      setLocating(true)
      locatePlace({ address: r.address, name: r.name || name.trim() }, pos).then((found) => {
        setLocating(false)
        if (!found) return
        setPicked({ lat: found.lat, lng: found.lng })
        setPickedFrom('kakao')
      })
    }
  }
  const paste = async () => {
    const t = await readClipboard()
    if (t == null) return setLinkMsg('붙여넣기가 막혀 있어요. 입력칸을 길게 눌러 붙여넣어 주세요.')
    applyShared(t)
  }

  const pick = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const b = await resizeImage(f)
    setPhoto(b)
    setPreview(URL.createObjectURL(b))
  }

  return (
    <Sheet title={picking ? '가게 위치 고르기' : '맛집 저장'} onClose={onClose}>
      {picking ? (
        <LocationPicker
          initial={where}
          current={pos}
          hint={address}
          onPick={(l) => (setPicked(l), setPickedFrom('map'), setPicking(false))}
          onCancel={() => setPicking(false)}
        />
      ) : (
      <>
      <div className={needPick ? 'loc-row need' : 'loc-row'}>
        <span>
          {locating
            ? '주소로 가게 위치 찾는 중…'
            : picked
              ? pickedFrom === 'kakao' ? '주소로 찾은 가게 위치' : '지도에서 고른 위치'
              : needPick
                ? '가게 위치를 아직 안 골랐어요'
                : pos ? `지금 위치 (±${Math.round(pos.accuracy)}m)` : '위치를 아직 못 잡았어요'}
          <small>{needPick ? '지금 위치로 저장하면 핀이 내가 있는 곳에 찍혀요' : '가게가 여기 아니면 직접 골라 주세요'}</small>
        </span>
        <button type="button" className="btn" onClick={() => setPicking(true)}>지도에서 고르기</button>
      </div>
      <label>이름<input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 함덕 고기국수" autoFocus /></label>
      <label>지도 링크
        <div className="link-input">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onPaste={(e) => {
              e.preventDefault()
              applyShared(e.clipboardData.getData('text'))
            }}
            placeholder="지도 앱에서 공유 → 복사"
            inputMode="url"
          />
          <button type="button" className="btn" onClick={paste}>붙여넣기</button>
        </div>
      </label>
      {address && <p className="hint">주소: {address}</p>}
      {linkMsg && <p className="hint">{linkMsg}</p>}
      <p className="hint find-links">
        가게 찾기:{' '}
        {searchLinks(name).map(([l, u]) => (
          <a key={l} href={u} target="_blank" rel="noreferrer">{l}</a>
        ))}
      </p>
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
          if (needPick && !locating && confirm('가게 위치를 아직 안 골랐어요.\n지도에서 고를까요?\n(취소를 누르면 지금 내 위치로 저장돼요)')) return setPicking(true)
          setBusy(true)
          await onSave({ name: name.trim(), memo, rating, courseId: cid, lat: where?.lat, lng: where?.lng, link: safeUrl(link), address }, photo)
        }}
      >
        저장
      </button>
      </>
      )}
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
  const [km, setKm] = useState(record?.km ?? '')
  const [hh, setHh] = useState(record?.minutes ? String(Math.floor(record.minutes / 60)) : '')
  const [mm, setMm] = useState(record?.minutes ? String(record.minutes % 60) : '')
  const minutes = (Number(hh) || 0) * 60 + (Number(mm) || 0)
  return (
    <Sheet title={`${course.id}코스 · ${course.name}`} onClose={onClose}>
      <p className="hint">
        {course.start && `${course.start.name} → ${course.end.name} · `}
        공식 거리 {course.kmNote || `${course.km}km`}
      </p>
      <label>완주한 날<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      {!record?.walkId && (
        <>
          <label>걸은 거리 (km)<input type="number" inputMode="decimal" step="0.1" value={km} onChange={(e) => setKm(e.target.value)} placeholder={`공식 ${course.km}km (비워 두면 이 거리로)`} /></label>
          <label>걸린 시간
            <div className="time-inputs">
              <input type="number" inputMode="numeric" value={hh} onChange={(e) => setHh(e.target.value)} placeholder="0" /><span>시간</span>
              <input type="number" inputMode="numeric" value={mm} onChange={(e) => setMm(e.target.value)} placeholder="0" /><span>분</span>
            </div>
          </label>
        </>
      )}
      <label>메모<textarea rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="기억하고 싶은 것" /></label>
      <button className="btn primary block" onClick={() => onSave({ ...record, date, memo, ...(record?.walkId ? {} : { km: Number(km) || course.km || null, minutes: minutes || null }) })}>{record ? '저장' : '완주로 기록'}</button>
      <div className="row">
        <button className="btn" onClick={onWalk}>코스 걷기</button>
        {record && <button className="btn" onClick={onShare}>공유 카드</button>}
        {record && <button className="btn danger" onClick={onRemove}>완주 취소</button>}
      </div>
    </Sheet>
  )
}
