'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

const F = '"DM Sans",-apple-system,BlinkMacSystemFont,system-ui,sans-serif'
const MONO = 'ui-monospace,"SF Mono","Cascadia Mono","Segoe UI Mono",monospace'

/* Consistent number formatting — avoids hydration mismatch from .toLocaleString() */
function fmtNum(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/* ═══════════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════════ */
function useReducedMotion() {
  const [r, setR] = useState(false)
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion:reduce)')
    setR(m.matches)
    const h = e => setR(e.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  return r
}

function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [v, setV] = useState(false)
  const rm = useReducedMotion()
  useEffect(() => {
    if (rm) { setV(true); return }
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.unobserve(el) } },
      { threshold, rootMargin: '40px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, rm])
  return [ref, v]
}

function Reveal({ children, delay = 0, style, className }) {
  const [ref, v] = useReveal()
  const rm = useReducedMotion()
  return (
    <div ref={ref} className={className} style={{
      opacity: v ? 1 : 0,
      transform: v ? 'translateY(0)' : 'translateY(24px)',
      transition: rm ? 'none' : `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}s, transform .7s cubic-bezier(.22,1,.36,1) ${delay}s`,
      ...style
    }}>
      {children}
    </div>
  )
}

function useVisible(ref) {
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setV(e.isIntersecting), { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return v
}

function useCountUp(target, run, ms = 2000) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!run) return
    let raf
    const t0 = performance.now()
    const tick = n => {
      const p = Math.min((n - t0) / ms, 1)
      const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setV(Math.round(target * ease))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, run, ms])
  return v
}

/* Scroll progress — drives interactive graphics */
function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const h = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? window.scrollY / max : 0)
    }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])
  return progress
}

/* ═══════════════════════════════════════════════════════════════════════
   SCROLL PROGRESS LINE — thin accent line at top
   ═══════════════════════════════════════════════════════════════════════ */
function ScrollLine() {
  const progress = useScrollProgress()
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, zIndex: 110,
      height: 2, width: `${progress * 100}%`,
      background: 'linear-gradient(90deg, #0A84FF, #D4B06A)',
      transition: 'width .05s linear',
    }} />
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   GRADIENT MESH
   ═══════════════════════════════════════════════════════════════════════ */
function GradientMesh() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%',
        borderRadius: '50%', filter: 'blur(120px)',
        background: 'radial-gradient(circle, rgba(10,132,255,0.06), transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%',
        borderRadius: '50%', filter: 'blur(100px)',
        background: 'radial-gradient(circle, rgba(212,176,106,0.035), transparent 70%)',
      }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   LIVE STAT — ticking dashboard stat
   ═══════════════════════════════════════════════════════════════════════ */
function LiveStat({ base, label, color, prefix = '', sub, subColor }) {
  const [value, setValue] = useState(base)
  useEffect(() => {
    if (!base) return
    setValue(base)
    const iv = setInterval(() => {
      setValue(prev => {
        const bump = label === 'WEALTH SCORE'
          ? (Math.random() > 0.6 ? 1 : 0)
          : Math.round(Math.random() * (base * 0.0003) + base * 0.00005)
        return prev + bump
      })
    }, 3500 + Math.random() * 2000)
    return () => clearInterval(iv)
  }, [base, label])

  const formatted = label === 'WEALTH SCORE' ? String(value) : prefix + fmtNum(value)
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '.08em', fontFamily: F, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color, fontFeatureSettings: '"tnum","lnum"' }}>{formatted}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: subColor, marginTop: 5, fontFeatureSettings: '"tnum","lnum"' }}>{sub}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   WEALTH GRAPH — draws on scroll
   ═══════════════════════════════════════════════════════════════════════ */
function WealthGraph() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const vis = useVisible(containerRef)
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [drawn, setDrawn] = useState(false)

  const data = useMemo(() => [
    { month: 'Jan', value: 2120000 }, { month: 'Feb', value: 2180000 },
    { month: 'Mar', value: 2150000 }, { month: 'Apr', value: 2290000 },
    { month: 'May', value: 2340000 }, { month: 'Jun', value: 2280000 },
    { month: 'Jul', value: 2410000 }, { month: 'Aug', value: 2520000 },
    { month: 'Sep', value: 2580000 }, { month: 'Oct', value: 2640000 },
    { month: 'Nov', value: 2710000 }, { month: 'Dec', value: 2847000 },
  ], [])

  useEffect(() => {
    if (!vis || drawn) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const W = rect.width, H = rect.height
    const pad = { t: 16, r: 16, b: 24, l: 16 }
    const min = Math.min(...data.map(d => d.value)) * 0.98
    const max = Math.max(...data.map(d => d.value)) * 1.02
    const points = data.map((d, i) => ({
      x: pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r),
      y: pad.t + (1 - (d.value - min) / (max - min)) * (H - pad.t - pad.b),
    }))
    const duration = 1800, start = performance.now()
    function animate(now) {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      const drawCount = Math.ceil(points.length * ease)
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < 4; i++) {
        const y = pad.t + (i / 3) * (H - pad.t - pad.b)
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y)
        ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 1; ctx.stroke()
      }
      const gradient = ctx.createLinearGradient(0, 0, 0, H)
      gradient.addColorStop(0, 'rgba(10,132,255,0.1)')
      gradient.addColorStop(1, 'rgba(10,132,255,0)')
      if (drawCount > 1) {
        ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < drawCount; i++) {
          const prev = points[i - 1], curr = points[i], cpx = (prev.x + curr.x) / 2
          ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
        }
        const last = points[drawCount - 1]
        ctx.lineTo(last.x, H - pad.b); ctx.lineTo(points[0].x, H - pad.b); ctx.closePath()
        ctx.fillStyle = gradient; ctx.fill()
        ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < drawCount; i++) {
          const prev = points[i - 1], curr = points[i], cpx = (prev.x + curr.x) / 2
          ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
        }
        ctx.strokeStyle = '#0A84FF'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke()
        const end = points[drawCount - 1]
        ctx.beginPath(); ctx.arc(end.x, end.y, 3.5, 0, Math.PI * 2); ctx.fillStyle = '#0A84FF'; ctx.fill()
        ctx.beginPath(); ctx.arc(end.x, end.y, 7, 0, Math.PI * 2); ctx.fillStyle = 'rgba(10,132,255,0.2)'; ctx.fill()
      }
      data.forEach((d, i) => {
        if (i % 3 === 0 || i === data.length - 1) {
          ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = `500 9px ${F}`; ctx.textAlign = 'center'
          ctx.fillText(d.month, points[i].x, H - 6)
        }
      })
      if (progress < 1) requestAnimationFrame(animate); else setDrawn(true)
    }
    requestAnimationFrame(animate)
  }, [vis, drawn, data])

  const handleHover = useCallback((e) => {
    if (!drawn) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const idx = Math.round(((x - 16) / (rect.width - 32)) * (data.length - 1))
    if (idx >= 0 && idx < data.length) setHoveredPoint({ ...data[idx], idx })
  }, [drawn, data])

  return (
    <div ref={containerRef} style={{ position: 'relative' }} onMouseMove={handleHover} onMouseLeave={() => setHoveredPoint(null)}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 160, display: 'block', cursor: drawn ? 'crosshair' : 'default' }} />
      {hoveredPoint && (
        <div style={{ position: 'absolute', top: 6, right: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(6,16,26,0.92)', border: '1px solid rgba(10,132,255,0.12)', pointerEvents: 'none' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', fontFamily: F }}>{hoveredPoint.month} 2026</div>
          <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: '#0A84FF', fontFeatureSettings: '"tnum","lnum"' }}>R{fmtNum(hoveredPoint.value)}</div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ALLOCATION RING — interactive hover
   ═══════════════════════════════════════════════════════════════════════ */
function AllocationRing() {
  const [hovered, setHovered] = useState(null)
  const segments = [
    { pct: 38, color: '#0A84FF', label: 'Crypto', amt: 'R1,081k' },
    { pct: 35, color: '#17B26A', label: 'Equities', amt: 'R997k' },
    { pct: 18, color: '#D4B06A', label: 'Property', amt: 'R512k' },
    { pct: 9, color: '#9B72CF', label: 'Cash', amt: 'R257k' },
  ]
  const r = 38, c = 2 * Math.PI * r
  let offset = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ flexShrink: 0 }}>
        {segments.map((s, i) => {
          const d = c * s.pct / 100, o = offset; offset += d
          return <circle key={s.label} cx="48" cy="48" r={r} fill="none" stroke={s.color} strokeWidth={hovered === i ? 7 : 5} strokeDasharray={`${d} ${c - d}`} strokeDashoffset={-o} strokeLinecap="round" transform="rotate(-90 48 48)" style={{ transition: 'stroke-width .2s, opacity .2s', opacity: hovered !== null && hovered !== i ? 0.3 : 1, cursor: 'pointer' }} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
        })}
        <text x="48" y="45" textAnchor="middle" fill="#E2E8F0" style={{ fontSize: 10, fontWeight: 700, fontFamily: F }}>{hovered !== null ? segments[hovered].pct + '%' : 'R2.8M'}</text>
        <text x="48" y="58" textAnchor="middle" fill="rgba(255,255,255,0.35)" style={{ fontSize: 7, fontFamily: F }}>{hovered !== null ? segments[hovered].label : 'NET WORTH'}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {segments.map((s, i) => (
          <div key={s.label} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 6px', borderRadius: 5, cursor: 'pointer', background: hovered === i ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background .15s' }}>
            <div style={{ width: 7, height: 7, borderRadius: 2.5, background: s.color }} />
            <span style={{ fontSize: 10, color: hovered === i ? '#E2E8F0' : 'rgba(255,255,255,0.4)', fontFamily: F, transition: 'color .15s' }}>{s.label}</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFeatureSettings: '"tnum","lnum"', marginLeft: 'auto' }}>{s.amt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   OPPORTUNITY COST — starts on page load
   ═══════════════════════════════════════════════════════════════════════ */
function OpportunityCost() {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(null)

  const CASH = 500000, RATE = 0.10
  const perSec = CASH * RATE / 365.25 / 24 / 3600
  const lost = elapsed * perSec

  useEffect(() => {
    startRef.current = performance.now()
    let raf
    const tick = (now) => {
      setElapsed((now - startRef.current) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const perDay = Math.round(CASH * RATE / 365.25)
  const perYear = fmtNum(CASH * RATE)
  const tenYear = fmtNum(CASH * (Math.pow(1 + RATE, 10) - 1))

  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Counter */}
      <div style={{ padding: '48px 32px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', color: '#E05A67', fontFamily: F, marginBottom: 14, textTransform: 'uppercase' }}>
          Lost since you opened this page
        </div>
        <div style={{
          fontFamily: MONO, fontSize: 'clamp(56px, 9vw, 84px)', fontWeight: 700,
          color: '#E05A67', letterSpacing: '-0.03em', lineHeight: 1,
          textShadow: `0 0 50px rgba(224,90,103,${Math.min(lost / 15, 0.35)})`,
          fontFeatureSettings: '"tnum","lnum"',
        }}>
          R{lost.toFixed(2)}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: F, marginTop: 14 }}>
          Based on $27,000 / R500,000 idle at 10% annual return
        </div>
      </div>
      {/* Breakdown — no bullets, clean grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {[
          { label: 'Per day', value: `R${perDay}` },
          { label: 'Per year', value: `R${perYear}` },
          { label: '10yr compounded', value: `R${tenYear}` },
        ].map((s, i) => (
          <div key={s.label} style={{
            padding: '24px 20px', textAlign: 'center',
            background: 'rgba(6,16,26,0.5)',
            borderRight: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', fontFamily: F, letterSpacing: '.06em', marginBottom: 6, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: '#E05A67', letterSpacing: '-0.02em', fontFeatureSettings: '"tnum","lnum"' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   WAITLIST FORM
   ═══════════════════════════════════════════════════════════════════════ */
function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [msg, setMsg] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) { setStatus('error'); setMsg('Please enter a valid email.'); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (res.ok) { setStatus('success'); setMsg("You're on the list."); setEmail('') }
      else { setStatus('error'); setMsg(data.error || 'Something went wrong.') }
    } catch { setStatus('error'); setMsg('Connection error. Try again.') }
  }

  if (status === 'success') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 24px', borderRadius: 12, background: 'rgba(23,178,106,0.06)', border: '1px solid rgba(23,178,106,0.1)' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="9" fill="#17B26A" opacity=".1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#17B26A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ fontSize: 15, fontWeight: 500, color: '#17B26A', fontFamily: F }}>{msg}</span>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 460 }}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
        style={{ flex: 1, padding: '14px 18px', fontSize: 15, fontFamily: F, color: '#E2E8F0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, outline: 'none', transition: 'border-color .2s, box-shadow .2s' }}
        onFocus={e => { e.target.style.borderColor = 'rgba(10,132,255,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(10,132,255,0.08)' }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }}
      />
      <button type="submit" disabled={status === 'loading'} className="cta-btn" style={{ padding: '14px 28px', fontSize: 15, fontWeight: 600, fontFamily: F, color: '#fff', background: '#0A84FF', border: 'none', borderRadius: 10, cursor: status === 'loading' ? 'wait' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {status === 'loading' ? 'Joining...' : 'Get early access'}
      </button>
      {status === 'error' && <div style={{ width: '100%', fontSize: 13, color: '#E05A67', fontFamily: F, marginTop: 4 }}>{msg}</div>}
    </form>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   CSS
   ═══════════════════════════════════════════════════════════════════════ */
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
::selection{background:rgba(10,132,255,.2);color:#fff}
body{overflow-x:hidden;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}

.cta-btn{transition:all .2s ease}
.cta-btn:hover{filter:brightness(1.1);box-shadow:0 4px 20px rgba(10,132,255,.25)}
.nav-a{transition:color .15s}.nav-a:hover{color:#E2E8F0!important}
.mockup-wrap{transition:transform .5s cubic-bezier(.22,1,.36,1)}.mockup-wrap:hover{transform:perspective(2000px) rotateX(1deg)!important}
.feat-card{transition:all .3s cubic-bezier(.22,1,.36,1)}.feat-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.06)!important;box-shadow:0 16px 48px rgba(0,0,0,.2)}
.step-n{transition:all .3s}.step-card:hover .step-n{color:#0A84FF!important;opacity:0.3!important}
.ham{display:none!important}

@media(max-width:860px){
  .hero-h1{font-size:clamp(34px,7vw,50px)!important}
  .nav-mid{display:none!important}.ham{display:flex!important}
  .mockup-outer{display:none!important}.mobile-stats{display:flex!important}
  .steps-row{flex-direction:column!important}
  .feat-grid{grid-template-columns:1fr 1fr!important}
  .compare-row{flex-direction:column!important}
}
@media(max-width:480px){
  .hero-h1{font-size:30px!important}.hero-h1 br{display:none}
  .feat-grid{grid-template-columns:1fr!important}
  .breakdown-grid{grid-template-columns:1fr!important}
}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`

/* ═══════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Force scroll to top on load
  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h, { passive: true })
    h()
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const [hRef, hVis] = useReveal()
  const nw = useCountUp(2847320, hVis)
  const cf = useCountUp(48200, hVis, 2200)
  const ws = useCountUp(78, hVis, 1600)

  /* ─── high-contrast color palette ────────────────────────────────── */
  const txt = '#F1F5F9'       // primary text — near white
  const txtMid = '#B0BEC5'    // secondary text — clearly readable
  const txtDim = '#8897A5'    // tertiary — labels, still visible
  const txtFaint = '#6B7B8D'  // faintest — decorative, but legible

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: CSS }} />
    <ScrollLine />
    <GradientMesh />
    <div style={{ minHeight: '100vh', background: '#06101A', color: txt, fontFamily: F, position: 'relative', zIndex: 1 }}>

    {/* ═══ NAV ═══════════════════════════════════════════════════════════ */}
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64,
      padding: '0 clamp(16px, 4vw, 32px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: scrolled ? 'rgba(6,16,26,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px) saturate(1.6)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(1.6)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
      transition: 'all .3s ease',
    }}>
      <div style={{ maxWidth: 1060, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 800, color: '#fff', fontFamily: F, letterSpacing: '.02em', background: '#0A84FF' }}>MFT</div>
          <span style={{ fontSize: 15, fontWeight: 600, color: txt, fontFamily: F }}>MyFortuneTracker</span>
        </a>
        <div className="nav-mid" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {[['Features', '#features'], ['How it works', '#steps']].map(([l, h]) => (
            <a key={l} href={h} className="nav-a" style={{ fontSize: 13, fontWeight: 500, color: txtDim, textDecoration: 'none', fontFamily: F }}>{l}</a>
          ))}
          <a href="#waitlist" className="cta-btn" style={{ fontSize: 13, fontWeight: 600, color: '#fff', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontFamily: F, background: '#0A84FF' }}>Get early access</a>
        </div>
        <button className="ham" onClick={() => setMenuOpen(true)} aria-label="Menu" style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer', padding: 0, color: txtDim }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="5" x2="16" y2="5"/><line x1="2" y1="9" x2="16" y2="9"/><line x1="2" y1="13" x2="16" y2="13"/></svg>
        </button>
      </div>
    </nav>

    {/* Mobile menu */}
    {menuOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(6,16,26,0.98)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <button onClick={() => setMenuOpen(false)} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: txtDim, cursor: 'pointer', padding: 8 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>
        {[['Features', '#features'], ['How it works', '#steps']].map(([l, h]) => (
          <a key={l} href={h} onClick={() => setMenuOpen(false)} style={{ fontSize: 20, fontWeight: 500, color: txt, textDecoration: 'none', fontFamily: F }}>{l}</a>
        ))}
        <a href="#waitlist" onClick={() => setMenuOpen(false)} className="cta-btn" style={{ fontSize: 16, fontWeight: 600, color: '#fff', background: '#0A84FF', padding: '14px 36px', borderRadius: 12, textDecoration: 'none', fontFamily: F, marginTop: 8 }}>Get early access</a>
      </div>
    )}

    {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
    <section ref={hRef} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '120px clamp(20px,5vw,32px) 80px', textAlign: 'center',
    }}>
      <Reveal>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, marginBottom: 32, background: 'rgba(10,132,255,0.05)', border: '1px solid rgba(10,132,255,0.1)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#17B26A' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#0A84FF', fontFamily: F }}>AI-powered wealth platform</span>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <h1 className="hero-h1" style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 600, lineHeight: 1.08, letterSpacing: '-0.035em', color: '#F8FAFC', margin: '0 0 24px', maxWidth: 680 }}>
          See what your money<br />
          <span style={{ color: '#0A84FF' }}>should</span> be doing.
        </h1>
      </Reveal>

      <Reveal delay={0.1}>
        <p style={{ fontSize: 18, fontWeight: 400, color: txtMid, lineHeight: 1.7, margin: '0 auto 40px', maxWidth: 520 }}>
          AI that tracks every asset, reveals the true cost of inaction,
          and simulates 10,000 futures before you make a single move.
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <WaitlistForm />
        <p style={{ fontSize: 13, color: txtFaint, fontFamily: F, marginTop: 14 }}>Free to join. No spam. Launch notifications only.</p>
      </Reveal>

      {/* ── Dashboard mockup ── */}
      <Reveal delay={0.2} className="mockup-outer" style={{ width: '100%', maxWidth: 900, padding: '60px 24px 0' }}>
        <div className="mockup-wrap" style={{
          transform: 'perspective(2000px) rotateX(3deg)',
          borderRadius: 18, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(8,18,30,0.7)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 60px 120px rgba(0,0,0,0.4), 0 0 60px rgba(10,132,255,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {['#E05A67', '#E89A3C', '#17B26A'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: .45 }} />)}
            <div style={{ flex: 1, marginLeft: 12, padding: '4px 14px', borderRadius: 7, background: 'rgba(255,255,255,0.025)', fontSize: 11, color: txtFaint, fontFamily: F, textAlign: 'center' }}>myfortunetracker.ai</div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              <LiveStat base={nw} label="NET WORTH" color="#D4B06A" prefix="R" sub="+12.4% YTD" subColor="#17B26A" />
              <LiveStat base={cf} label="MONTHLY CASH FLOW" color={txt} prefix="R" sub="+R3,400 vs last month" subColor="#17B26A" />
              <LiveStat base={ws} label="WEALTH SCORE" color="#0A84FF" sub="Top 15% globally" subColor="#0A84FF" />
            </div>
            <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '.08em', fontFamily: F }}>PORTFOLIO GROWTH — 12 MONTHS</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: '#17B26A', fontWeight: 600, fontFeatureSettings: '"tnum","lnum"' }}>+34.2%</span>
              </div>
              <WealthGraph />
            </div>
            <div style={{ padding: '0 4px' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '.08em', fontFamily: F, marginBottom: 6 }}>ASSET ALLOCATION</div>
              <AllocationRing />
            </div>
          </div>
        </div>
        <div style={{ height: 60, background: 'linear-gradient(180deg, rgba(10,132,255,0.015), transparent)', borderRadius: '0 0 18px 18px', marginTop: -1 }} />
      </Reveal>

      {/* Mobile stats */}
      <div className="mobile-stats" style={{ display: 'none', gap: 10, padding: '40px 24px 0', width: '100%', maxWidth: 420, zIndex: 1 }}>
        {[{ l: 'Net Worth', v: 'R2.8M', c: '#D4B06A' }, { l: 'Cash Flow', v: 'R48.2k', c: txt }, { l: 'Score', v: '78', c: '#0A84FF' }].map(s => (
          <div key={s.l} style={{ flex: 1, padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: txtDim, fontFamily: F, marginBottom: 5 }}>{s.l}</div>
            <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: s.c, fontFeatureSettings: '"tnum","lnum"' }}>{s.v}</div>
          </div>
        ))}
      </div>
    </section>

    {/* ═══ TRUST BAR ════════════════════════════════════════════════════ */}
    <section style={{ borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '20px 24px' }}>
      <div className="trust-bar" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
        {['AI-optimised portfolios', 'Global market coverage', 'Free forever tier', '10,000 simulations per decision'].map((t, i) => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500, color: txtFaint, fontFamily: F, whiteSpace: 'nowrap' }}>
            {i > 0 && <span style={{ width: 3, height: 3, borderRadius: '50%', background: txtFaint }} />}
            {t}
          </span>
        ))}
      </div>
    </section>

    {/* ═══ OPPORTUNITY COST ═════════════════════════════════════════════ */}
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '140px clamp(20px,5vw,32px)' }}>
      <Reveal>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#F8FAFC', margin: '0 0 16px' }}>
            Doing nothing is expensive.
          </h2>
          <p style={{ fontSize: 17, color: txtMid, fontFamily: F, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
            Our engine calculates what your idle money should be earning — every second, in real time.
          </p>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <OpportunityCost />
      </Reveal>
    </section>

    {/* ═══ FEATURES — clean grid, no bullets ═══════════════════════════ */}
    <section id="features" style={{ maxWidth: 1060, margin: '0 auto', padding: '60px clamp(20px,5vw,32px) 140px' }}>
      <Reveal>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#F8FAFC', margin: '0 0 16px' }}>
            Built for an unfair advantage.
          </h2>
          <p style={{ fontSize: 17, color: txtMid, fontFamily: F, lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>
            Six intelligent tools. One platform. Every market.
          </p>
        </div>
      </Reveal>

      <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { accent: '#0A84FF', title: 'Portfolio Intelligence', desc: 'Every asset class in one real-time view. Crypto, stocks, property, cash — any currency, any market.' },
          { accent: '#9B72CF', title: 'Tax Optimiser', desc: 'Capital gains calculations for your jurisdiction. Smart alerts before deadlines hit.' },
          { accent: '#17B26A', title: 'Wealth Adviser', desc: 'Personalised daily insights powered by AI. What happened overnight, what matters, what to do next.' },
          { accent: '#E89A3C', title: 'Property Analysis', desc: 'Rental vs Airbnb yield, buy vs rent calculators, transfer costs and ROI projections.' },
          { accent: '#E05A67', title: 'Monte Carlo Engine', desc: '10,000 simulations of your financial future. See probability distributions, not guesswork.' },
          { accent: '#D4B06A', title: 'Opportunity Cost', desc: 'Tracks the exact cost of every idle dollar, pound, or rand — every second of every day.' },
        ].map((f, i) => (
          <Reveal key={f.title} delay={i * 0.04}>
            <div className="feat-card" style={{
              padding: 32, borderRadius: 16,
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
              height: '100%', cursor: 'default',
            }}>
              <div style={{ width: 4, height: 28, borderRadius: 2, background: f.accent, marginBottom: 20, opacity: 0.9 }} />
              <div style={{ fontSize: 17, fontWeight: 600, color: '#F1F5F9', fontFamily: F, marginBottom: 10 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: txtMid, fontFamily: F, lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>

    {/* ═══ HOW IT WORKS ═════════════════════════════════════════════════ */}
    <section id="steps" style={{ maxWidth: 1060, margin: '0 auto', padding: '60px clamp(20px,5vw,32px) 140px' }}>
      <Reveal>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#F8FAFC', margin: '0 0 16px' }}>
            Three steps to full clarity.
          </h2>
        </div>
      </Reveal>
      <div className="steps-row" style={{ display: 'flex', gap: 16 }}>
        {[
          { n: '01', title: 'Connect everything', desc: 'Link crypto exchanges, brokers, property, and bank accounts from anywhere. Your net worth — mapped in under 60 seconds.', tag: 'Global exchanges · Auto-sync · CSV' },
          { n: '02', title: 'Wake up smarter', desc: 'While you sleep, MFT analyses global markets and prepares the 3-5 insights that actually matter to your portfolio.', tag: 'AI analysis · Real-time · Personalised' },
          { n: '03', title: 'Move with confidence', desc: 'Stress-test every scenario before you act. See the tax impact, run 10,000 simulations, know the odds.', tag: 'Simulations · Tax engine · Stress test' },
        ].map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08} style={{ flex: 1 }}>
            <div className="step-card" style={{ padding: 32, borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)', height: '100%' }}>
              <div className="step-n" style={{ fontSize: 48, fontWeight: 700, fontFamily: MONO, lineHeight: 1, color: '#0A84FF', opacity: 0.12, marginBottom: 20, fontFeatureSettings: '"tnum","lnum"', transition: 'all .3s' }}>{s.n}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9', fontFamily: F, marginBottom: 10 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: txtMid, fontFamily: F, lineHeight: 1.7, marginBottom: 16 }}>{s.desc}</div>
              <div style={{ display: 'inline-block', padding: '5px 12px', borderRadius: 6, background: 'rgba(10,132,255,0.05)', fontSize: 12, fontWeight: 500, color: txtDim, fontFamily: F }}>{s.tag}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>

    {/* ═══ COMPARE — clean two-column, NO bullet points ═════════════════ */}
    <section style={{ maxWidth: 880, margin: '0 auto', padding: '60px clamp(20px,5vw,32px) 140px' }}>
      <Reveal>
        <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 600, letterSpacing: '-0.03em', textAlign: 'center', margin: '0 0 56px', color: '#F8FAFC', lineHeight: 1.1 }}>
          The difference is clarity.
        </h2>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="compare-row" style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ padding: '16px 28px', background: 'rgba(100,116,139,0.06)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: txtDim, letterSpacing: '.08em', fontFamily: F }}>WITHOUT</span>
            </div>
            <div style={{ padding: '24px 28px' }}>
              {['Scattered spreadsheets across apps', 'No visibility on what idle cash costs you', 'Missing tax deadlines across jurisdictions', 'Logging into multiple brokers daily', 'Making decisions based on gut feel'].map((t, i) => (
                <div key={t} style={{ padding: '12px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  <span style={{ fontSize: 14, fontFamily: F, color: txtMid, lineHeight: 1.6 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(23,178,106,0.08)' }}>
            <div style={{ padding: '16px 28px', background: 'rgba(23,178,106,0.04)', borderBottom: '1px solid rgba(23,178,106,0.06)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#17B26A', letterSpacing: '.08em', fontFamily: F }}>WITH MYFORTUNETRACKER</span>
            </div>
            <div style={{ padding: '24px 28px' }}>
              {['One dashboard — any asset, any currency, any country', 'Opportunity cost calculated every second', 'Smart tax alerts before every deadline', 'Net worth updated live in 10 seconds', '10,000 simulations before every decision'].map((t, i) => (
                <div key={t} style={{ padding: '12px 0', borderBottom: i < 4 ? '1px solid rgba(23,178,106,0.04)' : 'none' }}>
                  <span style={{ fontSize: 14, fontFamily: F, color: '#E2E8F0', lineHeight: 1.6 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>

    {/* ═══ FINAL CTA ═══════════════════════════════════════════════════ */}
    <section id="waitlist" style={{ padding: '100px clamp(20px,5vw,32px) 140px', textAlign: 'center' }}>
      <Reveal>
        <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#F8FAFC', margin: '0 0 16px' }}>
          Stop losing money to inaction.
        </h2>
        <p style={{ fontSize: 17, color: txtMid, fontFamily: F, margin: '0 auto 40px', maxWidth: 420, lineHeight: 1.7 }}>
          Join the waitlist. Free forever tier included.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <WaitlistForm />
        </div>
      </Reveal>
    </section>

    {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.03)', padding: '32px clamp(20px,5vw,32px)' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: '#0A84FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6.5, fontWeight: 800, color: '#fff', fontFamily: F }}>MFT</div>
          <span style={{ fontSize: 13, color: txtFaint, fontFamily: F }}>MyFortuneTracker</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="mailto:support@myfortunetracker.ai" style={{ fontSize: 12, color: txtDim, fontFamily: F, textDecoration: 'none' }}>support@myfortunetracker.ai</a>
          <span style={{ fontSize: 12, color: txtFaint, fontFamily: F }}>&copy; {new Date().getFullYear()} MyFortuneTracker</span>
        </div>
      </div>
    </footer>

    </div>
    </>
  )
}
