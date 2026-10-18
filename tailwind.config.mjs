import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import starlightPlugin from '@astrojs/starlight-tailwind';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				accent: '#8b5cf6',
				secondary: '#c4b5fd',
				gray: {
					900: '#2e1065',
					50: '#faf5ff',
				},
			},
			fontFamily: {
				sans: ['Inter', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-out',
				'slide-up': 'slideUp 0.5s ease-out',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
			},
		},
	},
	plugins: [starlightPlugin(), require('tailwindcss-animate')],
	darkMode: ['class', '[data-theme="dark"]'],
};
