import { View, Text, StyleSheet } from 'react-native';
import { Store } from '../types';

export default function StoreBadge({ store, size = 34 }: { store: Store; size?: number }) {
  return (
    <View style={[s.b, { width: size, height: size, borderRadius: size / 2, backgroundColor: store.color }]}>
      <Text style={[s.t, { fontSize: size * 0.42 }]}>{store.name.replace(/^ال/, '').charAt(0)}</Text>
    </View>
  );
}
const s = StyleSheet.create({ b: { alignItems: 'center', justifyContent: 'center' }, t: { color: '#fff', fontWeight: '800' } });
