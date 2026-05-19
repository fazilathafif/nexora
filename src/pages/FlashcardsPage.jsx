import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getQuestions } from '../data/questions.js'
import { scheduleReview } from '../lib/srs.js'
import { getColors, Shell } from './HomePage.jsx'

export default function FlashcardsPage() {
  const { stream, subject } = useParams()
  const navigate  = useNavigate()
  const C         = getColors(stream)
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
  const [got,         setGot]         = useState(0)
  const [again,       setAgain]       = useState(0)

  const cards = useMemo(
    () => topicFilter === 'All' ? allQs : allQs.filter(q => q.topic === topicFilter),
    [allQs, topicFilter],
  )

  function selectTopic(t) {
    setTopicFilter(t)
    setCardIndex(0)
    setFlipped(false)
    setDone(false)
    setGot(0)
    setAgain(0)
  }

  function respond(knew) {
    scheduleReview(cards[cardIndex].id, knew)
    if (knew) setGot(n => n + 1); else setAgain(n => n + 1)
    if (cardIndex + 1 >= cards.length) {
      setDone(true)
    } else {
      setCardIndex(i => i + 1)
      setFlipped(false)
    }
  }

  function restart() {
    setCardIndex(0)
    setFlipped(false)
    setDone(false)
    setGot(0)
    setAgain(0)
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
    const total = got + again
    const pct   = total > 0 ? Math.round((got / total) * 100) : 0
    return (
      <Shell C={C}>
        <style>{css}</style>
        <div style={{textAlign:'center',padding:'48px 12px 0'}}>
          <div style={{fontSize:52,marginBottom:12}}>
            {pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}
          </div>
          <div style={{fontSize:22,fontWeight:900,color:C.navy,marginBottom:6}}>Deck complete!</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:24}}>
            {cards.length} card{cards.length !== 1 ? 's' : ''} reviewed
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24}}>
            <div style={{background:'#10B98120',border:'1px solid #10B98140',borderRadius:14,padding:'14px 10px',textAlign:'center'}}>
              <div style={{fontSize:28,fontWeight:900,color:'#10B981'}}>{got}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>Got it ✓</div>
            </div>
            <div style={{background:'#EF444420',border:'1px solid #EF444440',borderRadius:14,padding:'14px 10px',textAlign:'center'}}>
              <div style={{fontSize:28,fontWeight:900,color:'#EF4444'}}>{again}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>Again ✗</div>
            </div>
          </div>
          <button onClick={restart} style={{...primaryBtn(C, dark),width:'100%',marginBottom:10}}>
            Restart deck
          </button>
          <button onClick={() => navigate(`/${stream}`)} style={backBtn(C)}>
            ← Back to subjects
          </button>
        </div>
      </Shell>
    )
  }

  const current     = cards[cardIndex]
  const progressPct = (cardIndex / cards.length) * 100

  return (
    <Shell C={C}>
      <style>{css}</style>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <button onClick={() => navigate(`/${stream}`)} style={backBtn(C)}>← Back</button>
        <div style={{fontWeight:900,color:C.navy,fontSize:16}}>Flashcards</div>
        <span style={{fontSize:12,color:C.muted,fontWeight:700}}>{cardIndex + 1} / {cards.length}</span>
      </div>

      {/* Progress bar */}
      <div style={{background:C.border,borderRadius:8,height:5,marginBottom:16}}>
        <div style={{
          width:`${progressPct}%`,
          background:`linear-gradient(90deg,${C.primary},${C.secondary ?? C.primary})`,
          height:'100%',borderRadius:8,transition:'width 0.4s ease',
        }} />
      </div>

      {/* Topic filter pills */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:18}}>
        {topics.map(t => (
          <button
            key={t}
            onClick={() => selectTopic(t)}
            style={{
              background: topicFilter === t ? C.primary : 'transparent',
              border: `1.5px solid ${topicFilter === t ? C.primary : C.border}`,
              borderRadius:20, padding:'4px 12px', fontSize:11, fontWeight:700,
              color: topicFilter === t ? 'white' : C.muted,
              cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.2s',
            }}
          >{t}</button>
        ))}
      </div>

      {/* Score tally */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <div style={{flex:1,textAlign:'center',background:'#10B98115',border:'1px solid #10B98130',borderRadius:10,padding:'6px'}}>
          <span style={{fontWeight:800,color:'#10B981',fontSize:14}}>{got}</span>
          <span style={{fontSize:10,color:C.muted,marginLeft:4}}>Got it</span>
        </div>
        <div style={{flex:1,textAlign:'center',background:'#EF444415',border:'1px solid #EF444430',borderRadius:10,padding:'6px'}}>
          <span style={{fontWeight:800,color:'#EF4444',fontSize:14}}>{again}</span>
          <span style={{fontSize:10,color:C.muted,marginLeft:4}}>Again</span>
        </div>
      </div>

      {/* Flip card */}
      <div
        style={{perspective:'1200px',marginBottom:16,cursor:'pointer'}}
        onClick={() => setFlipped(f => !f)}
      >
        <div style={{
          position:'relative', height:220,
          transformStyle:'preserve-3d',
          transition:'transform 0.45s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* Front */}
          <div style={{
            position:'absolute',inset:0,
            backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',
            background:C.card, border:`1.5px solid ${C.border}`,
            borderRadius:20, padding:'20px',
            display:'flex', flexDirection:'column', justifyContent:'space-between',
          }}>
            <div>
              <div style={{fontSize:9,fontWeight:800,color:C.muted,letterSpacing:'0.1em',marginBottom:10}}>
                QUESTION · {current.topic}
              </div>
              <p style={{fontSize:15,fontWeight:700,color:C.navy,lineHeight:1.65,margin:0}}>
                {current.q}
              </p>
            </div>
            <div style={{textAlign:'center',fontSize:11,color:C.muted,marginTop:10,opacity:0.6}}>
              Tap to reveal answer
            </div>
          </div>

          {/* Back */}
          <div style={{
            position:'absolute',inset:0,
            backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',
            transform:'rotateY(180deg)',
            background: dark ? '#261E4E' : C.primary+'12',
            border:`1.5px solid ${C.primary}50`,
            borderRadius:20, padding:'20px',
            display:'flex', flexDirection:'column', justifyContent:'space-between',
          }}>
            <div>
              <div style={{fontSize:9,fontWeight:800,color:C.primary,letterSpacing:'0.1em',marginBottom:10}}>
                ANSWER
              </div>
              <p style={{fontSize:16,fontWeight:800,color:C.navy,lineHeight:1.6,margin:0}}>
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
            <div style={{textAlign:'center',fontSize:11,color:C.muted,opacity:0.5}}>
              Tap to flip back
            </div>
          </div>
        </div>
      </div>

      {/* Response buttons */}
      {flipped ? (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <button
            onClick={e => { e.stopPropagation(); respond(false) }}
            style={{background:'#EF444418',border:'2px solid #EF444450',borderRadius:14,padding:'14px',fontSize:14,fontWeight:800,color:'#EF4444',cursor:'pointer',fontFamily:'Inter,sans-serif'}}
          >
            Again ✗
          </button>
          <button
            onClick={e => { e.stopPropagation(); respond(true) }}
            style={{background:'#10B98118',border:'2px solid #10B98150',borderRadius:14,padding:'14px',fontSize:14,fontWeight:800,color:'#10B981',cursor:'pointer',fontFamily:'Inter,sans-serif'}}
          >
            Got it ✓
          </button>
        </div>
      ) : (
        <div style={{textAlign:'center',fontSize:12,color:C.muted,padding:'6px 0'}}>
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
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`
