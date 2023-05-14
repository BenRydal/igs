/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  daisyui: {
    themes: [
      {
        theme: {
          "primary": "#40d173",
          "secondary": "#6136c4",
          "accent": "#ef9475",
          "neutral": "#1F2C33",
          "base-100": "#FBFCFD",
          "info": "#9AD4E4",
          "success": "#29DB7F",
          "warning": "#F9D42F",
          "error": "#EB245F",
        },
      },
    ],
  },
  plugins: [
    require("daisyui"),
  ],
};