/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Multi-chain themed colors for AirChainPay
 * Supporting Core DAO and Base Network themes with animations
 * Enhanced with blue and black mix theme
 */

// Enhanced chain-specific brand colors with modern gradients
export const ChainColors = {
  core: {
    primary: '#FF6B35',    // Core DAO orange
    secondary: '#FF8A50',  // Lighter orange
    accent: '#FFB366',     // Accent orange
    gradient: ['#1A0A00', '#FF6B35', '#FF8A50'], // Enhanced orange gradient
    gradientAlt: ['#FF6B35', '#FF8A50', '#FFB366'], // Alternative gradient
    dark: '#CC5429',       // Darker orange
    light: '#FFD4B3',      // Light orange
  },
  base: {
    primary: '#0052FF',    // Base blue
    secondary: '#1E6FFF',  // Lighter blue
    accent: '#4A90FF',     // Accent blue
    gradient: ['#000814', '#001D3D', '#0052FF'], // Enhanced blue gradient
    gradientAlt: ['#0052FF', '#1E6FFF', '#4A90FF'], // Alternative gradient
    dark: '#003DB8',       // Darker blue
    light: '#B3D4FF',      // Light blue
  },
  success: {
    primary: '#00D4AA',
    gradient: ['#004D40', '#00695C', '#00D4AA'],
    light: '#B2DFDB',
    dark: '#00695C',
  },
  warning: {
    primary: '#FFB800',
    gradient: ['#E65100', '#FF8F00', '#FFB800'],
    light: '#FFE0B2',
    dark: '#E65100',
  },
  error: {
    primary: '#FF4757',
    gradient: ['#B71C1C', '#D32F2F', '#FF4757'],
    light: '#FFCDD2',
    dark: '#B71C1C',
  },
  info: {
    primary: '#3742FA',
    gradient: ['#1A237E', '#283593', '#3742FA'],
    light: '#C5CAE9',
    dark: '#1A237E',
  },
  // Enhanced blue-black theme colors
  blueBlack: {
    primary: '#0052FF',
    secondary: '#1E6FFF',
    accent: '#4A90FF',
    gradient: ['#000814', '#001D3D', '#0052FF'],
    gradientReverse: ['#0052FF', '#001D3D', '#000814'],
    gradientSoft: ['#0F1419', '#1E2A3A', '#2A3F5F'],
    dark: '#000814',
    darkBlue: '#001D3D',
    mediumBlue: '#1E2A3A',
    lightBlue: '#2A3F5F',
    ultraLight: '#E3F2FD',
  },
  // New modern color palettes
  glassmorphism: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    strong: 'rgba(255, 255, 255, 0.25)',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  neon: {
    blue: '#00F5FF',
    purple: '#8A2BE2',
    green: '#39FF14',
    pink: '#FF1493',
    orange: '#FF4500',
  }
};

const tintColorLight = '#0052FF';  // Base blue as default
const tintColorDark = '#4A90FF';   // Lighter blue for dark mode

export const Colors = {
  light: {
    text: '#FFFFFF',           // White text for blue-black theme
    textSecondary: '#E2E8F0',  // Secondary text
    textMuted: '#94A3B8',      // Muted text
    background: '#000814',     // Enhanced dark background
    backgroundSecondary: '#001D3D', // Enhanced secondary background
    backgroundTertiary: '#1E2A3A', // Tertiary background
    tint: tintColorLight,
    icon: '#94A3B8',
    iconActive: '#E2E8F0',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorLight,
    card: '#001D3D',           // Enhanced card background
    cardSecondary: '#1E2A3A',  // Secondary card
    cardGlass: ChainColors.glassmorphism.light, // Glassmorphism card
    border: '#334155',         // Enhanced border
    borderLight: '#475569',    // Light border
    borderGlass: ChainColors.glassmorphism.border, // Glass border
    success: ChainColors.success.primary,
    error: ChainColors.error.primary,
    warning: ChainColors.warning.primary,
    info: ChainColors.info.primary,
    buttonPrimary: tintColorLight,
    buttonSecondary: '#475569',
    buttonSuccess: ChainColors.success.primary,
    buttonWarning: ChainColors.warning.primary,
    buttonError: ChainColors.error.primary,
    buttonGhost: ChainColors.glassmorphism.medium,
    inputBackground: '#1E2A3A', // Enhanced input background
    inputBorder: '#475569',     // Enhanced input border
    inputFocus: tintColorLight, // Input focus color
    modalBackground: 'rgba(0, 8, 20, 0.95)', // Enhanced modal background
    overlay: 'rgba(0, 0, 0, 0.4)',
    overlayLight: 'rgba(0, 0, 0, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowDark: 'rgba(0, 0, 0, 0.6)',
    shadowGlow: 'rgba(0, 82, 255, 0.3)', // Blue glow shadow
    // Chain-specific colors
    core: ChainColors.core,
    base: ChainColors.base,
    // Enhanced gradient backgrounds
    gradientPrimary: ChainColors.blueBlack.gradient,
    gradientSecondary: ChainColors.blueBlack.gradientSoft,
    gradientCard: ['#001D3D', '#1E2A3A', '#2A3F5F'],
    gradientSuccess: ChainColors.success.gradient,
    gradientWarning: ChainColors.warning.gradient,
    gradientError: ChainColors.error.gradient,
    gradientInfo: ChainColors.info.gradient,
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#E2E8F0',
    textMuted: '#94A3B8',
    background: '#000000',     // Pure black background
    backgroundSecondary: '#000814', // Very dark blue
    backgroundTertiary: '#001D3D', // Dark blue tertiary
    tint: tintColorDark,
    icon: '#94A3B8',
    iconActive: '#E2E8F0',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    card: '#000814',           // Very dark blue card
    cardSecondary: '#001D3D',  // Dark blue card
    cardGlass: ChainColors.glassmorphism.light,
    border: '#334155',
    borderLight: '#475569',
    borderGlass: ChainColors.glassmorphism.border,
    success: ChainColors.success.primary,
    error: ChainColors.error.primary,
    warning: ChainColors.warning.primary,
    info: ChainColors.info.primary,
    buttonPrimary: tintColorDark,
    buttonSecondary: '#475569',
    buttonSuccess: ChainColors.success.primary,
    buttonWarning: ChainColors.warning.primary,
    buttonError: ChainColors.error.primary,
    buttonGhost: ChainColors.glassmorphism.medium,
    inputBackground: '#001D3D',
    inputBorder: '#475569',
    inputFocus: tintColorDark,
    modalBackground: 'rgba(0, 0, 0, 0.98)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowDark: 'rgba(0, 0, 0, 0.7)',
    shadowGlow: 'rgba(74, 144, 255, 0.4)',
    // Chain-specific colors
    core: ChainColors.core,
    base: ChainColors.base,
    // Enhanced gradient backgrounds with deeper colors
    gradientPrimary: ['#000000', '#000814', '#4A90FF'],
    gradientSecondary: ['#000000', '#000814', '#001D3D'],
    gradientCard: ['#000814', '#001D3D', '#1E2A3A'],
    gradientSuccess: ChainColors.success.gradient,
    gradientWarning: ChainColors.warning.gradient,
    gradientError: ChainColors.error.gradient,
    gradientInfo: ChainColors.info.gradient,
  },
};

// Animation configurations
export const Animations = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  spring: {
    tension: 100,
    friction: 8,
  },
};

// Chain-specific theme utilities with blue-black enhancements
export const getChainTheme = (chainId: string, isDark = false) => {
  const baseTheme = isDark ? Colors.dark : Colors.light;
  
  switch (chainId) {
    case 'core_testnet':
    case 'core-testnet':
      return {
        ...baseTheme,
        tint: ChainColors.core.primary,
        buttonPrimary: ChainColors.core.primary,
        tabIconSelected: ChainColors.core.primary,
        gradient: ['#000000', '#FF6B35', '#FF8A50'], // Orange with black
        chainColor: ChainColors.core,
      };
    case 'base_sepolia':
    case 'base-sepolia':
      return {
        ...baseTheme,
        tint: ChainColors.base.primary,
        buttonPrimary: ChainColors.base.primary,
        tabIconSelected: ChainColors.base.primary,
        gradient: ChainColors.blueBlack.gradient, // Blue-black gradient
        chainColor: ChainColors.base,
      };
    default:
      return {
        ...baseTheme,
        gradient: ChainColors.blueBlack.gradient,
        chainColor: ChainColors.base,
      };
  }
};

// Utility function to get chain brand color
export const getChainColor = (chainId: string) => {
  switch (chainId) {
    case 'core_testnet':
    case 'core-testnet':
      return ChainColors.core.primary;
    case 'base_sepolia':
    case 'base-sepolia':
      return ChainColors.base.primary;
    default:
      return ChainColors.base.primary;
  }
};

// Utility function to get chain gradient with blue-black mix
export const getChainGradient = (chainId: string) => {
  switch (chainId) {
    case 'core_testnet':
    case 'core-testnet':
      return ['#000000', '#FF6B35', '#FF8A50']; // Orange with black
    case 'base_sepolia':
    case 'base-sepolia':
      return ChainColors.blueBlack.gradient; // Blue-black gradient
    default:
      return ChainColors.blueBlack.gradient;
  }
};

// New utility for blue-black specific gradients
export const getBlueBlackGradient = (variant: 'primary' | 'secondary' | 'reverse' = 'primary') => {
  switch (variant) {
    case 'primary':
      return ChainColors.blueBlack.gradient;
    case 'secondary':
      return ['#0F1419', '#1E2A3A', '#2A3F5F'];
    case 'reverse':
      return ChainColors.blueBlack.gradientReverse;
    default:
      return ChainColors.blueBlack.gradient;
  }
};