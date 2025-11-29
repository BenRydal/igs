/**
 * String utility functions for formatting text and toggle names
 */

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with the first letter capitalized
 * @example capitalizeFirstLetter('hello') // 'Hello'
 */
export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Capitalizes the first letter of each word in a sentence
 * @param sentence - The sentence to capitalize
 * @returns The sentence with each word capitalized
 * @example capitalizeEachWord('hello world') // 'Hello World'
 */
export function capitalizeEachWord(sentence: string): string {
  return sentence
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Formats a toggle key name by removing 'Toggle' suffix and capitalizing
 * @param toggleKey - The toggle key to format (e.g., 'movementToggle')
 * @returns The formatted toggle name (e.g., 'Movement')
 * @example formatToggleName('movementToggle') // 'Movement'
 */
export function formatToggleName(toggleKey: string): string {
  return capitalizeFirstLetter(toggleKey.replace('Toggle', ''))
}
