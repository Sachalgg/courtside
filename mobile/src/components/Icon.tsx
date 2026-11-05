import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { SurfaceId } from '@/lib/clubs';

export type IconName =
  | 'map'
  | 'list'
  | 'calendar'
  | 'user'
  | 'search'
  | 'pin'
  | 'clock'
  | 'heart'
  | 'heartFill'
  | 'chevronRight'
  | 'chevronLeft'
  | 'close'
  | 'check'
  | 'star'
  | 'phone'
  | 'share'
  | 'card'
  | 'euro'
  | 'locate'
  | 'ball'
  | SurfaceId;

type Props = { name: IconName; size?: number; color: ColorValue; strokeWidth?: number };

export function Icon({ name, size = 22, color, strokeWidth = 1.9 }: Props) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      {render(name, p, color)}
    </Svg>
  );
}

function render(name: IconName, p: object, color: ColorValue) {
  switch (name) {
    case 'map':
      return <Path {...p} d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Zm0 0v14m6-12v14" />;
    case 'list':
      return <Path {...p} d="M8 6.5h12M8 12h12M8 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01" />;
    case 'calendar':
      return (
        <>
          <Rect {...p} x={3.5} y={5} width={17} height={15.5} rx={3.5} />
          <Path {...p} d="M3.5 10h17M8 3v4M16 3v4" />
        </>
      );
    case 'user':
      return (
        <>
          <Circle {...p} cx={12} cy={8.5} r={4} />
          <Path {...p} d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
        </>
      );
    case 'search':
      return (
        <>
          <Circle {...p} cx={11} cy={11} r={6.5} />
          <Path {...p} d="m16 16 4.5 4.5" />
        </>
      );
    case 'pin':
      return (
        <>
          <Path {...p} d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
          <Circle {...p} cx={12} cy={9.5} r={2.5} />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={8.5} />
          <Path {...p} d="M12 7.5V12l3 2" />
        </>
      );
    case 'heart':
      return <Path {...p} d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />;
    case 'heartFill':
      return <Path {...p} fill={color} d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />;
    case 'chevronRight':
      return <Path {...p} d="m9.5 5.5 6.5 6.5-6.5 6.5" />;
    case 'chevronLeft':
      return <Path {...p} d="M14.5 5.5 8 12l6.5 6.5" />;
    case 'close':
      return <Path {...p} d="M6 6l12 12M18 6 6 18" />;
    case 'check':
      return <Path {...p} d="m5 12.5 4.5 4.5L19 7.5" />;
    case 'star':
      return <Path {...p} fill={color} d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6L12 4Z" />;
    case 'phone':
      return <Path {...p} d="M6.5 3.5h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />;
    case 'share':
      return <Path {...p} d="M12 15V3.5m0 0L7.5 8M12 3.5 16.5 8M5 12v6.5A2 2 0 0 0 7 20.5h10a2 2 0 0 0 2-2V12" />;
    case 'card':
      return (
        <>
          <Rect {...p} x={3} y={5.5} width={18} height={13} rx={3} />
          <Path {...p} d="M3 10h18M7 15h3" />
        </>
      );
    case 'euro':
      return <Path {...p} d="M17.5 6.5A7 7 0 1 0 17.5 17.5M4 10.5h9M4 13.5h9" />;
    case 'locate':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={6.5} />
          <Circle {...p} cx={12} cy={12} r={2} fill={color} />
          <Path {...p} d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
        </>
      );
    case 'ball':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={8.5} />
          <Path {...p} d="M5.5 6.5c3 2.5 3 8.5 0 11M18.5 6.5c-3 2.5-3 8.5 0 11" />
        </>
      );
    case 'clay':
      return <Path {...p} d="M3 8c3-1.6 6-1.6 9 0s6 1.6 9 0M3 13c3-1.6 6-1.6 9 0s6 1.6 9 0M3 18c3-1.6 6-1.6 9 0s6 1.6 9 0" />;
    case 'hard':
      return (
        <>
          <Rect {...p} x={3.5} y={3.5} width={17} height={17} rx={3} />
          <Path {...p} d="M3.5 12h17M12 3.5v17" />
        </>
      );
    case 'grass':
      return <Path {...p} d="M4 20c0-4 1.6-7 3-9M9 20c0-5 .8-8.5 2-11M14 20c-.4-5 .3-8.5 1.6-11M19.6 20c-.3-4-1-6.6-2-8.6M3 20h18" />;
    case 'indoor':
      return (
        <>
          <Path {...p} d="M3 10.5 12 4l9 6.5" />
          <Rect {...p} x={6} y={11.5} width={12} height={8.5} rx={2.5} />
          <Path {...p} d="M6 16h12M12 11.5V20" />
        </>
      );
  }
}
