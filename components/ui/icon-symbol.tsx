import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

type Props = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

/** Mapeo mínimo para nombres estilo SF Symbols usados en la plantilla explore. */
const SF_TO_IONICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'chevron.left.forwardslash.chevron.right': 'code-slash',
};

export function IconSymbol({ name, size = 24, color = '#000', style }: Props) {
  const ion = SF_TO_IONICONS[name] ?? 'ellipse-outline';
  return <Ionicons name={ion} size={size} color={color} style={style} />;
}
