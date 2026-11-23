import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, money } from '../theme';
import { Price, Product, Store } from '../types';
import StoreBadge from './StoreBadge';

type Props = {
  product: Product | null; prices: Price[]; stores: Store[]; qty: number;
  onClose: () => void; onQty: (q: number) => void;
};

/** تفاصيل المنتج: سعره في كل سوبرماركت من الأرخص للأغلى */
export default function ProductSheet({ product, prices, stores, qty, onClose, onQty }: Props) {
  if (!product) return null;
  const byStore = Object.fromEntries(prices.map((p) => [p.store_id, p]));
  const rows = stores
    .map((st) => ({ st, p: byStore[st.id] as Price | undefined }))
    .sort((a, b) => (a.p?.price ?? Infinity) - (b.p?.price ?? Infinity));
  const best = rows[0]?.p?.price;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['bottom']}>
        <View style={s.top}>
          <Pressable onPress={onClose} hitSlop={12}><Text style={s.close}>إغلاق</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={s.hero}>
            <Text style={{ fontSize: 64 }}>{product.emoji ?? '🛒'}</Text>
            <Text style={s.name}>{product.name}</Text>
            <Text style={s.size}>{product.size}</Text>
          </View>
          <Text style={s.h}>الأسعار في المتاجر</Text>
          {rows.map(({ st, p }, i) => (
            <View key={st.id} style={[s.row, i === 0 && p && s.bestRow]}>
              <StoreBadge store={st} />
              <Text style={s.store}>{st.name}</Text>
              {i === 0 && p && <Text style={s.bestTag}>الأرخص</Text>}
              <View style={{ alignItems: 'flex-end' }}>
                {p ? (
                  <>
                    <Text style={[s.price, i === 0 && { color: C.brand }]}>{money(p.price)}</Text>
                    {p.old_price ? <Text style={s.old}>{money(p.old_price)}</Text> : null}
                    {i > 0 && best != null && <Text style={s.diff}>+{money(p.price - best)}</Text>}
                  </>
                ) : (
                  <Text style={s.na}>غير متوفر</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={s.bar}>
          {qty > 0 ? (
            <View style={s.stepper}>
              <Pressable style={s.stepBtn} onPress={() => onQty(qty + 1)}><Text style={s.stepT}>+</Text></Pressable>
              <Text style={s.qty}>{qty} في السلة</Text>
              <Pressable style={s.stepBtn} onPress={() => onQty(qty - 1)}><Text style={s.stepT}>−</Text></Pressable>
            </View>
          ) : (
            <Pressable style={s.cta} onPress={() => onQty(1)}><Text style={s.ctaT}>أضف للسلة</Text></Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', padding: 16, paddingTop: 18 },
  close: { color: C.brand, fontSize: 16, fontWeight: '700' },
  hero: { alignItems: 'center', backgroundColor: C.card, borderRadius: 20, padding: 20, marginBottom: 18 },
  name: { fontSize: 20, fontWeight: '800', color: C.text, marginTop: 8, textAlign: 'center' },
  size: { fontSize: 14, color: C.sub, marginTop: 4 },
  h: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  bestRow: { borderColor: C.brand, backgroundColor: C.brandSoft },
  store: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  bestTag: { backgroundColor: C.brand, color: '#fff', fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  price: { fontSize: 16, fontWeight: '800', color: C.text },
  old: { fontSize: 11, color: C.sub, textDecorationLine: 'line-through' },
  diff: { fontSize: 11, color: C.red },
  na: { fontSize: 13, color: C.sub },
  bar: { padding: 16, backgroundColor: C.card, borderTopWidth: 1, borderColor: C.line },
  cta: { backgroundColor: C.brand, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  ctaT: { color: '#fff', fontSize: 16, fontWeight: '800' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  stepT: { color: '#fff', fontSize: 22, fontWeight: '800' },
  qty: { fontSize: 16, fontWeight: '800', color: C.text },
});
