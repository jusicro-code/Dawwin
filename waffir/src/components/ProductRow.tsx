import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, money } from '../theme';
import { Price, Product, Store } from '../types';

type Props = {
  product: Product; prices: Price[]; storeById: Record<string, Store>;
  qty: number; onPress: () => void; onAdd: () => void;
};

export default function ProductRow({ product, prices, storeById, qty, onPress, onAdd }: Props) {
  const sorted = [...prices].sort((a, b) => a.price - b.price);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const save = best && worst ? worst.price - best.price : 0;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
      <View style={s.img}><Text style={{ fontSize: 30 }}>{product.emoji ?? '🛒'}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>{product.name}</Text>
        <Text style={s.size}>{product.size}</Text>
        {best && (
          <View style={s.priceLine}>
            <Text style={s.price}>{money(best.price)}</Text>
            <Text style={s.at}>في {storeById[best.store_id]?.name}</Text>
          </View>
        )}
        {save > 0.009 && <Text style={s.save}>فرق السعر حتى {money(save)}</Text>}
      </View>
      <Pressable onPress={onAdd} hitSlop={10} style={[s.add, qty > 0 && s.addOn]}>
        <Text style={[s.addT, qty > 0 && { color: '#fff' }]}>{qty > 0 ? qty : '+'}</Text>
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, padding: 12, borderRadius: 16, marginHorizontal: 16, marginBottom: 10 },
  img: { width: 58, height: 58, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: C.text },
  size: { fontSize: 12, color: C.sub, marginTop: 2 },
  priceLine: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  price: { fontSize: 16, fontWeight: '800', color: C.brand },
  at: { fontSize: 12, color: C.sub },
  save: { fontSize: 11, color: C.red, marginTop: 2 },
  add: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  addOn: { backgroundColor: C.brand },
  addT: { color: C.brand, fontSize: 18, fontWeight: '800' },
});
