import Svg, { Path, Rect, Circle } from 'react-native-svg';

// Stroke icons taken from the design mockups (24 × 24 viewBox, currentColor).
const ICONS = {
  close: { strokeWidth: 2, shapes: [<Path key="p" d="M6 6l12 12M18 6L6 18" />] },
  gallery: {
    strokeWidth: 1.8,
    shapes: [
      <Rect key="r" x={3.5} y={5} width={17} height={14} rx={2.5} />,
      <Circle key="c" cx={9} cy={10} r={1.6} />,
      <Path key="p" d="M20.5 16l-5-5-8 8" />,
    ],
  },
  favorite: {
    strokeWidth: 1.9,
    shapes: [
      <Path key="p" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
    ],
  },
  statementPiece: {
    strokeWidth: 1.9,
    shapes: [
      <Path
        key="p"
        d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"
      />,
    ],
  },
  ironing: {
    strokeWidth: 1.9,
    shapes: [
      <Path key="a" d="M2 18h19.5v-5a4 4 0 0 0-4-4H9.5C6 9 3.4 12.2 2 18z" />,
      <Path key="b" d="M10 9V7.5A1.5 1.5 0 0 1 11.5 6h6.5a1.5 1.5 0 0 1 1.5 1.5v2" />,
    ],
  },
  check: { strokeWidth: 2.6, shapes: [<Path key="p" d="M5 12.5l4.5 4.5L19 7.5" />] },
  chevronDown: { strokeWidth: 2, shapes: [<Path key="p" d="M6 9l6 6 6-6" />] },
  progress: { strokeWidth: 2.2, shapes: [<Path key="p" d="M12 3a9 9 0 1 0 9 9" />] },
  // Not in the mockups (rotate button added 2026-11-13): provisional.
  rotate: {
    strokeWidth: 2,
    shapes: [<Path key="p" d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5" />],
  },
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size: number;
  color: string;
}

/** Decorative: the control that holds it carries the accessible name. */
export function Icon({ name, size, color }: IconProps) {
  const { strokeWidth, shapes } = ICONS[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {shapes}
    </Svg>
  );
}
