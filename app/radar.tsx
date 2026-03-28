import { View, Text } from 'react-native';
import { useTheme } from '@/theme';

export default function RadarScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Radar — Coming Soon</Text>
    </View>
  );
}
