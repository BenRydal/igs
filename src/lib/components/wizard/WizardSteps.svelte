<script lang="ts">
  import type { WizardStep } from './types'

  interface Props {
    /** Array of wizard steps */
    steps: readonly WizardStep[]
    /** Current active step index */
    currentStep: number
    /** Array of completed step indices */
    completedSteps?: number[]
    /** Callback when a completed step is clicked */
    onStepClick?: (stepIndex: number) => void
  }

  let { steps, currentStep, completedSteps = [], onStepClick }: Props = $props()

  /**
   * Check if a step is completed
   */
  function isCompleted(index: number): boolean {
    return completedSteps.includes(index) || index < currentStep
  }

  /**
   * Check if a step is clickable (completed steps only)
   */
  function isClickable(index: number): boolean {
    return isCompleted(index) && index !== currentStep
  }

  /**
   * Handle step click
   */
  function handleStepClick(index: number) {
    if (isClickable(index) && onStepClick) {
      onStepClick(index)
    }
  }

  /**
   * Handle keyboard navigation for steps
   */
  function handleKeyPress(event: KeyboardEvent, index: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleStepClick(index)
    }
  }
</script>

<div class="w-full px-4 py-6" role="navigation" aria-label="Wizard steps">
  <!-- Desktop: Full labels -->
  <ul class="steps steps-horizontal w-full hidden md:flex">
    {#each steps as step, index}
      <li
        class="step"
        class:step-primary={isCompleted(index) || index === currentStep}
        class:cursor-pointer={isClickable(index)}
        class:opacity-50={index > currentStep && !isCompleted(index)}
        onclick={() => handleStepClick(index)}
        onkeypress={(e) => handleKeyPress(e, index)}
        role="button"
        tabindex={isClickable(index) ? 0 : -1}
        aria-current={index === currentStep ? 'step' : undefined}
        aria-label="{step.label} - {index === currentStep
          ? 'Current step'
          : isCompleted(index)
            ? 'Completed'
            : 'Upcoming'}"
      >
        <span class="flex items-center gap-2">
          <span aria-hidden="true">{step.icon}</span>
          <span>{step.label}</span>
        </span>
      </li>
    {/each}
  </ul>

  <!-- Mobile: Icons only -->
  <ul class="steps steps-horizontal w-full flex md:hidden">
    {#each steps as step, index}
      <li
        class="step"
        class:step-primary={isCompleted(index) || index === currentStep}
        class:cursor-pointer={isClickable(index)}
        class:opacity-50={index > currentStep && !isCompleted(index)}
        onclick={() => handleStepClick(index)}
        onkeypress={(e) => handleKeyPress(e, index)}
        role="button"
        tabindex={isClickable(index) ? 0 : -1}
        aria-current={index === currentStep ? 'step' : undefined}
        aria-label="{step.label} - {index === currentStep
          ? 'Current step'
          : isCompleted(index)
            ? 'Completed'
            : 'Upcoming'}"
      >
        <span aria-hidden="true">{step.icon}</span>
      </li>
    {/each}
  </ul>

  <!-- Current step label for mobile -->
  <div class="mt-2 text-center text-sm font-medium md:hidden" aria-live="polite">
    {steps[currentStep].label}
  </div>
</div>

<style>
  /* Enhance clickable steps */
  .step.cursor-pointer:hover {
    opacity: 0.8;
  }

  .step.cursor-pointer:focus-visible {
    outline: 2px solid hsl(var(--p));
    outline-offset: 2px;
    border-radius: 0.25rem;
  }
</style>
