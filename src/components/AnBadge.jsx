import clsx from 'clsx'

const variants = {
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  blue:   'bg-blue-500/10   text-blue-400   border-blue-500/20',
  green:  'bg-green-500/10  text-green-400  border-green-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  red:    'bg-red-500/10    text-red-400    border-red-500/20',
  cyan:   'bg-cyan-500/10   text-cyan-400   border-cyan-500/20',
  amber:  'bg-amber-500/10  text-amber-400  border-amber-500/20',
  gray:   'bg-white/5       text-slate-400  border-white/10',
}

export default function Badge({ children, variant = 'gray', size = 'sm' }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide uppercase',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      variants[variant]
    )}>
      {children}
    </span>
  )
}

export function AIBadge() {
  return (
    <span className="ai-badge">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
      AI Forecast
    </span>
  )
}
