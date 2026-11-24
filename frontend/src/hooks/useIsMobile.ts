import { useEffect, useState } from 'react'

const mobileQuery = '(max-width: 767px)'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(mobileQuery).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(mobileQuery)
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isMobile
}
