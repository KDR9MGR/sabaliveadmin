/** Design tokens mirror the real Saba Live app theme
 *  (sabalive/lib/theme/app_colors.dart + app_theme.dart) — this is the
 *  product's actual brand, not an invented palette for this site. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0716',
        'bg-elevated': '#130C24',
        surface: '#1A1230',
        'surface-alt': '#221743',
        card: '#1E1638',
        stroke: '#2E2352',
        brand: {
          DEFAULT: '#9B3DF5',
          deep: '#6D28D9',
          bright: '#B25CFF',
          violet: '#7C3AED',
        },
        magenta: '#F5279B',
        pink: '#EC4899',
        gold: {
          DEFAULT: '#FFC93C',
          deep: '#F5A623',
        },
        live: '#FF2D55',
        diamond: '#43B0FF',
        success: '#32D583',
        danger: '#FF4D4F',
        ink: {
          primary: '#F6F3FF',
          secondary: '#B6A8DB',
          muted: '#7E719F',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        xl2: '20px',
        xl3: '28px',
      },
      boxShadow: {
        glow: '0 0 60px -10px rgba(155, 61, 245, 0.45)',
        'glow-gold': '0 0 50px -12px rgba(255, 201, 60, 0.35)',
        card: '0 8px 30px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7C3AED 0%, #C026D3 55%, #F5279B 100%)',
        'primary-gradient': 'linear-gradient(90deg, #B25CFF 0%, #7C3AED 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FFE08A 0%, #FFC93C 55%, #F5A623 100%)',
        'hero-glow': 'radial-gradient(circle at 50% 0%, #2A1755 0%, #0B0716 70%)',
      },
      maxWidth: {
        content: '1180px',
      },
    },
  },
  plugins: [],
}
