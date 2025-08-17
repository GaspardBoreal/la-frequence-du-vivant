import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with a reasonable default to avoid hydration issues
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [isHydrated, setIsHydrated] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Set hydrated flag to avoid SSR mismatch
    setIsHydrated(true)
    
    const checkIsMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      console.log('Mobile detection:', { width: window.innerWidth, mobile, breakpoint: MOBILE_BREAKPOINT })
      setIsMobile(mobile)
      return mobile
    }

    // Initial check
    checkIsMobile()

    // Set up media query listener for better performance
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      checkIsMobile()
    }
    
    mql.addEventListener("change", onChange)
    
    // Also listen to resize for robustness
    window.addEventListener('resize', checkIsMobile)
    
    return () => {
      mql.removeEventListener("change", onChange)
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  // During SSR or before hydration, return false to avoid mobile controls
  // After hydration, return the actual mobile state
  return isHydrated ? isMobile : false
}
