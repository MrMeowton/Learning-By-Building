import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * State + pemutar untuk "mesin waktu".
 * index      : titik waktu yang sedang dilihat (0 .. length-1)
 * playing    : sedang diputar maju?
 * pointsPerSecond : kecepatan putar (titik data per detik)
 */
export function useReplay(length, { start = length - 1, pointsPerSecond = 24 } = {}) {
  const last = Math.max(0, length - 1)
  const [index, setIndexRaw] = useState(() => Math.min(Math.max(start, 0), last))
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const acc = useRef(0)

  const setIndex = useCallback(
    (i) => setIndexRaw((prev) => Math.min(Math.max(typeof i === 'function' ? i(prev) : i, 0), last)),
    [last],
  )

  // Di ujung, pemutar otomatis dianggap berhenti (diturunkan, bukan state baru)
  const isPlaying = playing && index < last

  // Loop animasi: maju sekian titik per frame sesuai kecepatan
  useEffect(() => {
    if (!isPlaying) return undefined
    const clock = { prev: performance.now(), raf: 0 }
    const tick = (now) => {
      acc.current += ((now - clock.prev) / 1000) * pointsPerSecond * speed
      clock.prev = now
      if (acc.current >= 1) {
        const step = Math.floor(acc.current)
        acc.current -= step
        setIndex((i) => i + step)
      }
      clock.raf = requestAnimationFrame(tick)
    }
    clock.raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(clock.raf)
  }, [isPlaying, speed, pointsPerSecond, setIndex])

  const play = useCallback(() => {
    acc.current = 0
    setIndexRaw((i) => (i >= last ? 0 : i)) // di ujung? mulai lagi dari awal
    setPlaying(true)
  }, [last])
  const pause = useCallback(() => setPlaying(false), [])
  const toggle = useCallback(() => (isPlaying ? pause() : play()), [isPlaying, pause, play])

  return { index, setIndex, playing: isPlaying, play, pause, toggle, speed, setSpeed, isAtEnd: index >= last }
}
