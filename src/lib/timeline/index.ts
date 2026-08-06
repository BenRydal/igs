// Only TimelineContainer is consumed via this barrel; everything else in
// the timeline module is imported by direct path (./store, ./utils, ...).
export { default as TimelineContainer } from './components/TimelineContainer.svelte'
