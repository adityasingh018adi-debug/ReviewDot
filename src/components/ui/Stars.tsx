import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Stars({
  value,
  size = 14,
  className,
  showValue = false,
}: {
  value: number
  size?: number
  className?: string
  showValue?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((index) => {
        const filled = value >= index - 0.25
        return (
          <Star
            key={index}
            size={size}
            strokeWidth={1.8}
            className={filled ? 'fill-star text-star' : 'text-line-strong'}
          />
        )
      })}
      {showValue ? <span className="ml-1.5 text-[13px] font-medium text-ink">{value.toFixed(1)}</span> : null}
    </span>
  )
}

export function StarPicker({
  value,
  onChange,
  size = 44,
}: {
  value: number
  onChange: (value: number) => void
  size?: number
}) {
  return (
    <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((index) => (
        <button
          key={index}
          type="button"
          role="radio"
          aria-checked={value === index}
          aria-label={`${index} star${index > 1 ? 's' : ''}`}
          onClick={() => onChange(index)}
          className="rounded-full p-1 transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <Star
            size={size}
            strokeWidth={1.5}
            className={cn(
              'transition-colors duration-200',
              index <= value ? 'fill-star text-star' : 'text-line-strong',
            )}
          />
        </button>
      ))}
    </div>
  )
}
