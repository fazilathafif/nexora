import { useState, useEffect } from 'react'
import { BP } from '../styles/breakpoints.js'

export function useBreakpoint() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 375
  )

  useEffect(() => {
    let raf
    function onResize() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setWidth(window.innerWidth))
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return {
    isMobile:  width < BP.tablet,
    isTablet:  width >= BP.tablet && width < BP.desktop,
    isDesktop: width >= BP.desktop,
    width,
  }
}
