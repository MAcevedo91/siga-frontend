import { useState, useRef, useEffect } from 'react'

export default function ReporteMensualCard({ onDownloadPdf }) {
  const [busy, setBusy] = useState(false)
  const [stepText, setStepText] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [sheetGo, setSheetGo] = useState(false)
  const [noteHtml, setNoteHtml] = useState('Análisis directivo con IA')

  const cardRef = useRef(null)
  const btnRef = useRef(null)

  // Mes actual capitalizado dinámico (ej: "Noviembre 2026")
  const mesActual = (() => {
    const d = new Date()
    const str = d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    return str.charAt(0).toUpperCase() + str.slice(1)
  })()

  const triggerSparks = () => {
    if (!cardRef.current || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const c = cardRef.current.getBoundingClientRect()

    for (let i = 0; i < 14; i++) {
      const spark = document.createElement('i')
      spark.className = 'rm-spark'
      spark.style.left = `${r.left - c.left + r.width / 2}px`
      spark.style.top = `${r.top - c.top + r.height / 2}px`
      const a = Math.random() * Math.PI * 2
      const d = 40 + Math.random() * 60
      spark.style.setProperty('--x', `${Math.cos(a) * d}px`)
      spark.style.setProperty('--y', `${Math.sin(a) * d}px`)
      cardRef.current.appendChild(spark)
      setTimeout(() => spark.remove(), 900)
    }
  }

  const handleClick = async () => {
    if (busy) return

    setBusy(true)
    setSheetGo(true)
    setIsSuccess(false)

    const steps = [
      'Analizando datos…',
      'Redactando conclusiones…',
      'Maquetando el PDF…',
    ]

    setStepText(steps[0])
    let stepIndex = 0

    const interval = setInterval(() => {
      stepIndex++
      if (stepIndex < steps.length) {
        setStepText(steps[stepIndex])
      }
    }, 1200)

    try {
      if (onDownloadPdf) {
        await onDownloadPdf()
      }
      clearInterval(interval)
      setStepText('Listo ✓')
      setIsSuccess(true)
      setNoteHtml('Reporte descargado · Análisis directivo con IA')
      triggerSparks()

      setTimeout(() => {
        setBusy(false)
        setSheetGo(false)
        setIsSuccess(false)
        setStepText('')
        setNoteHtml('Análisis directivo con IA')
      }, 2200)
    } catch (err) {
      clearInterval(interval)
      setStepText('Error al generar')
      setTimeout(() => {
        setBusy(false)
        setSheetGo(false)
        setStepText('')
      }, 2000)
    }
  }

  return (
    <>
      <style>{`
        .rm-card {
          --card1: #e9fbf4;
          --card2: #f8fdfb;
          --edge: #9fe3cc;
          --ink: #16302b;
          --muted: #4d6560;
          --teal: #17897a;
          --green: #0f9560;
          --paper: #ffffff;
          --line: #d5e3df;
          --bar: #17897a;
          --shadow: rgba(23,80,70,.22);
          position: relative;
          width: 100%;
          padding: 22px 22px 18px;
          border-radius: 22px;
          border: 1px solid var(--edge);
          background: linear-gradient(150deg, var(--card1), var(--card2));
          color: var(--ink);
          overflow: visible;
          box-shadow: 0 4px 18px -4px var(--shadow);
          transition: transform .25s ease, box-shadow .25s ease;
        }

        :is(.dark, [data-theme="dark"]) .rm-card {
          --card1: #12302b;
          --card2: #0f1f1c;
          --edge: #2a6a5c;
          --ink: #e6f4ef;
          --muted: #9bb8b1;
          --teal: #2bb5a2;
          --green: #25b57c;
          --paper: #162c27;
          --line: #2a4c43;
          --bar: #2bb5a2;
          --shadow: rgba(0,0,0,.5);
        }

        .rm-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .rm-head h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: .01em;
          color: var(--ink);
        }
        .rm-badge {
          margin-left: auto;
          font-size: 12px;
          font-weight: 700;
          color: var(--teal);
          border: 1px solid var(--edge);
          border-radius: 99px;
          padding: 3px 10px;
          background: rgba(23,137,122,.12);
        }
        .rm-stage {
          position: relative;
          height: 145px;
          margin: 0 6px 18px;
        }
        .rm-sheet {
          position: absolute;
          left: 50%;
          top: 0;
          width: 145px;
          height: 185px;
          margin-left: -72.5px;
          background: var(--paper);
          border-radius: 8px;
          padding: 14px 14px;
          box-shadow: 0 14px 28px -10px var(--shadow);
          transform: rotate(-4deg) translateY(6px);
          transform-origin: 50% 100%;
          transition: transform .45s cubic-bezier(.2,.8,.2,1);
          clip-path: inset(-20px -20px 40px -20px);
          border: 1px solid var(--line);
        }
        .rm-card:hover .rm-sheet,
        .rm-card:focus-within .rm-sheet,
        .rm-sheet.go {
          transform: rotate(0) translateY(-6px);
        }
        .rm-sheet .t {
          height: 7px;
          width: 60%;
          background: var(--ink);
          border-radius: 3px;
          margin-bottom: 10px;
          opacity: .85;
        }
        .rm-sheet .l {
          height: 4px;
          background: var(--line);
          border-radius: 2px;
          margin-bottom: 6px;
        }
        .rm-sheet .l:nth-child(4) { width: 85%; }
        .rm-sheet .l:nth-child(5) { width: 70%; }

        .rm-bars {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 42px;
          margin: 12px 0 10px;
        }
        .rm-bars i {
          flex: 1;
          background: var(--bar);
          border-radius: 2px 2px 0 0;
          height: var(--h);
          transform-origin: bottom;
          transition: transform .5s cubic-bezier(.2,.8,.2,1);
        }
        .rm-sheet:not(.go) .rm-bars i {
          transform: scaleY(.55);
        }
        .rm-card:hover .rm-bars i,
        .rm-sheet.go .rm-bars i {
          transform: scaleY(1);
        }

        .rm-stamp {
          position: absolute;
          right: 2px;
          top: 18px;
          transform: rotate(8deg);
          background: var(--teal);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          box-shadow: 0 6px 12px -4px var(--shadow);
          pointer-events: none;
        }

        .rm-btn {
          position: relative;
          width: 100%;
          height: 44px;
          border: 0;
          border-radius: 12px;
          cursor: pointer;
          overflow: hidden;
          background: linear-gradient(90deg, var(--teal), var(--green));
          color: #fff;
          font: 700 13.5px inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity .2s ease, transform .15s ease;
          box-shadow: 0 4px 12px -2px rgba(15,149,96,.35);
        }
        .rm-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px -2px rgba(15,149,96,.45);
        }
        .rm-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .rm-btn:focus-visible {
          outline: 3px solid var(--ink);
          outline-offset: 3px;
        }
        .rm-btn .fill {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,.22);
          transform: scaleX(0);
          transform-origin: left;
        }
        .rm-btn.busy {
          cursor: progress;
        }
        .rm-btn.busy .fill {
          transition: transform 3.6s linear;
          transform: scaleX(1);
        }
        .rm-btn span {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          z-index: 2;
        }

        .rm-note {
          margin: 12px 2px 0;
          font-size: 12px;
          color: var(--muted);
          min-height: 18px;
          text-align: center;
        }
        .rm-note b {
          color: var(--ink);
          font-weight: 600;
        }

        .rm-spark {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--teal);
          pointer-events: none;
          z-index: 20;
          animation: rmPop .8s ease-out forwards;
        }
        @keyframes rmPop {
          to {
            transform: translate(var(--x), var(--y)) scale(0);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .rm-sheet, .rm-bars i, .rm-btn .fill { transition: none !important; }
          .rm-spark { display: none; }
        }
      `}</style>

      <section
        ref={cardRef}
        className="rm-card"
        aria-label="Reporte mensual institucional"
      >
        <div className="rm-head">
          <h2>Reporte mensual</h2>
          <span className="rm-badge">IA</span>
        </div>

        <div className="rm-stage" aria-hidden="true">
          <div className={`rm-sheet ${sheetGo ? 'go' : ''}`}>
            <div className="t" />
            <div className="l" style={{ width: '100%' }} />
            <div className="l" style={{ width: '92%' }} />
            <div className="l" />
            <div className="l" />
            <div className="rm-bars">
              <i style={{ '--h': '40%' }} />
              <i style={{ '--h': '62%' }} />
              <i style={{ '--h': '48%' }} />
              <i style={{ '--h': '80%' }} />
              <i style={{ '--h': '100%' }} />
            </div>
            <div className="l" style={{ width: '90%' }} />
            <div className="l" style={{ width: '55%' }} />
          </div>
          <div className="rm-stamp">{mesActual}</div>
        </div>

        <button
          ref={btnRef}
          className={`rm-btn ${busy ? 'busy' : ''}`}
          type="button"
          onClick={handleClick}
          disabled={busy}
          aria-busy={busy}
        >
          <div className="fill" />
          <span>
            {!busy && !isSuccess && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
              </svg>
            )}
            {busy ? stepText : isSuccess ? 'Listo ✓' : 'Descargar PDF'}
          </span>
        </button>

        <p className="rm-note" aria-live="polite">
          {noteHtml}
        </p>
      </section>
    </>
  )
}
