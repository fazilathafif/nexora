import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getQuestions } from '../data/questions.js'
import { scheduleReview } from '../lib/srs.js'
import { getColors, Shell } from './HomePage.jsx'

// ── Rating config ─────────────────────────────────────────────────────────────
const RATINGS = [
  { key:'again', label:'Again', emoji:'✗', quality:0, bg:'#EF444418', border:'#EF444450', color:'#EF4444' },
  { key:'hard',  label:'Hard',  emoji:'~', quality:1, bg:'#F59E0B18', border:'#F59E0B50', color:'#F59E0B' },
  { key:'good',  label:'Good',  emoji:'✓', quality:2, bg:'#10B98118', border:'#10B98150', color:'#10B981' },
  { key:'easy',  label:'Easy',  emoji:'⚡', quality:3, bg:'#6366F118', border:'#6366F150', color:'#6366F1' },
]

// ── Topic decoration emojis ───────────────────────────────────────────────────
const TOPIC_EMOJI = {
  'Algebra':'𝑥²',        'Geometry':'📐',           'Trigonometry':'📐',
  'Probability':'🎲',     'Statistics':'📊',          'Sequences':'🔢',
  'Surds':'√',            'Vectors':'↗',             'Indices':'ⁿ',
  'Quadratics':'∪',       'Standard Form':'×10',      'Calculus':'∂',
  'Integration':'∫',      'Straight Lines':'📈',      'Bounds':'±',
  'Number':'#',           'Function Notation':'f(x)', 'Transformations':'🔄',
  'Simultaneous Equations':'⚖', 'Circle Theorems':'⭕', 'Quadratic Formula':'∪',
  'Probability Trees':'🌳', 'Speed & Distance':'🚗',  'Percentages':'%',
  'Comprehension':'📖',   'Grammar':'✏️',             'Vocabulary':'🔤',
  'Physics':'⚡',          'Chemistry':'⚗️',          'Biology':'🌱',
  'Forces':'⚡',           'Waves':'〜',               'Energy':'🔋',
  'Cells':'🔬',           'Genetics':'🧬',            'Atoms':'⚛️',
  'Critical Thinking':'🧠', 'Verbal Reasoning':'🧩',  'Abstract Reasoning':'🔷',
  'Decision Making':'🎯', 'Quantitative Reasoning':'📊',
  'Medicine':'🏥',        'Law':'⚖️',                'Mathematics':'∑',
  'Engineering':'⚙️',     'Philosophy':'🦉',
}

// ── Card Heaven localStorage helpers ─────────────────────────────────────────
const HEAVEN_KEY = 'nx_heaven'
const HEAVEN_THRESHOLD = 3

function getEasyCount(id) {
  try { return JSON.parse(localStorage.getItem(HEAVEN_KEY) ?? '{}')[id] ?? 0 } catch { return 0 }
}
function incrementEasyCount(id) {
  try {
    const data = JSON.parse(localStorage.getItem(HEAVEN_KEY) ?? '{}')
    data[id] = (data[id] ?? 0) + 1
    localStorage.setItem(HEAVEN_KEY, JSON.stringify(data))
    return data[id]
  } catch { return 0 }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FlashcardsPage() {
  const { stream, subject } = useParams()
  const navigate  = useNavigate()
  const C         = getColors(stream, subject)
  const dark      = stream === 'alevel'
  const allQs     = getQuestions(stream, subject)

  const topics = useMemo(
    () => ['All', ...Array.from(new Set(allQs.map(q => q.topic)))],
    [allQs],
  )

  const [topicFilter, setTopicFilter] = useState('All')
  const [cardIndex,   setCardIndex]   = useState(0)
  const [flipped,     setFlipped]     = useState(false)
  const [done,        setDone]        = useState(false)
  const [counts,      setCounts]      = useState({ again:0, hard:0, good:0, easy:0, mastered:0 })
  const [showHint,    setShowHint]    = useState(true)
  const [heaven,      setHeaven]      = useState(false)   // Card-to-Heaven animation active

  // Swipe state
  const [dragX,      setDragX]      = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [swipeFlash, setSwipeFlash] = useState(null)
  const dragStartX   = useRef(0)
  const dragStartY   = useRef(0)
  const isDragActive = useRef(false)
  const isHoriz      = useRef(false)
  const didDrag      = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000)
    return () => clearTimeout(t)
  }, [])

  const cards = useMemo(
    () => topicFilter === 'All' ? allQs : allQs.filter(q => q.topic === topicFilter),
    [allQs, topicFilter],
  )

  function selectTopic(t) {
    setTopicFilter(t); setCardIndex(0); setFlipped(false)
    setDone(false); setCounts({ again:0, hard:0, good:0, easy:0, mastered:0 })
    setShowHint(false); setHeaven(false)
  }

  function advanceCard() {
    if (cardIndex + 1 >= cards.length) setDone(true)
    else { setCardIndex(i => i + 1); setFlipped(false) }
  }

  function respond(quality) {
    const knew = quality >= 2
    scheduleReview(cards[cardIndex].id, knew)

    if (quality === 3) {
      const newCount = incrementEasyCount(cards[cardIndex].id)
      if (newCount >= HEAVEN_THRESHOLD) {
        setCounts(prev => ({ ...prev, mastered: prev.mastered + 1 }))
        setHeaven(true)
        setTimeout(() => { setHeaven(false); advanceCard() }, 700)
        return
      }
    }

    setCounts(prev => ({ ...prev, [RATINGS[quality].key]: prev[RATINGS[quality].key] + 1 }))
    advanceCard()
  }

  function restart() {
    setCardIndex(0); setFlipped(false); setDone(false)
    setCounts({ again:0, hard:0, good:0, easy:0, mastered:0 }); setShowHint(false)
  }

  // Pointer / swipe handlers
  function onPointerDown(e) {
    dragStartX.current = e.clientX; dragStartY.current = e.clientY
    isDragActive.current = true; isHoriz.current = false; didDrag.current = false
    setDragX(0); setIsDragging(false)
  }
  function onPointerMove(e) {
    if (!isDragActive.current) return
    const dx = e.clientX - dragStartX.current, dy = e.clientY - dragStartY.current
    if (!isHoriz.current) {
      if (Math.abs(dx) > Math.abs(dy) + 4) { isHoriz.current = true; setIsDragging(true); e.currentTarget.setPointerCapture(e.pointerId) }
      else if (Math.abs(dy) > Math.abs(dx) + 4) { isDragActive.current = false; return }
    }
    if (isHoriz.current) { didDrag.current = true; setDragX(dx) }
  }
  function onPointerUp() {
    if (!isDragActive.current) return
    isDragActive.current = false
    const finalDx = dragX
    setIsDragging(false); setDragX(0)
    if (Math.abs(finalDx) > 80 && flipped) {
      const goRight = finalDx > 0
      setSwipeFlash(goRight ? 'good' : 'again')
      setTimeout(() => { setSwipeFlash(null); respond(goRight ? 2 : 0) }, 320)
    } else if (!didDrag.current) {
      setFlipped(f => !f)
    }
  }

  if (!allQs.length) {
    return (
      <Shell C={C}>
        <p style={{color:C.muted,textAlign:'center',marginTop:60}}>No flashcards available for this subject.</p>
        <button onClick={() => navigate(`/${stream}`)} style={backBtn(C)}>← Back</button>
      </Shell>
    )
  }

  if (done) {
    const total = counts.again + counts.hard + counts.good + counts.easy + counts.mastered
    const pct   = total > 0 ? Math.round(((counts.good + counts.easy + counts.mastered) / total) * 100) : 0
    return (
      <Shell C={C}>
        <style>{css}</style>
        <div style={{textAlign:'center', padding:'48px 12px 0'}}>
          <div style={{fontSize:52, marginBottom:12}}>
            {pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}
          </div>
          <div style={{fontSize:22, fontWeight:900, color:C.navy, marginBottom:6}}>Deck complete!</div>
          <div style={{fontSize:13, color:C.muted, marginBottom:24}}>
            {cards.length} card{cards.length !== 1 ? 's' : ''} reviewed · {pct}% confident
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom: counts.mastered > 0 ? 10 : 24}}>
            {RATINGS.map(r => (
              <div key={r.key} style={{background:r.bg, border:`1px solid ${r.border}`, borderRadius:12, padding:'12px 6px', textAlign:'center'}}>
                <div style={{fontSize:22, fontWeight:900, color:r.color}}>{counts[r.key]}</div>
                <div style={{fontSize:10, color:C.muted, marginTop:2}}>{r.label}</div>
              </div>
            ))}
          </div>
          {counts.mastered > 0 && (
            <div style={{
              background:'linear-gradient(135deg,#7C3AED18,#6366F118)',
              border:'1.5px solid #7C3AED40', borderRadius:14,
              padding:'12px', marginBottom:24, textAlign:'center',
            }}>
              <span style={{fontSize:18}}>✨</span>
              <span style={{fontSize:13, fontWeight:800, color:'#7C3AED', marginLeft:6}}>
                {counts.mastered} card{counts.mastered !== 1 ? 's' : ''} sent to Card Heaven!
              </span>
            </div>
          )}
          <button onClick={restart} style={{...primaryBtn(C, dark), width:'100%', marginBottom:10}}>
            Restart deck
          </button>
          <button onClick={() => navigate(`/${stream}`)} style={backBtn(C)}>
            ← Back to subjects
          </button>
        </div>
      </Shell>
    )
  }

  const current      = cards[cardIndex]
  const progressPct  = (cardIndex / cards.length) * 100
  const dragAngle    = isDragging ? Math.min(Math.max(dragX * 0.035, -12), 12) : 0
  const dragOpacity  = isDragging ? Math.min(Math.abs(dragX) / 100, 1) : 0
  const topicDeco    = TOPIC_EMOJI[current.topic] ?? null

  return (
    <Shell C={C}>
      <style>{css}</style>

      {/* Header */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
        <button onClick={() => navigate(`/${stream}`)} style={backBtn(C)}>← Back</button>
        <div style={{fontWeight:900, color:C.navy, fontSize:16}}>Flashcards</div>
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          <button
            onClick={() => navigate(`/${stream}/match/${subject}`)}
            style={{
              background:'transparent', border:`1.5px solid ${C.primary}50`,
              borderRadius:8, padding:'5px 10px', fontSize:11, fontWeight:700,
              color:C.primary, cursor:'pointer', fontFamily:'Inter,sans-serif',
            }}
          >
            🔗 Match
          </button>
          <span style={{fontSize:12, color:C.muted, fontWeight:700}}>{cardIndex + 1}/{cards.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{background:C.border, borderRadius:8, height:5, marginBottom:16}}>
        <div style={{
          width:`${progressPct}%`,
          background:`linear-gradient(90deg,${C.primary},${C.secondary ?? C.primary})`,
          height:'100%', borderRadius:8, transition:'width 0.4s ease',
        }}/>
      </div>

      {/* Topic filter pills */}
      <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:18}}>
        {topics.map(t => (
          <button key={t} onClick={() => selectTopic(t)} style={{
            background: topicFilter === t ? C.primary : 'transparent',
            border: `1.5px solid ${topicFilter === t ? C.primary : C.border}`,
            borderRadius:20, padding:'4px 12px', fontSize:11, fontWeight:700,
            color: topicFilter === t ? 'white' : C.muted,
            cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.2s',
          }}>{t}</button>
        ))}
      </div>

      {/* 4-level score tally */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:16}}>
        {RATINGS.map(r => (
          <div key={r.key} style={{textAlign:'center', background:r.bg, border:`1px solid ${r.border}`, borderRadius:8, padding:'5px 4px'}}>
            <span style={{fontWeight:800, color:r.color, fontSize:13}}>{counts[r.key]}</span>
            <span style={{fontSize:9, color:C.muted, marginLeft:3, display:'block'}}>{r.label}</span>
          </div>
        ))}
      </div>

      {/* Card Heaven progress indicator */}
      {counts.mastered > 0 && (
        <div style={{
          textAlign:'center', marginBottom:12, fontSize:12,
          color:'#7C3AED', fontWeight:700,
        }}>
          ✨ {counts.mastered} card{counts.mastered !== 1 ? 's' : ''} mastered → Card Heaven
        </div>
      )}

      {/* Card stack area */}
      <div style={{position:'relative', height:240, marginBottom: flipped ? 20 : 36, userSelect:'none'}}>
        {[2,1].map(n => (
          <div key={n} style={{
            position:'absolute', inset:0, background:C.card,
            border:`1.5px solid ${C.border}`, borderRadius:20,
            transform:`translateY(${n*8}px) scale(${1-n*0.04})`,
            opacity: 1-n*0.38, zIndex: 3-n,
          }}/>
        ))}

        {/* Swipe + heaven card */}
        <div
          style={{
            position:'absolute', inset:0, zIndex:5,
            transform: heaven
              ? 'translateY(-120px) scale(0.6) rotate(5deg)'
              : `translateX(${isDragging ? dragX : 0}px) rotate(${dragAngle}deg)`,
            opacity: heaven ? 0 : 1,
            transition: heaven
              ? 'all 0.65s cubic-bezier(0.25,0.46,0.45,0.94)'
              : isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
            touchAction:'pan-y',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Drag colour overlay */}
          {isDragging && Math.abs(dragX) > 15 && (
            <div style={{
              position:'absolute', inset:0, borderRadius:20, zIndex:10, pointerEvents:'none',
              background: dragX > 0 ? `rgba(16,185,129,${dragOpacity*0.35})` : `rgba(239,68,68,${dragOpacity*0.35})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:40, opacity:dragOpacity,
            }}>
              {dragX > 0 ? '✓' : '✗'}
            </div>
          )}
          {swipeFlash && (
            <div style={{
              position:'absolute', inset:0, borderRadius:20, zIndex:11, pointerEvents:'none',
              background: swipeFlash==='good' ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:48, color:'white', fontWeight:900, animation:'swipeFlash 0.32s ease forwards',
            }}>
              {swipeFlash==='good' ? '✓' : '✗'}
            </div>
          )}
          {heaven && (
            <div style={{
              position:'absolute', inset:0, borderRadius:20, zIndex:12, pointerEvents:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:40,
            }}>
              ✨
            </div>
          )}

          <div style={{perspective:'1200px', height:'100%'}}>
            <div style={{
              height:'100%', transformStyle:'preserve-3d',
              transition:'transform 0.45s ease',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
              {/* Front face */}
              <div style={{
                position:'absolute', inset:0,
                backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
                background:C.card, border:`1.5px solid ${C.border}`,
                borderRadius:20, padding:'20px', overflow:'hidden',
                display:'flex', flexDirection:'column', justifyContent:'space-between',
              }}>
                {/* Topic decoration */}
                {topicDeco && (
                  <div style={{
                    position:'absolute', bottom:12, right:16,
                    fontSize:44, opacity: dark ? 0.15 : 0.1,
                    userSelect:'none', pointerEvents:'none',
                    fontFamily:'system-ui,sans-serif', lineHeight:1,
                  }}>
                    {topicDeco}
                  </div>
                )}
                <div>
                  <div style={{fontSize:9, fontWeight:800, color:C.muted, letterSpacing:'0.1em', marginBottom:10}}>
                    QUESTION · {current.topic}
                  </div>
                  <p style={{fontSize:15, fontWeight:700, color:C.navy, lineHeight:1.65, margin:0}}>
                    {current.q}
                  </p>
                </div>
                <div style={{textAlign:'center', fontSize:11, color:C.muted, marginTop:10, opacity:0.6}}>
                  Tap to reveal answer
                </div>
              </div>

              {/* Back face */}
              <div style={{
                position:'absolute', inset:0,
                backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
                transform:'rotateY(180deg)',
                background: dark ? '#261E4E' : C.primary+'12',
                border:`1.5px solid ${C.primary}50`,
                borderRadius:20, padding:'20px',
                display:'flex', flexDirection:'column', justifyContent:'space-between',
              }}>
                <div>
                  <div style={{fontSize:9, fontWeight:800, color:C.primary, letterSpacing:'0.1em', marginBottom:10}}>
                    ANSWER
                  </div>
                  <p style={{fontSize:16, fontWeight:800, color:C.navy, lineHeight:1.6, margin:0}}>
                    {current.opts[current.ans]}
                  </p>
                  {current.hint && (
                    <div style={{
                      marginTop:14, background:(dark?'#C4B5FD':'#FCD34D')+'25',
                      border:`1px solid ${dark?'#C4B5FD':'#FCD34D'}60`,
                      borderRadius:10, padding:'9px 12px',
                      fontSize:12, color:dark?'#DDD6FE':'#92400E', fontWeight:600, lineHeight:1.5,
                    }}>
                      💡 {current.hint}
                    </div>
                  )}
                </div>
                <div style={{textAlign:'center', fontSize:11, color:C.muted, opacity:0.5}}>
                  Tap to flip back · swipe to rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Swipe hint on first card */}
        {showHint && cardIndex === 0 && (
          <div style={{
            position:'absolute', bottom:-28, left:0, right:0,
            display:'flex', justifyContent:'space-between',
            fontSize:10, fontWeight:700, letterSpacing:'0.05em',
            animation:'hintFade 1s ease 2s forwards', pointerEvents:'none',
          }}>
            <span style={{color:'#EF4444'}}>← Again</span>
            <span style={{color:C.muted, opacity:0.6}}>swipe to rate</span>
            <span style={{color:'#10B981'}}>Good →</span>
          </div>
        )}
      </div>

      {/* 4-level response buttons */}
      {flipped ? (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8}}>
          {RATINGS.map(r => (
            <button
              key={r.key}
              onClick={e => { e.stopPropagation(); respond(r.quality) }}
              style={{
                background:r.bg, border:`2px solid ${r.border}`,
                borderRadius:12, padding:'12px 4px',
                fontSize:11, fontWeight:800, color:r.color,
                cursor:'pointer', fontFamily:'Inter,sans-serif',
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              }}
              onMouseEnter={e=>{e.currentTarget.style.filter='brightness(1.15)'}}
              onMouseLeave={e=>{e.currentTarget.style.filter='none'}}
            >
              <span style={{fontSize:16}}>{r.emoji}</span>
              {r.label}
            </button>
          ))}
        </div>
      ) : (
        <div style={{textAlign:'center', fontSize:12, color:C.muted, padding:'6px 0'}}>
          Tap the card to reveal the answer
        </div>
      )}
    </Shell>
  )
}

function backBtn(C) {
  return {
    background:'transparent', border:`1.5px solid ${C.border}`, borderRadius:8,
    padding:'5px 12px', fontSize:11, fontWeight:700, color:C.muted,
    cursor:'pointer', fontFamily:'Inter,sans-serif',
  }
}

function primaryBtn(C, dark) {
  return {
    background:`linear-gradient(135deg,${C.primary},${dark?'#1E1B4B':'#0F766E'})`,
    color:'white', border:'none', borderRadius:14, padding:'14px',
    fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'Inter,sans-serif',
  }
}

const css = `
  @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes swipeFlash{ from{opacity:1} to{opacity:0;transform:scale(1.05)} }
  @keyframes hintFade  { from{opacity:1} to{opacity:0} }
`
