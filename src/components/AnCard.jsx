import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function GlassCard({ children, className, hover = false, animate = true, delay = 0 }) {
  const base = clsx('an-glass p-5', hover && 'an-glass-hover cursor-pointer', className)
  if (!animate) return <div className={base}>{children}</div>
  return (
    <motion.div
      className={base}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
