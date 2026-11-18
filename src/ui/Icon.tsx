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
  cameraOff: {
    strokeWidth: 1.7,
    shapes: [
      <Path key="a" d="M3 3l18 18" />,
      <Path
        key="b"
        d="M9.5 5h5l1.5 2h3a1.5 1.5 0 0 1 1.5 1.5v8M17 19H4.5A1.5 1.5 0 0 1 3 17.5v-9A1.5 1.5 0 0 1 4.5 7H7"
      />,
      <Path key="c" d="M9.9 10.2a3 3 0 0 0 4 4" />,
    ],
  },
  check: { strokeWidth: 2.6, shapes: [<Path key="p" d="M5 12.5l4.5 4.5L19 7.5" />] },
  chevronDown: { strokeWidth: 2, shapes: [<Path key="p" d="M6 9l6 6 6-6" />] },
  progress: { strokeWidth: 2.2, shapes: [<Path key="p" d="M12 3a9 9 0 1 0 9 9" />] },
  // Tab bar (TabBar mockups): Today, Laundry, Wardrobe.
  hanger: {
    strokeWidth: 1.7,
    shapes: [
      <Path key="a" d="M10 6.5a2 2 0 1 1 2.6 1.9c-.4.1-.6.5-.6.9V10" />,
      <Path key="b" d="M12 10 3.6 15.9a1.2 1.2 0 0 0 .7 2.1h15.4a1.2 1.2 0 0 0 .7-2.1L12 10z" />,
    ],
  },
  washingMachine: {
    strokeWidth: 1.8,
    shapes: [
      <Rect key="r" x={4.5} y={3} width={15} height={18} rx={2.5} />,
      <Circle key="c" cx={12} cy={13} r={4.2} />,
      <Path key="p" d="M7.5 6.5h2.5" />,
    ],
  },
  wardrobe: {
    strokeWidth: 1.8,
    shapes: [
      <Rect key="r" x={4.5} y={3} width={15} height={17} rx={1.5} />,
      <Path key="p" d="M12 3v17M9.8 10.5v2.5M14.2 10.5v2.5M7 20v1.5M17 20v1.5" />,
    ],
  },
  // Today header and outfit (01-aujourdhui and 02-changer-une-piece mockups).
  settings: {
    strokeWidth: 1.8,
    shapes: [
      <Path key="p" d="M4 7h9M17 7h3M4 17h3M11 17h9" />,
      <Circle key="a" cx={15} cy={7} r={2} />,
      <Circle key="b" cx={9} cy={17} r={2} />,
    ],
  },
  rainCloud: {
    strokeWidth: 1.8,
    shapes: [
      <Path key="a" d="M7 14.5a4 4 0 0 1-.7-7.9 5.5 5.5 0 0 1 10.6.9 3.5 3.5 0 0 1 .1 7H7z" />,
      <Path key="b" d="M8.5 17.5l-1 2.5M12.5 17.5l-1 2.5M16.5 17.5l-1 2.5" />,
    ],
  },
  cloud: {
    strokeWidth: 1.8,
    shapes: [
      <Path key="p" d="M7 18a4 4 0 0 1-.7-7.9 5.5 5.5 0 0 1 10.6.9 3.5 3.5 0 0 1 .1 7H7z" />,
    ],
  },
  sun: {
    strokeWidth: 1.8,
    shapes: [
      <Circle key="c" cx={12} cy={12} r={4} />,
      <Path
        key="p"
        d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"
      />,
    ],
  },
  thermometer: {
    strokeWidth: 1.8,
    shapes: [<Path key="p" d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0z" />],
  },
  snowflake: {
    strokeWidth: 1.8,
    shapes: [
      <Path
        key="p"
        d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5"
      />,
    ],
  },
  umbrella: {
    strokeWidth: 1.8,
    shapes: [
      <Path key="a" d="M3 12a9 9 0 0 1 18 0z" />,
      <Path key="b" d="M12 12v6a2 2 0 0 1-4 0" />,
    ],
  },
  bike: {
    strokeWidth: 1.7,
    shapes: [
      <Circle key="a" cx={5.5} cy={16} r={3.5} />,
      <Circle key="b" cx={18.5} cy={16} r={3.5} />,
      <Path
        key="p"
        d="M5.5 16 L9.5 8.5 H15.5 L18.5 16 M9.5 8.5 L12 16 L15.5 8.5 M12 16 H5.5 M9.5 8.5 V6 M8 6 H11 M15.5 8.5 L14.8 5.5 H17"
      />,
    ],
  },
  walking: {
    strokeWidth: 1.7,
    shapes: [
      <Circle key="c" cx={13.5} cy={4.5} r={1.8} />,
      <Path
        key="p"
        d="M10.5 21 L12 15 L14.5 17.5 V21 M12 15 L12.8 9 L9.5 10.5 L8.5 13.5 M12.8 9 L15 12 L17.5 13"
      />,
    ],
  },
  plus: { strokeWidth: 2, shapes: [<Path key="p" d="M12 5v14M5 12h14" />] },
  airing: {
    strokeWidth: 2.2,
    shapes: [<Path key="p" d="M3 9h10.5a2.5 2.5 0 1 0-2.5-2.5M3 14h14.5a2.5 2.5 0 1 1-2.5 2.5" />],
  },
  dryingRack: {
    strokeWidth: 2.2,
    shapes: [
      <Path key="a" d="M2 5c4 2 16 2 20 0" />,
      <Path
        key="b"
        d="M8.2 9.2L5 11.2l1.4 2.9 1.6-.9V20h8v-6.8l1.6.9 1.4-2.9-3.2-2c-.8.9-2.2 1.4-3.8 1.4s-3-.5-3.8-1.4z"
      />,
      <Path key="c" d="M8.5 4.8v3.2M15.5 4.8v3.2" />,
    ],
  },
  // Radial menu (05-dressing mockups).
  toDry: {
    strokeWidth: 1.8,
    shapes: [
      <Path
        key="a"
        d="M8.5 3L4 5.5l1.6 3 1.9-1V14h9V7.5l1.9 1 1.6-3L15.5 3c-.8 1-2 1.5-3.5 1.5S9.3 4 8.5 3z"
      />,
      <Path key="b" d="M12 16.5s-1.8 2.1-1.8 3.4a1.8 1.8 0 0 0 3.6 0c0-1.3-1.8-3.4-1.8-3.4z" />,
    ],
  },
  ironSteam: {
    strokeWidth: 1.8,
    shapes: [
      <Path key="a" d="M2 18h19.5v-5a4 4 0 0 0-4-4H9.5C6 9 3.4 12.2 2 18z" />,
      <Path key="b" d="M10 9V7.5A1.5 1.5 0 0 1 11.5 6h6.5a1.5 1.5 0 0 1 1.5 1.5v2" />,
      <Path key="c" d="M6 15h.01M9 15h.01M12 15h.01" />,
    ],
  },
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
  // Some mockups draw the same icon thinner at a larger size.
  strokeWidth?: number;
  // Fills the shape with its colour (an active favourite).
  filled?: boolean;
}

/** Decorative: the control that holds it carries the accessible name. */
export function Icon({ name, size, color, strokeWidth, filled = false }: IconProps) {
  const icon = ICONS[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth ?? icon.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {icon.shapes}
    </Svg>
  );
}
