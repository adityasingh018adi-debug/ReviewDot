import { motion } from 'framer-motion'

interface ProgressRingProps {
  value: number // 0..100
  size?: number
  stroke?: number
  color?: string
  label?: string
}

export function ProgressRing({ value, size = 84, stroke = 7, color = 'var(--color-pulse-400)', label }: ProgressRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(255 255 255 / 0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - value / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-lg font-semibold text-mist-50">{Math.round(value)}%</div>
        {label && <div className="text-[10px] uppercase tracking-wider text-mist-400">{label}</div>}
      </div>
    </div>
  )
}
