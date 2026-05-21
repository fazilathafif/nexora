import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getQuestions } from '../data/questions.js'
import { scheduleReview } from '../lib/srs.js'
import { getColors, Shell } from './HomePage.jsx'
import FlashcardDeck from '../components/FlashcardDeck.jsx'

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

  const [topicFilter,    setTopicFilter]    = useState('All')
  const [flipped,        setFlipped]        = useState(false)
  const [deckKey,        setDeckKey]        = useState(0)
  const [cardsAnswered,  setCardsAnswered]  = useState(0)
  const [done,        setDone]        = useState(false)
  const [counts,      setCounts]      = useState({ again:0, hard:0, good:0, easy:0, mastered:0 })
  const [heaven,      setHeaven]      = useState(false)

  const cards = useMemo(
    () => topicFilter === 'All' ? allQs : allQs.filter(q => q.topic === topicFilter),
    [allQs, topicFilter],
  )

  function selectTopic(t) {
    setTopicFilter(t); setFlipped(false)
    setDone(false); setCounts({ again:0, hard:0, good:0, easy:0, mastered:0 })
    setHeaven(false); setDeckKey(k => k + 1); setCardsAnswered(0)
  }

  function advanceCard(currentIndex) {
    if (currentIndex + 1 >= cards.length) setDone(true)
    else setFlipped(false)
  }

  function respond(quality, currentIndex) {
    const knew = quality >= 2
    scheduleReview(cards[currentIndex].id, knew)

    if (quality === 3) {
      const newCount = incrementEasyCount(cards[currentIndex].id)
      if (newCount >= HEAVEN_THRESHOLD) {
        setCounts(prev => ({ ...prev, mastered: prev.mastered + 1 }))
        setHeaven(true)
        return
      }
    }

    setCounts(prev => ({ ...prev, [RATINGS[quality].key]: prev[RATINGS[quality].key] + 1 }))
  }

  // Called by FlashcardDeck when a card is swiped away
  function handleDeckDismiss(id, dir) {
    setCardsAnswered(n => n + 1)
    const knew  = dir === 'right'
    scheduleReview(id, knew)

    if (knew) {
      const newCount = incrementEasyCount(id)
      if (newCount >= HEAVEN_THRESHOLD) {
        setCounts(prev => ({ ...prev, mastered: prev.mastered + 1 }))
        setHeaven(true)
        setTimeout(() => setHeaven(false), 700)
        return
      }
      setCounts(prev => ({ ...prev, good: prev.good + 1 }))
    } else {
      setCounts(prev => ({ ...prev, again: prev.again + 1 }))
    }
  }

  function handleDeckComplete() {
    setDone(true)
  }

  function restart() {
    setFlipped(false); setDone(false); setCardsAnswered(0)
    setCounts({ again:0, hard:0, good:0, easy:0, mastered:0 })
    setDeckKey(k => k + 1)
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

  const progressPct = (cardsAnswered / cards.length) * 100
  const deckCards   = cards.map(q => ({ id: q.id, front: q.q, back: q.opts[q.ans], label: q.topic }))

  return (
    <Shell C={C}>
      <style>{css}</style>

      {/* Header */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <button
            onClick={() => navigate(`/${stream}`)}
            style={{background:'none', border:'none', cursor:'pointer', fontSize:20, color:C.muted, padding:'0 2px', lineHeight:1}}
          >←</button>
          <div style={{fontWeight:900, color:C.navy, fontSize:22, fontFamily:"'Playfair Display', Georgia, serif", letterSpacing:'-0.4px'}}>Flashcards</div>
        </div>
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
          <span style={{fontSize:12, color:C.muted, fontWeight:700}}>{cardsAnswered + 1}/{cards.length}</span>
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
            borderRadius:20, padding:'8px 16px', fontSize:13, fontWeight:700,
            color: topicFilter === t ? 'white' : C.muted,
            cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.2s',
          }}>{t}</button>
        ))}
      </div>

      {/* 4-level score tally */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:16}}>
        {RATINGS.map(r => (
          <div key={r.key} style={{textAlign:'center', background:r.bg, borderRadius:12, padding:'10px 6px', boxShadow:`0 2px 8px ${r.color}20`}}>
            <span style={{fontWeight:800, color:r.color, fontSize:15}}>{counts[r.key]}</span>
            <span style={{fontSize:9, color:C.muted, marginLeft:3, display:'block'}}>{r.label}</span>
          </div>
        ))}
      </div>

      {/* Card Heaven indicator */}
      {counts.mastered > 0 && (
        <div style={{textAlign:'center', marginBottom:12, fontSize:12, color:'#7C3AED', fontWeight:700}}>
          ✨ {counts.mastered} card{counts.mastered !== 1 ? 's' : ''} mastered → Card Heaven
        </div>
      )}

      {/* Stacked deck */}
      <div style={{ marginBottom:16, position:'relative' }}>
        <FlashcardDeck
          key={deckKey}
          cards={deckCards}
          C={C}
          height={240}
          onDismiss={handleDeckDismiss}
          onFlipChange={setFlipped}
          onComplete={handleDeckComplete}
        />
      </div>

      {/* Persistent SKIP / action / KNOW row */}
      <div style={{ display:'flex', alignItems:'stretch', gap:10, marginBottom:8 }}>
        {/* Skip pill */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
          background: flipped ? '#EF444418' : '#EF44440d',
          border:`1.5px solid ${flipped ? '#EF444445' : '#EF444420'}`,
          borderRadius:14, padding:'10px 8px',
          transition:'all 0.3s ease', opacity: flipped ? 1 : 0.55,
        }}>
          <span style={{ fontSize:20, lineHeight:1 }}>←</span>
          <span style={{ fontSize:14, fontWeight:800, color:'#EF4444' }}>Skip</span>
          <span style={{ fontSize:10, color:'#EF4444', opacity:0.7 }}>I forgot</span>
        </div>

        {/* Centre instruction */}
        <div style={{
          flex:1.2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
          background:`${C.primary}10`, border:`1px solid ${C.primary}22`,
          borderRadius:14, padding:'10px 8px',
          transition:'all 0.3s ease',
        }}>
          <span style={{ fontSize:flipped ? 18 : 22 }}>{flipped ? '↔' : '👆'}</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.primary, textAlign:'center', lineHeight:1.3 }}>
            {flipped ? 'Swipe to rate' : 'Tap to reveal'}
          </span>
        </div>

        {/* Know pill */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
          background: flipped ? '#10B98118' : '#10B9810d',
          border:`1.5px solid ${flipped ? '#10B98145' : '#10B98120'}`,
          borderRadius:14, padding:'10px 8px',
          transition:'all 0.3s ease', opacity: flipped ? 1 : 0.55,
        }}>
          <span style={{ fontSize:20, lineHeight:1 }}>→</span>
          <span style={{ fontSize:14, fontWeight:800, color:'#10B981' }}>Know</span>
          <span style={{ fontSize:10, color:'#10B981', opacity:0.7 }}>I knew it</span>
        </div>
      </div>
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
