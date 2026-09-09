import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, HelpCircle, X, ShieldCheck } from 'lucide-react'
import { useAuth, getDefaultRouteByRole } from '@/store/useAuthStore'
import { loginRequest } from '@/services/authService'
import sigaLogo from '@/assets/siga-escolar-logo.png'
import imgStudents from '@/assets/img_students.svg'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [shakeForm, setShakeForm] = useState(false)
  const [activeModal, setActiveModal] = useState(null) // 'terms' | 'contact' | null

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const triggerShake = () => {
    setShakeForm(true)
    setTimeout(() => setShakeForm(false), 400)
  }

  const onSubmit = async ({ email, password }) => {
    setServerError('')
    setIsLoading(true)
    try {
      const sanitizedEmail = email.trim()
      const { token, user } = await loginRequest(sanitizedEmail, password)
      login(token, user)
      navigate(getDefaultRouteByRole(user?.rol))
    } catch (err) {
      const status = err.response?.status
      if (status === 403) {
        setServerError('Cuenta bloqueada temporalmente por seguridad. Intenta en 15 minutos.')
      } else {
        setServerError('Credenciales incorrectas. Verifica tu email y contraseña.')
      }
      triggerShake()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#071526] flex items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden font-sans select-none">
      
      {/* Elementos decorativos de fondo con movimiento fluido (bokeh / glow) */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#16435d]/30 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] bg-[#124d54]/30 rounded-full blur-3xl pointer-events-none animate-float-medium" />
      <div className="absolute top-1/4 right-10 w-72 h-72 bg-[#1b3a4b]/25 rounded-full blur-2xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-16 left-1/4 w-64 h-64 bg-[#0d2a3a]/40 rounded-full blur-2xl pointer-events-none animate-float-slow" />

      {/* Partículas y orbes bokeh con movimiento activo */}
      <div className="absolute top-16 left-20 w-4 h-4 rounded-full bg-teal-300/30 blur-[1px] pointer-events-none animate-float-fast" />
      <div className="absolute top-32 right-36 w-6 h-6 rounded-full bg-cyan-200/20 blur-[2px] pointer-events-none animate-float-medium" />
      <div className="absolute top-2/3 right-16 w-5 h-5 rounded-full bg-emerald-300/25 blur-[1.5px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-20 right-28 w-8 h-8 rounded-full bg-white/15 blur-[2px] pointer-events-none animate-float-medium" />
      <div className="absolute bottom-32 left-24 w-4 h-4 rounded-full bg-emerald-200/30 blur-[1px] pointer-events-none animate-float-fast" />
      <div className="absolute top-1/2 left-12 w-6 h-6 rounded-full bg-slate-200/15 blur-[2px] pointer-events-none animate-float-slow" />
      <div className="absolute top-10 right-1/3 w-3 h-3 rounded-full bg-teal-100/30 blur-[1px] pointer-events-none animate-float-fast" />
      <div className="absolute bottom-10 left-1/2 w-5 h-5 rounded-full bg-cyan-300/20 blur-[2px] pointer-events-none animate-float-medium" />

      {/* Contenedor Principal: Responsive (en pantallas pequeñas < md solo se muestra el formulario) */}
      <main className="w-full max-w-sm sm:max-w-md md:max-w-5xl bg-[#091b2c] rounded-3xl md:rounded-[36px] shadow-2xl overflow-hidden border border-white/10 relative z-10 flex flex-col md:flex-row transition-all duration-300">
        
        {/* Lado Izquierdo: Ilustración de Estudiantes (oculto en pantallas pequeñas) */}
        <section className="hidden md:flex md:w-7/12 bg-[#FAF9F8] p-8 sm:p-10 md:p-12 flex-col justify-between items-center relative overflow-hidden">
          
          <div className="w-full" />

          {/* Ilustración Central de Estudiantes (img_students.svg) */}
          <div className="my-auto py-6 sm:py-8 flex items-center justify-center relative z-10 w-full">
            <img
              src={imgStudents}
              alt="Comunidad escolar interactuando"
              className="max-h-[320px] md:max-h-[420px] w-auto max-w-full object-contain drop-shadow-sm transition-transform duration-500 hover:scale-[1.02]"
            />
          </div>

          {/* Footer del Lado Izquierdo */}
          <footer className="text-xs text-gray-500 font-medium leading-tight z-10 pt-2 w-full text-center md:text-left">
            <p>© {new Date().getFullYear()} SIGA Escolar</p>
            <p className="text-gray-400 font-normal mt-0.5">Powered by SIGA Systems</p>
          </footer>
        </section>

        {/* Lado Derecho: Tarjeta Flotante con Formulario de Acceso */}
        <section className="w-full md:w-5/12 bg-[#091b2c] p-4 sm:p-6 md:p-10 flex items-center justify-center relative">
          
          {/* Tarjeta Flotante Color Menta Pastel */}
          <div
            className={`w-full max-w-sm bg-[#d7ece5] rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100/60 flex flex-col justify-between ${
              shakeForm ? 'animate-shake' : 'animate-fade-slide-up'
            }`}
          >
            <div>
              {/* Logo Oficial siga-escolar-logo.png centrado en la parte superior, justo arriba de Acceder */}
              <div className="flex flex-col items-center justify-center mb-4">
                <img
                  src={sigaLogo}
                  alt="SIGA Escolar - Sistema de Gestión y Acompañamiento Escolar"
                  className="w-56 sm:w-64 max-h-32 object-contain mb-2 drop-shadow-sm transition-transform duration-300 hover:scale-105"
                />
                {/* Título de Acceso */}
                <h1 className="text-3xl sm:text-4xl font-bold text-[#0c242b] tracking-tight text-center">
                  Acceder
                </h1>
              </div>

              {/* Formulario de Login */}
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                
                {/* Campo Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#0c242b] mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="Introduce tu email"
                      className={`w-full px-5 py-3 rounded-full bg-[#11232f] text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#135d54] transition-all border ${
                        errors.email ? 'border-red-400 ring-2 ring-red-400/30' : 'border-transparent'
                      }`}
                      {...register('email', {
                        required: 'Introduce tu email institucional',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Introduce un formato de correo válido'
                        }
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p role="alert" className="mt-1.5 px-3 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Campo Contraseña */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-[#0c242b] mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Introduce tu contraseña"
                      className={`w-full pl-5 pr-12 py-3 rounded-full bg-[#11232f] text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#135d54] transition-all border ${
                        errors.password ? 'border-red-400 ring-2 ring-red-400/30' : 'border-transparent'
                      }`}
                      {...register('password', {
                        required: 'Introduce tu contraseña'
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar texto de la contraseña' : 'Ver texto de la contraseña'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p role="alert" className="mt-1.5 px-3 text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Mensaje de Error del Servidor */}
                {serverError && (
                  <div
                    role="alert"
                    className="rounded-2xl bg-red-50 border border-red-200 px-3.5 py-2.5 flex items-start gap-2 text-xs text-red-700 font-medium mt-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Botón de Acción Principal */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-full bg-[#135d54] hover:bg-[#0f4e46] active:bg-[#0c3e38] text-white font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#135d54]"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Accediendo...</span>
                      </>
                    ) : (
                      <span>Acceder a SIGA Escolar</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Enlaces al pie de la tarjeta */}
            <div className="mt-8 pt-4 border-t border-emerald-900/10 flex items-center justify-center gap-4 text-xs font-semibold text-[#135d54]">
              <button
                type="button"
                onClick={() => setActiveModal('terms')}
                className="hover:underline hover:text-[#0b3832] transition-colors focus:outline-none cursor-pointer"
              >
                Términos y Servicios
              </button>
              <span className="text-emerald-700/40">•</span>
              <button
                type="button"
                onClick={() => setActiveModal('contact')}
                className="hover:underline hover:text-[#0b3832] transition-colors focus:outline-none cursor-pointer"
              >
                Contáctanos
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Modal Accesible de Términos y Servicios / Contáctanos */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-slide-up"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              aria-label="Cerrar modal"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'terms' ? (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#135d54] flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 id="modal-title" className="text-xl font-bold text-gray-900 mb-2">
                  Términos y Servicios
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  SIGA Escolar es una plataforma institucional segura diseñada para la gestión y acompañamiento de la convivencia escolar. El acceso y uso de los datos personales y académicos está protegido bajo estrictos protocolos de confidencialidad y normativas educativas vigentes.
                </p>
                <p className="text-xs text-gray-400">
                  El uso no autorizado de credenciales está estrictamente prohibido y será auditado.
                </p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#135d54] flex items-center justify-center mb-4">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h2 id="modal-title" className="text-xl font-bold text-gray-900 mb-2">
                  Soporte y Contacto
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  ¿Tienes problemas para acceder o necesitas asistencia con tu cuenta institucional? Comunícate con el equipo de soporte técnico o con la administración de tu establecimiento.
                </p>
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 space-y-1.5 mb-4">
                  <p><span className="font-semibold">Correo de soporte:</span> soporte@sigaescolar.cl</p>
                  <p><span className="font-semibold">Horario de atención:</span> Lunes a Viernes, 08:00 - 18:00 hrs</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded-full bg-[#135d54] hover:bg-[#0f4e46] text-white text-sm font-medium transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
