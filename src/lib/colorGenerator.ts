import colornames from 'colornames';
import words from 'lodash.words';
import trimStart from 'lodash.trimstart';
import padEnd from 'lodash.padend';
import rgbHex from 'rgb-hex';
import hexRgb from 'hex-rgb';

const MIXED_WEIGHT = 0.75;
const TEXT_WEIGHT = 0.25;
const SEED = 16777215;
const FACTOR = 49979693;
const MIN_COLOR_DISTANCE = 50; // Increased minimum distance between colors to ensure they're visibly distinct
const MIN_HUE_DIFFERENCE = 30; // Increased minimum hue difference for colors with similar hues
const MIN_CONTRAST_RATIO = 3.0; // Minimum contrast ratio for WCAG 2.1 Level AA (lowered from 7.0)
const BACKGROUND_COLOR = '#FFFFFF'; // Assuming white background

/**
 * Generate a color based on a string (typically a user's name)
 * @param text The text to generate a color from
 * @param existingColors Array of existing colors to ensure the new color is distinct
 * @returns A hex color string (e.g., "#ff0000")
 */
export function generateUserColor(text: string, existingColors: string[] = []): string {
	let color = '#' + generateColor(text);

	// Ensure the color has high contrast with the background
	color = ensureHighContrast(color, BACKGROUND_COLOR);

	// If there are existing colors, ensure the new color is distinct
	if (existingColors.length > 0) {
		let attempts = 0;
		const maxAttempts = 5;

		while (attempts < maxAttempts && !isColorDistinct(color, existingColors)) {
			// First try to adjust the color to be distinct while preserving its character
			if (attempts === 0) {
				color = adjustColorToBeDistinct(color, existingColors);

				// If adjustment worked, we're done
				if (isColorDistinct(color, existingColors)) {
					break;
				}
			}

			// If adjustment didn't work or we've already tried it, generate a new color
			text = text + attempts;
			color = '#' + generateColor(text);
			// Ensure the color has high contrast with the background
			color = ensureHighContrast(color, BACKGROUND_COLOR);
			attempts++;
		}
	}

	return color;
}

/**
 * Calculate the relative luminance of a color
 * @param rgb RGB color as an array [r, g, b]
 * @returns The relative luminance value between 0 and 1
 */
function calculateRelativeLuminance(rgb: number[]): number {
	// Convert RGB values to the range [0, 1]
	const [r, g, b] = rgb.map((val) => val / 255);

	// Convert to sRGB
	const rsrgb = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
	const gsrgb = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
	const bsrgb = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

	// Calculate luminance
	return 0.2126 * rsrgb + 0.7152 * gsrgb + 0.0722 * bsrgb;
}

/**
 * Calculate the contrast ratio between two colors
 * @param color1 First color in hex format (e.g., "#ff0000")
 * @param color2 Second color in hex format (e.g., "#ffffff")
 * @returns The contrast ratio between the two colors
 */
function calculateContrastRatio(color1: string, color2: string): number {
	const rgb1 = hexRgb(trimStart(color1, '#'), { format: 'array' });
	const rgb2 = hexRgb(trimStart(color2, '#'), { format: 'array' });

	const luminance1 = calculateRelativeLuminance(rgb1);
	const luminance2 = calculateRelativeLuminance(rgb2);

	// Ensure the lighter color is used as L1
	const L1 = Math.max(luminance1, luminance2);
	const L2 = Math.min(luminance1, luminance2);

	return (L1 + 0.05) / (L2 + 0.05);
}

/**
 * Ensure a color has high contrast with the background
 * @param color The color to check and adjust
 * @param backgroundColor The background color to check against
 * @returns A color with high contrast
 */
function ensureHighContrast(color: string, backgroundColor: string): string {
	const contrastRatio = calculateContrastRatio(color, backgroundColor);

	if (contrastRatio >= MIN_CONTRAST_RATIO) {
		return color; // Color already has high contrast
	}

	// If contrast is too low, adjust the color
	const rgb = hexRgb(trimStart(color, '#'), { format: 'array' });
	const bgRgb = hexRgb(trimStart(backgroundColor, '#'), { format: 'array' });

	// Determine if we should darken or lighten the color based on the background
	const bgLuminance = calculateRelativeLuminance(bgRgb);

	if (bgLuminance > 0.5) {
		// Background is light, so darken the color
		return darkenColor(rgb, backgroundColor);
	} else {
		// Background is dark, so lighten the color
		return lightenColor(rgb, backgroundColor);
	}
}

/**
 * Darken a color until it has sufficient contrast with the background
 * @param rgb The RGB color to darken
 * @param backgroundColor The background color to check against
 * @returns A darkened color with high contrast
 */
function darkenColor(rgb: number[], backgroundColor: string): string {
	let [r, g, b] = rgb;
	let newColor = '#' + rgbHex(r, g, b);
	let contrastRatio = calculateContrastRatio(newColor, backgroundColor);

	// Gradually darken the color until we reach the minimum contrast ratio
	while (contrastRatio < MIN_CONTRAST_RATIO && (r > 0 || g > 0 || b > 0)) {
		r = Math.max(0, r - 5);
		g = Math.max(0, g - 5);
		b = Math.max(0, b - 5);

		newColor = '#' + rgbHex(r, g, b);
		contrastRatio = calculateContrastRatio(newColor, backgroundColor);
	}

	return newColor;
}

/**
 * Lighten a color until it has sufficient contrast with the background
 * @param rgb The RGB color to lighten
 * @param backgroundColor The background color to check against
 * @returns A lightened color with high contrast
 */
function lightenColor(rgb: number[], backgroundColor: string): string {
	let [r, g, b] = rgb;
	let newColor = '#' + rgbHex(r, g, b);
	let contrastRatio = calculateContrastRatio(newColor, backgroundColor);

	// Gradually lighten the color until we reach the minimum contrast ratio
	while (contrastRatio < MIN_CONTRAST_RATIO && (r < 255 || g < 255 || b < 255)) {
		r = Math.min(255, r + 5);
		g = Math.min(255, g + 5);
		b = Math.min(255, b + 5);

		newColor = '#' + rgbHex(r, g, b);
		contrastRatio = calculateContrastRatio(newColor, backgroundColor);
	}

	return newColor;
}

/**
 * Convert RGB to HSL
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns HSL values as [h, s, l] where h is in degrees (0-360) and s, l are percentages (0-100)
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	// Normalize RGB values
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}

		h /= 6;
	}

	// Convert to degrees and percentages
	h = Math.round(h * 360);
	s = Math.round(s * 100);
	const lightness = Math.round(l * 100);

	return [h, s, lightness];
}

/**
 * Convert HSL to RGB
 * @param h Hue (0-360)
 * @param s Saturation (0-100)
 * @param l Lightness (0-100)
 * @returns RGB values as [r, g, b] where each component is 0-255
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
	// Normalize HSL values
	h /= 360;
	s /= 100;
	l /= 100;

	let r, g, b;

	if (s === 0) {
		// Achromatic (gray)
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;

		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	// Convert to 0-255 range
	return [
		Math.round(r * 255),
		Math.round(g * 255),
		Math.round(b * 255)
	];
}

/**
 * Check if a color is visibly distinct from a list of existing colors
 * @param color The color to check
 * @param existingColors Array of existing colors
 * @returns boolean indicating if the color is distinct
 */
function isColorDistinct(color: string, existingColors: string[]): boolean {
	const rgb1 = hexRgb(trimStart(color, '#'), { format: 'array' });
	const [h1, s1, l1] = rgbToHsl(rgb1[0], rgb1[1], rgb1[2]);

	for (const existingColor of existingColors) {
		const rgb2 = hexRgb(trimStart(existingColor, '#'), { format: 'array' });
		const [h2, s2, l2] = rgbToHsl(rgb2[0], rgb2[1], rgb2[2]);

		// Check RGB distance
		const distance = colorDistance(rgb1, rgb2);

		// Check if colors have similar hue
		const hueDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
		const satDiff = Math.abs(s1 - s2);
		const lightDiff = Math.abs(l1 - l2);

		// Colors are too similar if they have:
		// 1. Small RGB distance, or
		// 2. Similar hue with similar saturation and lightness
		if (distance < MIN_COLOR_DISTANCE ||
				(hueDiff < MIN_HUE_DIFFERENCE && satDiff < 20 && lightDiff < 20)) {
			return false;
		}
	}

	return true;
}

/**
 * Adjust a color to make it distinct from existing colors
 * @param color The color to adjust
 * @param existingColors Array of existing colors
 * @returns A modified color that is distinct from existing colors
 */
function adjustColorToBeDistinct(color: string, existingColors: string[]): string {
	const rgb = hexRgb(trimStart(color, '#'), { format: 'array' });
	const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);

	// Try different saturation and lightness values while keeping the same hue
	const variations = [
		[h, Math.min(100, s + 30), l],                  // Increase saturation
		[h, Math.max(20, s - 30), l],                   // Decrease saturation
		[h, s, Math.min(80, l + 20)],                   // Increase lightness
		[h, s, Math.max(20, l - 20)],                   // Decrease lightness
		[h, Math.min(100, s + 20), Math.min(80, l + 20)], // Increase both
		[h, Math.max(20, s - 20), Math.max(20, l - 20)],  // Decrease both
		[(h + 30) % 360, s, l],                         // Shift hue slightly
		[(h + 60) % 360, s, l],                         // Shift hue more
		[(h + 180) % 360, s, l]                         // Complementary color
	];

	for (const [newH, newS, newL] of variations) {
		const [r, g, b] = hslToRgb(newH, newS, newL);
		const newColor = '#' + rgbHex(r, g, b);

		// Check if this variation is distinct and has good contrast
		if (isColorDistinct(newColor, existingColors) &&
				calculateContrastRatio(newColor, BACKGROUND_COLOR) >= MIN_CONTRAST_RATIO) {
			return newColor;
		}
	}

	// If no good variation found, shift the hue significantly
	const newHue = (h + 120) % 360;
	const [r, g, b] = hslToRgb(newHue, s, l);
	return '#' + rgbHex(r, g, b);
}

/**
 * Calculate the Euclidean distance between two RGB colors
 * @param rgb1 First RGB color as an array [r, g, b]
 * @param rgb2 Second RGB color as an array [r, g, b]
 * @returns The distance between the colors
 */
function colorDistance(rgb1: number[], rgb2: number[]): number {
	return Math.sqrt(Math.pow(rgb1[0] - rgb2[0], 2) + Math.pow(rgb1[1] - rgb2[1], 2) + Math.pow(rgb1[2] - rgb2[2], 2));
}

/**
 * Extract colors from text by looking for color names
 * @param text The text to extract colors from
 * @returns Array of RGB colors
 */
function getColors(text: string): number[][] {
	const extractedWords = words(text);
	const colors: number[][] = [];

	extractedWords.forEach(function (word) {
		const color = colornames(word);
		if (color) colors.push(hexRgb(trimStart(color, '#'), { format: 'array' }));
	});

	return colors;
}

/**
 * Mix multiple colors by averaging their RGB values
 * @param colors Array of RGB colors to mix
 * @returns The mixed RGB color
 */
function mixColors(colors: number[][]): number[] {
	const mixed = [0, 0, 0];

	colors.forEach(function (value) {
		for (let i = 0; i < 3; i++) mixed[i] += value[i];
	});

	return [mixed[0] / colors.length, mixed[1] / colors.length, mixed[2] / colors.length];
}

/**
 * Generate a color from text
 * @param text The text to generate a color from
 * @returns A hex color string without the # prefix
 */
function generateColor(text: string): string {
	let mixed;
	const colors = getColors(text);

	if (colors.length > 0) mixed = mixColors(colors);

	let b = 1;
	let d = 0;
	let f = 1;

	if (text.length > 0) {
		for (let i = 0; i < text.length; i++) {
			text[i].charCodeAt(0) > d && (d = text[i].charCodeAt(0)),
				(f = parseInt(String(SEED / d))),
				(b = (b + text[i].charCodeAt(0) * f * FACTOR) % SEED);
		}
	}

	let hex = ((b * text.length) % SEED).toString(16);
	hex = padEnd(hex, 6, hex);

	const rgb = hexRgb(hex, { format: 'array' });

	if (mixed) {
		return rgbHex(
			TEXT_WEIGHT * rgb[0] + MIXED_WEIGHT * mixed[0],
			TEXT_WEIGHT * rgb[1] + MIXED_WEIGHT * mixed[1],
			TEXT_WEIGHT * rgb[2] + MIXED_WEIGHT * mixed[2]
		);
	}

	return hex;
}

/**
 * Test function to check colors for specific names
 * This is for debugging purposes only and should be removed in production
 */
export function testSpecificColors(): void {
	console.log('Testing colors for "adhir" and "lily":');
	console.log('---------------------------------------------------------------------');

	// Generate colors individually
	const adhirColor = generateUserColor('adhir');
	const lilyColor = generateUserColor('lily');

	console.log(`Color for "adhir": ${adhirColor}`);
	console.log(`Color for "lily": ${lilyColor}`);

	// Calculate and display color information
	const adhirRgb = hexRgb(trimStart(adhirColor, '#'), { format: 'array' });
	const lilyRgb = hexRgb(trimStart(lilyColor, '#'), { format: 'array' });

	const adhirHsl = rgbToHsl(adhirRgb[0], adhirRgb[1], adhirRgb[2]);
	const lilyHsl = rgbToHsl(lilyRgb[0], lilyRgb[1], lilyRgb[2]);

	console.log(`\n"adhir" HSL: H=${adhirHsl[0]}°, S=${adhirHsl[1]}%, L=${adhirHsl[2]}%`);
	console.log(`"lily" HSL: H=${lilyHsl[0]}°, S=${lilyHsl[1]}%, L=${lilyHsl[2]}%`);

	const distance = colorDistance(adhirRgb, lilyRgb);
	console.log(`\nColor distance: ${distance.toFixed(2)}`);

	// Now test with the colors being generated sequentially (as they would be in the app)
	console.log('\n\nTesting sequential color generation:');
	console.log('---------------------------------------------------------------------');

	const sequentialColors: string[] = [];
	const names = ['adhir', 'blake', 'jeans', 'lily', 'mae'];

	names.forEach(name => {
		const color = generateUserColor(name, sequentialColors);
		sequentialColors.push(color);

		const rgb = hexRgb(trimStart(color, '#'), { format: 'array' });
		const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

		console.log(`Color for "${name}": ${color} - HSL: H=${hsl[0]}°, S=${hsl[1]}%, L=${hsl[2]}%`);
	});

	// Calculate minimum distance between any two colors
	let minDistance = Infinity;
	let minPair: [string, string] = ['', ''];

	for (let i = 0; i < sequentialColors.length; i++) {
		for (let j = i + 1; j < sequentialColors.length; j++) {
			const rgb1 = hexRgb(trimStart(sequentialColors[i], '#'), { format: 'array' });
			const rgb2 = hexRgb(trimStart(sequentialColors[j], '#'), { format: 'array' });
			const dist = colorDistance(rgb1, rgb2);
			if (dist < minDistance) {
				minDistance = dist;
				minPair = [names[i], names[j]];
			}
		}
	}

	console.log(`\nMinimum distance: ${minDistance.toFixed(2)} between "${minPair[0]}" and "${minPair[1]}"`);
}
