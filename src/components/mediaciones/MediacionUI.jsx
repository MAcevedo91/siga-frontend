import { cloneElement, useEffect, useId, useRef } from 'react'
export const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500'
export const buttonClass =
  'rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'
export const secondaryClass =
  'rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50'
export function ErrorBox({ children }) {
  return children ? (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
    >
      {children}
    </div>
  ) : null
}
export function Modal({ title, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    ref.current?.focus()
    const handle = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const nodes = [
          ...ref.current.querySelectorAll(
            'button,input,select,textarea,a[href],[tabindex="0"]',
          ),
        ].filter((n) => !n.disabled)
        const first = nodes[0],
          last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', handle)
    return () => {
      document.removeEventListener('keydown', handle)
      previous?.focus()
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="text-slate-900 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className={secondaryClass}
            aria-label="Cerrar ventana"
          >
            Cerrar
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
export function Field({ label, children }) {
  const generatedId = useId()
  const id = children.props.id || generatedId
  return (
    <div className="grid gap-1.5 text-sm font-medium text-slate-700">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id })}
    </div>
  )
}
export function PageTitle({ title, subtitle, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </header>
  )
}
