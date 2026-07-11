import { motion } from 'framer-motion'
import clsx from 'clsx'

const glowMap = {
  orange: 'an-glow-orange',
  blue:   'an-glow-blue',
  green:  'an-glow-green',
  purple: 'an-glow-purple',
  red:    'an-glow-red',
  cyan:   'an-glow-cyan',
  amber:  'an-glow-amber',
}

const iconBgMap = {
  orange: 'bg-orange-500/10 text-orange-400',
  blue:   'bg-blue-500/10   text-blue-400',
  green:  'bg-green-500/10  text-green-400',
  purple: 'bg-purple-500/10 text-purple-400',
  red:    'bg-red-500/10    text-red-400',
  cyan:   'bg-cyan-500/10   text-cyan-400',
  amber:  'bg-amber-500/10  text-amber-400',
}

export default function KPICard({ label, value, unit, delta, deltaLabel, icon: Icon, color = 'blue', delay = 0 }) {
  const isPositiveDelta = delta > 0
  const deltaColor = isPositiveDelta
    ? (color === 'red' ? 'text-red-400' : 'text-green-400')
    : (color === 'red' ? 'text-green-400' : 'text-red-400')

  return (
    <motion.div
      className={clsx('an-glass an-kpi p-5', glowMap[color])}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', iconBgMap[color])}>
            <Icon size={15} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-white leading-none">{value}</span>
        {unit && <span className="text-sm text-slate-500 mb-0.5">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          <span className={clsx('text-xs font-semibold', deltaColor)}>
            {isPositiveDelta ? '↑' : '↓'} {Math.abs(delta)}{unit || ''}
          </span>
          {deltaLabel && <span className="text-xs text-slate-600">{deltaLabel}</span>}
        </div>
      )}
    </motion.div>
  )
}
