import { useEffect, useRef, useState, type SyntheticEvent } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const SCENES = {
  sky: {
    poster: null,
    baseVideo: '/ambience/sky.mp4?v=anime-scene-6',
    motionVideo: null,
  },
  shanhai: {
    poster: '/ambience/shanhai.webp?v=anime-scene-5',
    baseVideo: '/ambience/shanhai.mp4?v=anime-scene-5',
    motionVideo:
      'https://videos.pexels.com/video-files/5701094/5701094-uhd_3238_2160_25fps.mp4',
  },
  night: {
    poster: '/ambience/night.webp?v=night-scene-2',
    baseVideo: '/ambience/night.mp4?v=night-scene-2',
    motionVideo: null,
  },
} as const

export default function ScenicBackground({
  scene,
  motion,
  variant,
}: {
  scene: 'sky' | 'shanhai' | 'night'
  motion: boolean
  variant: 'space' | 'reader'
}) {
  const [reducedMotion, setReducedMotion] = useState(false)
  const baseVideoRef = useRef<HTMLVideoElement>(null)
  const motionVideoRef = useRef<HTMLVideoElement>(null)
  const source = SCENES[scene]
  const animate = motion && !reducedMotion

  useEffect(() => {
    const media = window.matchMedia?.(REDUCED_MOTION_QUERY)
    if (!media) return
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    const videos = [baseVideoRef.current, motionVideoRef.current].filter(
      (video): video is HTMLVideoElement => Boolean(video),
    )
    if (!animate) {
      videos.forEach((video) => video.pause())
      return
    }
    videos.forEach((video) => {
      video.currentTime = 0
      void video.play().catch(() => {})
    })
  }, [scene, animate])

  useEffect(() => {
    const resume = () => {
      if (!animate) return
      for (const video of [baseVideoRef.current, motionVideoRef.current]) {
        if (video?.paused) void video.play().catch(() => {})
      }
    }
    window.addEventListener('pageshow', resume)
    document.addEventListener('visibilitychange', resume)
    return () => {
      window.removeEventListener('pageshow', resume)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [animate])

  const startVideo = (
    event: SyntheticEvent<HTMLVideoElement>,
    layer: 'base' | 'motion',
  ) => {
    const video = event.currentTarget
    video.playbackRate =
      layer === 'base'
        ? scene === 'sky'
          ? 2.4
          : scene === 'night'
            ? 1
            : 2.2
        : scene === 'sky'
          ? 1.35
          : 1.5
    void video.play().catch(() => {})
  }

  return (
    <div
      key={scene}
      className={`scenic-ambience scenic-${scene} scenic-${variant}`}
      data-scene={scene}
      data-animated={animate ? 'true' : 'false'}
      aria-hidden="true"
    >
      {source.poster && (
        <div
          className="scenic-poster"
          style={{ backgroundImage: `url("${source.poster}")` }}
        />
      )}
      {animate && (
        <>
          <video
            ref={baseVideoRef}
            key={`${scene}-base`}
            className="scenic-base-video"
            src={source.baseVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
            disablePictureInPicture
            onLoadedData={(event) => startVideo(event, 'base')}
            onCanPlay={(event) => startVideo(event, 'base')}
          />
          {source.motionVideo && (
            <video
              ref={motionVideoRef}
              key={`${scene}-motion`}
              className="scenic-motion-video"
              src={source.motionVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              tabIndex={-1}
              disablePictureInPicture
              onLoadedData={(event) => startVideo(event, 'motion')}
              onCanPlay={(event) => startVideo(event, 'motion')}
            />
          )}
        </>
      )}
      <div className="scenic-tint" />
    </div>
  )
}
