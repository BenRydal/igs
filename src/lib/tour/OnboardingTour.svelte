<script lang="ts">
  import { onMount } from 'svelte'
  import { driver, type Driver } from 'driver.js'
  import 'driver.js/dist/driver.css'
  import './tour.css'
  import { tourSteps } from './steps'
  import { shouldShowTour, setTourCompleted, resetTourState } from './storage'

  let driverInstance = $state<Driver | null>(null)

  /**
   * Dispatch event when tour completes to notify other components
   */
  function dispatchTourComplete(): void {
    window.dispatchEvent(new CustomEvent('tour-complete'))
  }

  /**
   * Start the onboarding tour
   */
  export function startTour(): void {
    if (driverInstance) driverInstance.destroy()

    driverInstance = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      animate: true,
      allowClose: true,
      overlayColor: 'black',
      overlayOpacity: 0.6,
      popoverClass: 'igs-tour-popover',
      steps: tourSteps,
      onDestroyStarted: () => {
        setTourCompleted()
        driverInstance?.destroy()
        // Notify that tour is complete
        dispatchTourComplete()
      },
    })

    driverInstance.drive()
  }

  onMount(() => {
    // Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // If user prefers reduced motion, disable animation
    if (prefersReducedMotion && shouldShowTour()) {
      setTimeout(() => {
        if (driverInstance) {
          driverInstance.destroy()
          driverInstance = driver({
            showProgress: true,
            showButtons: ['next', 'previous', 'close'],
            animate: false, // Disable animation for reduced motion
            allowClose: true,
            overlayColor: 'black',
            overlayOpacity: 0.6,
            popoverClass: 'igs-tour-popover',
            steps: tourSteps,
            onDestroyStarted: () => {
              setTourCompleted()
              driverInstance?.destroy()
              // Notify that tour is complete
              dispatchTourComplete()
            },
          })
          driverInstance.drive()
        }
      }, 1000)
    } else if (shouldShowTour()) {
      // Slight delay to ensure DOM is ready
      setTimeout(startTour, 1000)
    } else {
      // Tour already completed, dispatch immediately so modal can show
      dispatchTourComplete()
    }

    // Listen for restart tour event
    const handler = () => {
      resetTourState()
      startTour()
    }
    window.addEventListener('restart-tour', handler)
    return () => window.removeEventListener('restart-tour', handler)
  })
</script>
