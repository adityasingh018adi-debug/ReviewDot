import { useMemo } from 'react'
import { encodeQR, qrPath } from '@/lib/qr'
import { cn } from '@/lib/utils'

/**
 * Renders a scannable QR matrix as inline SVG. Modules stay dark-on-light in
 * both themes — inverted codes are unreliable on many phone scanners.
 */
export function QRPreview({
  value,
  size = 160,
  margin = 2,
  className,
  dark = '#0a0c0b',
  light = '#ffffff',
}: {
  value: string
  size?: number
  margin?: number
  className?: string
  dark?: string
  light?: string
}) {
  const matrix = useMemo(() => encodeQR(value), [value])
  const total = matrix.size + margin * 2
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      className={cn('shrink-0 rounded-md', className)}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width={total} height={total} fill={light} />
      <g transform={`translate(${margin},${margin})`}>
        <path d={qrPath(matrix)} fill={dark} />
      </g>
    </svg>
  )
}
