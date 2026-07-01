import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, ArrowLeft } from 'lucide-react'

export function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid min-h-[60vh] place-items-center text-center"
    >
      <div>
        <div className="animate-float-slow mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white/5">
          <Compass size={36} className="text-pulse-300" />
        </div>
        <div className="font-display mt-6 text-6xl font-bold text-gradient">404</div>
        <h1 className="font-display mt-2 text-xl font-semibold text-mist-50">
          This page drifted off the map
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-mist-400">
          The page you're looking for doesn't exist — but your dashboard is right where you left it.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-pulse-500 to-aura-500 px-5 py-2.5 text-sm font-medium text-pure shadow-glow-sm transition-transform hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={15} /> Back to dashboard
        </Link>
      </div>
    </motion.div>
  )
}
