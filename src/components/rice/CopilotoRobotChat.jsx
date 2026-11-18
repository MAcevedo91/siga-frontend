import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Send,
  Sparkles,
  BookOpen,
  ListOrdered,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Landmark,
  School,
  Maximize2,
  Minimize2,
  HelpCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { consultarRiceRag } from '@/services/riceService'
import SigiAvatar from '@/components/rice/SigiAvatar'
import { useAuth } from '@/store/useAuthStore'

const MODOS_ASISTENTE = [
  {
    id: 'normativa',
    label: 'RICE y Normas',
    icon: BookOpen,
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    descripcion: 'Consultas reglamentarias, plazos legales y debido proceso',
    placeholder: 'Ej: ¿Qué plazo tengo para citar al apoderado según el RICE?...',
    prefijo: '',
    sugerencias: [
      '¿Cuáles son los plazos máximos para citar apoderados?',
      '¿Qué medidas pedagógicas deben agotarse antes de una suspensión?',
      '¿Cómo tipifica el RICE el ciberacoso y agresiones digitales?',
    ],
  },
  {
    id: 'pasos',
    label: 'Pasos a Seguir',
    icon: ListOrdered,
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    descripcion: 'Guía paso a paso sobre cómo actuar ante un incidente escolar',
    placeholder: 'Ej: ¿Cuáles son los pasos obligatorios ante una riña en patio?...',
    prefijo: '[Procedimiento y Pasos Operativos Escolares] ',
    sugerencias: [
      '¿Cuáles son los 5 pasos obligatorios ante maltrato entre pares?',
      '¿Cómo actuar paso a paso ante una desregulación emocional en sala?',
      '¿A quién debo derivar a un estudiante tras un conflicto en recreo?',
    ],
  },
]

/**
 * Formatea texto inline con negritas (**texto**) y cursivas (*texto*) de forma segura (sin innerHTML)
 */
const formatearTextoInline = (texto) => {
  if (!texto) return ''
  const partes = texto.split(/(\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)
  return partes.map((parte, i) => {
    if (parte.startsWith('***') && parte.endsWith('***') && parte.length > 6) {
      return (
        <strong key={i} className="font-bold italic text-slate-900 dark:text-white">
          {parte.slice(3, -3)}
        </strong>
      )
    }
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-white">
          {parte.slice(2, -2)}
        </strong>
      )
    }
    if (parte.startsWith('*') && parte.endsWith('*') && parte.length > 2) {
      return (
        <em key={i} className="italic text-slate-600 dark:text-slate-300">
          {parte.slice(1, -1)}
        </em>
      )
    }
    return parte
  })
}

/**
 * Renderizador de Markdown estructurado para las respuestas del Copiloto
 */
const RenderizadorMarkdown = ({ texto }) => {
  if (!texto) return null
  const lineas = texto.split('\n')

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
      {lineas.map((linea, idx) => {
        const trimmed = linea.trim()
        if (!trimmed) {
          return <div key={idx} className="h-1" />
        }

        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="my-2.5 border-slate-200 dark:border-slate-700/80" />
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-200 mt-2 mb-1">
              {formatearTextoInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          )
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-sm sm:text-base font-bold text-indigo-950 dark:text-indigo-200 mt-3 mb-1">
              {formatearTextoInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          )
        }

        if (/^[*•-]\s+/.test(trimmed)) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-indigo-500 dark:text-indigo-400 font-bold mt-1 text-xs leading-none">•</span>
              <span className="flex-1">{formatearTextoInline(trimmed.replace(/^[*•-]\s+/, ''))}</span>
            </div>
          )
        }

        const matchNum = trimmed.match(/^(\d+)\.\s+(.*)/)
        if (matchNum) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-[1.2rem]">{matchNum[1]}.</span>
              <span className="flex-1">{formatearTextoInline(matchNum[2])}</span>
            </div>
          )
        }

        return (
          <p key={idx} className="leading-relaxed">
            {formatearTextoInline(linea)}
          </p>
        )
      })}
    </div>
  )
}

/**
 * Detecta si el texto ingresado corresponde a interacción conversacional cotidiana
 * (saludos, agradecimientos, despedidas o preguntas sobre identidad de Sigi).
 * En caso afirmativo, genera una respuesta empática y natural personalizada con el nombre del usuario.
 * Si contiene palabras clave de convivencia o normativas, retorna null para delegar al RAG.
 */
const detectarIntencionConversacional = (texto, nombreUsuario) => {
  if (!texto) return null
  const limpio = texto
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[¡!¿?.,;:()]/g, '')

  // Si contiene términos normativos, procedimentales o de redacción, delegar obligatoriamente al RAG
  const terminosNormativos = [
    'plazo', 'sancion', 'protocolo', 'falta', 'grave', 'gravisima', 'leve',
    'agresion', 'ciberacoso', 'golpe', 'pelea', 'rina', 'arma', 'droga',
    'citacion', 'apoderado', 'suspension', 'descargo', 'debido proceso',
    'expulsion', 'circular', 'articulo', 'denuncia', 'fiscalia', 'carabineros',
    'redactar', 'redaccion', 'acta', 'compromiso', 'medida', 'acuerdo', 'recreo',
    'docente', 'estudiante', 'alumno', 'desregulacion', 'conflicto', 'mediacion',
    'caso', 'procedimiento', 'reglamento', 'rice'
  ]

  const tieneTerminoNormativo = terminosNormativos.some((t) => limpio.includes(t))
  if (tieneTerminoNormativo) return null

  const nombreVisual = nombreUsuario || 'colega'

  // 1. Saludos
  const esSaludo = /^(hola|buenos dias|buenas tardes|buenas noches|buenas|hey|que tal|como estas|como te va|saludos)(\s+(sigi|robot|copiloto|amigo))?$/i.test(limpio)
  if (esSaludo) {
    return `¡Hola, **${nombreVisual}**! 👋 ¿Cómo estás? Soy **Sigi**, tu copiloto escolar. Cuéntame, ¿en qué te puedo apoyar hoy? Puedo orientarte sobre las normas del RICE o guiarte paso a paso ante cualquier situación escolar.`
  }

  // 2. Agradecimientos
  const esAgradecimiento = /^(gracias|muchas gracias|muchisimas gracias|te lo agradezco|vale gracias|excelente gracias|muchas gracias sigi)(\s+(sigi|robot|copiloto))?$/i.test(limpio)
  if (esAgradecimiento) {
    return `¡De nada, **${nombreVisual}**! 😊 Para eso estoy aquí con mi mochila siempre lista. Si necesitas consultar algo más sobre convivencia o normas escolares, solo pregúntame.`
  }

  // 3. Despedidas
  const esDespedida = /^(chao|adios|hasta luego|nos vemos|hasta pronto|que tengas buen dia|hasta manana)(\s+(sigi|robot))?$/i.test(limpio)
  if (esDespedida) {
    return `¡Hasta pronto, **${nombreVisual}**! 👋 Que tengas una excelente jornada escolar. Estaré aquí abajo si me necesitas.`
  }

  // 4. Preguntas sobre identidad de Sigi
  const esIdentidad = /^(quien eres|como te llamas|que haces|que puedes hacer|para que sirves|quien es sigi|presentate)(\s+(tu|sigi))?$/i.test(limpio)
  if (esIdentidad) {
    return `¡Mucho gusto! Soy **Sigi**, el copiloto escolar 🤖🎒. Estoy hecho con cartón reciclado y mucho cariño pedagógico.\n\nLlevo en mi mochila el **reglamento interno (RICE)** para orientarte de forma sencilla y directa. Puedo ayudarte a:\n\n1. **Revisar normas y plazos** del debido proceso escolar.\n2. **Guiarte paso a paso** ante incidentes o situaciones complejas en el colegio.\n\n¿En qué te gustaría que trabajemos hoy, **${nombreVisual}**?`
  }

  // 5. Elogios / Ánimo
  const esElogio = /^(buen trabajo|eres genial|excelente|que tierno|buen bot|me encanta tu logo)(\s+(sigi|robot))?$/i.test(limpio)
  if (esElogio) {
    return `¡Muchas gracias, **${nombreVisual}**! 🥰 Me alegra mucho ser de ayuda para ti y para toda la comunidad escolar. ¡Sigamos cuidando la convivencia juntos!`
  }

  return null
}

export default function CopilotoRobotChat({
  isOpen,
  onClose,
  onOpen,
  contextoIncidente = null,
  consultaInicial = '',
}) {
  const auth = useAuth()
  const user = auth?.user
  const nombreUsuario = user?.nombre?.trim() ? user.nombre.trim().split(' ')[0] : ''

  const [modoActivo, setModoActivo] = useState('normativa')
  const [inputTexto, setInputTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [copiadoId, setCopiadoId] = useState(null)
  const [expandido, setExpandido] = useState(false)
  const [fuentesAbiertas, setFuentesAbiertas] = useState({})

  const [mensajes, setMensajes] = useState([
    {
      id: 'bienvenida',
      emisor: 'sigi',
      texto: `¡Hola${nombreUsuario ? `, **${nombreUsuario}**` : ''}! Soy **Sigi**, tu copiloto de convivencia escolar y RICE.\n\nPuedo orientarte sobre **plazos y normativas**, o guiarte **paso a paso en los procedimientos** escolares.\n\n¿En qué te puedo apoyar hoy?`,
      timestamp: new Date(),
    },
  ])

  const chatEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Scroll automático al último mensaje
  useEffect(() => {
    if (isOpen && typeof chatEndRef.current?.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensajes, cargando, isOpen])

  // Iniciar con consulta externa si se proporciona
  useEffect(() => {
    if (consultaInicial && isOpen) {
      handleEnviarConsulta(consultaInicial)
    }
  }, [consultaInicial, isOpen])

  const modoConfig = MODOS_ASISTENTE.find((m) => m.id === modoActivo) || MODOS_ASISTENTE[0]

  const handleEnviarConsulta = async (textoPersonalizado) => {
    const textoAEnviar = (textoPersonalizado || inputTexto).trim()
    if (!textoAEnviar || cargando) return

    const mensajeUsuarioId = `user-${Date.now()}`
    const nuevoMensajeUsuario = {
      id: mensajeUsuarioId,
      emisor: 'usuario',
      texto: textoAEnviar,
      modo: modoActivo,
      timestamp: new Date(),
    }

    setMensajes((prev) => [...prev, nuevoMensajeUsuario])
    setInputTexto('')
    setCargando(true)

    // 1. Detección de conversación natural y personalizada (Small Talk / Saludos / Agradecimientos)
    const respuestaConversacional = detectarIntencionConversacional(textoAEnviar, nombreUsuario)

    if (respuestaConversacional) {
      const textoLimpio = textoAEnviar
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[¡!¿?.,;:()]/g, '')
      const esIdentidad = /^(quien eres|como te llamas|que haces|que puedes hacer|para que sirves|quien es sigi|presentate)/i.test(textoLimpio)

      setTimeout(() => {
        const nuevoMensajeSigi = {
          id: `sigi-${Date.now()}`,
          emisor: 'sigi',
          texto: respuestaConversacional,
          esIdentidad,
          fuentes: [],
          timestamp: new Date(),
        }
        setMensajes((prev) => [...prev, nuevoMensajeSigi])
        setCargando(false)
      }, 300)
      return
    }

    // 2. Consulta técnica, normativa o de redacción: canalizada estrictamente al motor RAG
    try {
      const consultaConPrefijo = `${modoConfig.prefijo}${textoAEnviar}`
      const respuestaData = nombreUsuario
        ? await consultarRiceRag(consultaConPrefijo, contextoIncidente, nombreUsuario)
        : await consultarRiceRag(consultaConPrefijo, contextoIncidente)

      const nuevoMensajeSigi = {
        id: `sigi-${Date.now()}`,
        emisor: 'sigi',
        texto: respuestaData?.respuesta || 'No fue posible generar una orientación para la consulta formulada.',
        fuentes: respuestaData?.fuentes || [],
        timestamp: new Date(),
      }

      setMensajes((prev) => [...prev, nuevoMensajeSigi])
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al consultar al copiloto normativo'
      toast.error(msg)
      setMensajes((prev) => [
        ...prev,
        {
          id: `sigi-err-${Date.now()}`,
          emisor: 'sigi',
          texto: `⚠️ **Ocurrió un problema:** ${msg}. Por favor, intenta reformular tu consulta o verifica la conexión.`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setCargando(false)
    }
  }

  const handleCopiarMensaje = (id, texto) => {
    if (!texto) return
    navigator.clipboard.writeText(texto)
    setCopiadoId(id)
    toast.success('Respuesta copiada al portapapeles')
    setTimeout(() => setCopiadoId(null), 2500)
  }

  const handleReiniciarChat = () => {
    setMensajes([
      {
        id: 'bienvenida',
        emisor: 'sigi',
        texto: `¡Conversación reiniciada${nombreUsuario ? `, **${nombreUsuario}**` : ''}! Soy **Sigi**, tu copiloto escolar. Pregúntame sobre el reglamento interno (RICE) o los pasos a seguir ante un incidente escolar.`,
        timestamp: new Date(),
      },
    ])
    setInputTexto('')
    toast.success('Conversación reiniciada')
  }

  const toggleFuentes = (msgId) => {
    setFuentesAbiertas((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }))
  }

  return (
    <>
      {/* Botón flotante del Robot (Visible cuando el chat está cerrado) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          <div className="hidden sm:flex items-center px-3.5 py-2 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-cyan-200/80 dark:border-cyan-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 animate-in fade-in slide-in-from-right-4 duration-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500 mr-1.5 animate-pulse" />
            ¿Dudas con el RICE o protocolos? Pregúntale a <span className="text-cyan-600 dark:text-cyan-400 font-bold ml-1">Sigi</span>
          </div>

          <button
            type="button"
            onClick={onOpen}
            data-testid="copiloto-robot-trigger"
            aria-label="Abrir Copiloto Escolar Sigi"
            title="Abrir Copiloto Escolar Sigi (RICE y Protocolos Escolares)"
            className="group relative w-[72px] h-[72px] rounded-full p-0 flex items-center justify-center shadow-2xl shadow-cyan-950/40 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-500/40"
          >
            {/* Indicador de estado en línea */}
            <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 ring-2 ring-emerald-400/50 animate-pulse z-20" />

            {/* Animación de saludo con la mano al posar el cursor */}
            <div
              data-testid="sigi-saludo-hand"
              className="absolute -top-1.5 -left-1.5 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-110 pointer-events-none drop-shadow-md"
            >
              <span className="inline-block text-xl animate-sigi-saludo select-none">👋</span>
            </div>

            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center transition-transform group-hover:animate-sigi-saludo">
              <SigiAvatar
                size="3xl"
                variant="badge"
                className="w-full h-full"
                alt="Sigi el Robot Copiloto"
              />
            </div>
          </button>
        </div>
      )}

      {/* Ventana de Chat Flotante / Drawer del Copiloto */}
      {isOpen && (
        <aside
          role="dialog"
          aria-label="Panel del Copiloto Escolar Sigi"
          data-testid="copiloto-robot-panel"
          className={`
            fixed z-50 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300
            ${
              expandido
                ? 'inset-4 md:inset-auto md:bottom-6 md:right-6 md:w-[620px] md:h-[720px]'
                : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[430px] h-[580px] max-h-[88vh]'
            }
          `}
        >
          {/* Cabecera del Chat */}
          <div className="px-4 py-3 bg-gradient-to-r from-cyan-700 via-indigo-700 to-purple-700 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md p-0.5 border-2 border-cyan-300/40 bg-slate-900/40 overflow-hidden">
                <SigiAvatar size="lg" variant="badge" className="w-full h-full" alt="Sigi — Copiloto Escolar" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 z-10" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight truncate">Sigi — Copiloto Escolar</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/95">
                    RICE
                  </span>
                </div>
                <p className="text-[11px] text-cyan-100 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Orientación sobre normas y pasos a seguir
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleReiniciarChat}
                title="Reiniciar conversación"
                aria-label="Reiniciar conversación"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setExpandido(!expandido)}
                title={expandido ? 'Restaurar tamaño' : 'Maximizar panel'}
                aria-label={expandido ? 'Restaurar tamaño' : 'Maximizar panel'}
                className="hidden sm:inline-flex p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                {expandido ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Cerrar copiloto"
                aria-label="Cerrar copiloto"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Selector de Modos Especializados (Pills horizontales) */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
            {MODOS_ASISTENTE.map((modo) => {
              const Icono = modo.icon
              const esActivo = modoActivo === modo.id

              return (
                <button
                  key={modo.id}
                  type="button"
                  onClick={() => setModoActivo(modo.id)}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                    ${
                      esActivo
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <Icono className="w-3.5 h-3.5" />
                  <span>{modo.label}</span>
                </button>
              )
            })}
          </div>

          {/* Historial de Mensajes (Área Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/60 dark:bg-slate-950/40">
            {contextoIncidente && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Consultando con contexto activo del incidente (protegido por DLP escolar).</span>
              </div>
            )}

            {mensajes.map((msg) => {
              const esSigi = msg.emisor === 'sigi'

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${esSigi ? 'items-start' : 'items-end justify-end'}`}
                >
                  {esSigi && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-100 to-indigo-100 dark:from-cyan-950/60 dark:to-indigo-950/60 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center shrink-0 shadow-sm mt-0.5 p-0.5">
                      <SigiAvatar size="sm" className="w-7 h-7" alt="Sigi" />
                    </div>
                  )}

                  <div
                    className={`
                      max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-sm
                      ${
                        esSigi
                          ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-tl-sm'
                          : 'bg-indigo-600 text-white rounded-br-sm shadow-indigo-600/20'
                      }
                    `}
                  >
                    {esSigi ? (
                      <div>
                        {(msg.id === 'bienvenida' || msg.esIdentidad) && (
                          <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-cyan-50 via-indigo-50 to-purple-50 dark:from-cyan-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-cyan-200/80 dark:border-cyan-800/60 flex items-center gap-3">
                            <div className="w-16 h-20 shrink-0 flex items-center justify-center rounded-xl shadow-sm overflow-hidden border border-cyan-300 dark:border-cyan-700 bg-white/70 dark:bg-slate-900/60 p-1">
                              <SigiAvatar size="2xl" variant="full" isWaving className="w-full h-full object-contain" alt="Sigi el Robot Escolar" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center mb-1">
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-600 dark:bg-cyan-700 text-white tracking-wide uppercase">
                                  Copiloto convivencia escolar
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                {msg.esIdentidad ? 'Sigi — Tu copiloto escolar' : '¡Hola! Soy Sigi, tu copiloto escolar'}
                              </p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                                Llevo en mi mochila el reglamento interno para orientarte en lo que necesites.
                              </p>
                            </div>
                          </div>
                        )}

                        <RenderizadorMarkdown texto={msg.texto} />

                        {/* Barra de utilidades del mensaje de Sigi */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between text-[11px] text-slate-400">
                          <button
                            type="button"
                            onClick={() => handleCopiarMensaje(msg.id, msg.texto)}
                            className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                          >
                            {copiadoId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-bold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar texto</span>
                              </>
                            )}
                          </button>

                          {msg.fuentes && msg.fuentes.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleFuentes(msg.id)}
                              className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              <span>{msg.fuentes.length} fuente(s)</span>
                              {fuentesAbiertas[msg.id] ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Desglose de fuentes consultadas */}
                        {msg.fuentes && msg.fuentes.length > 0 && fuentesAbiertas[msg.id] && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/70 space-y-1.5 animate-in fade-in duration-200">
                            <p className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
                              Artículos y reglamentos analizados:
                            </p>
                            {msg.fuentes.map((f, i) => (
                              <div
                                key={i}
                                className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 text-[11px]"
                              >
                                <span className="font-bold text-indigo-700 dark:text-indigo-300">
                                  {f.articulo ? `Art. ${f.articulo}` : 'Protocolo'}:
                                </span>{' '}
                                <span className="text-slate-600 dark:text-slate-300">{f.titulo || f.capitulo || 'RICE'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.texto}</p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Animación de Sigi Pensando */}
            {cargando && (
              <div className="flex gap-2.5 items-start">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center shrink-0 shadow-sm animate-pulse p-0.5">
                  <SigiAvatar size="sm" isThinking className="w-7 h-7" alt="Sigi pensando" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl rounded-tl-sm p-3.5 shadow-sm text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>Sigi está consultando el reglamento escolar en su mochila...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chips de Preguntas Frecuentes Rápidas */}
          {mensajes.length <= 3 && !cargando && (
            <div className="px-3 py-2 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/70 dark:border-slate-800/80">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Sugerencias para {modoConfig.label}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {modoConfig.sugerencias.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleEnviarConsulta(sug)}
                    className="text-[11px] text-left px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formulario de Entrada */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="relative flex items-center">
              <textarea
                ref={textareaRef}
                value={inputTexto}
                onChange={(e) => setInputTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleEnviarConsulta()
                  }
                }}
                placeholder={modoConfig.placeholder}
                rows={2}
                disabled={cargando}
                className="w-full text-xs sm:text-sm p-2.5 pr-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 resize-none transition-all shadow-inner"
              />

              <button
                type="button"
                onClick={() => handleEnviarConsulta()}
                disabled={cargando || !inputTexto.trim()}
                aria-label="Enviar mensaje a Sigi"
                className="absolute right-2.5 bottom-2.5 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm transition-all active:scale-95"
              >
                {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                DLP activo: datos de alumnos protegidos
              </span>
              <span>Presiona Enter para enviar</span>
            </div>
          </div>
        </aside>
      )}
    </>
  )
}
