<script lang="ts">
  import { onMount } from 'svelte'
  import { driver, type Driver } from 'driver.js'
  import 'driver.js/dist/driver.css'
  import './tour.css'
  import { tourSteps } from './steps'
  import { setTourCompleted, resetTourState } from './storage'

  let driverInstance = $state<Driver | null>(null)

  /**
   * Start the onboarding tour
   */
  export function startTour(): void {
    if (driverInstance) driverInstance.destroy()

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    driverInstance = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      animate: !prefersReducedMotion,
      allowClose: true,
      overlayColor: 'black',
      overlayOpacity: 0.6,
      popoverClass: 'igs-tour-popover',
      steps: tourSteps,
      onDestroyStarted: () => {
        setTourCompleted()
        driverInstance?.destroy()
      },
    })

    driverInstance.drive()
  }

  onMount(() => {
    // Listen for restart-tour event (from "Take a Tour" button)
    const handler = () => {
      resetTourState()
      setTimeout(startTour, 300)
    }
    window.addEventListener('restart-tour', handler)

    return () => window.removeEventListener('restart-tour', handler)
  })
</script>
