import type { LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/hooks/useTheme';

export type IconSize = 'sm' | 'md' | 'lg';

export type AppIconProps = {
  icon: LucideIcon;
  color: string;
  size?: IconSize;
  fill?: string;
};

export function AppIcon({
  icon: Icon,
  color,
  size = 'md',
  fill = 'none',
}: AppIconProps) {
  const theme = useTheme();

  return (
    <Icon
      size={theme.iconSize[size]}
      color={color}
      strokeWidth={theme.iconStroke}
      fill={fill}
    />
  );
}
