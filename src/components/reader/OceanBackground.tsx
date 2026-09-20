import { useEffect, useState } from 'react'

const VIDEO_URL = 'https://blog.map7e.com/videos/underwater.mp4'
const POSTER_URL = 'https://blog.map7e.com/images/underwater-background.png'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export default function OceanBackground({
  motion,
  variant,
}: {
  motion: boolean
  variant: 'space' | 'reader'
}) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia?.(REDUCED_MOTION_QUERY)
    if (!media) return
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  const animate = motion && !reducedMotion

  return (
    <div
      className={`ocean-ambience ocean-${variant}`}
      data-animated={animate ? 'true' : 'false'}
      aria-hidden="true"
    >
      {animate ? (
        <video
          className="ocean-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      ) : (
        <div
          className="ocean-poster"
          style={{ backgroundImage: `url("${POSTER_URL}")` }}
        />
      )}
      <div className="ocean-tint" />
    </div>
  )
}
