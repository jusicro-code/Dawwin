import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { C, money } from '../theme';
import { Catalog, Price } from '../types';
import { Basket } from '../lib/basket';
import StoreBadge from '../components/StoreBadge';

type Props = {
  catalog: Catalog; pricesByProduct: Record<string, Price[]>; basket: Basket;
  setQty: (id: string, q: number) => void; clear: () => void; onBrowse: () => void;
};

/** السلة: تحسب إجمالي سلتك في كل سوبرماركت وتطلع لك الأرخص */
export default function BasketScreen({ catalog, pricesByProduct, basket, setQty, clear, onBrowse }: Props) {
  const items = catalog.products.filter((p) => basket[p.id]);
  if (!items.length) {
    return (
      <View style={s.emptyWrap}>
        <Text style={{ fontSize: 56 }}>🧺</Text>
        <Text style={s.emptyT}>سلتك فاضية</Text>
        <Text style={s.emptyS}>أضف منتجاتك ونقول لك وين أرخص مكان تشتري منه السلة كاملة</Text>
        <Pressable style={s.cta} onPress={onBrowse}><Text style={s.ctaT}>تصفح المنتجات</Text></Pressable>
      </View>
    );
  }

  const totals = catalog.stores
    .map((st) => {
      let total = 0; let missing = 0;
      for (const p of items) {
        const pr = (pricesByProduct[p.id] ?? []).find((x) => x.store_id === st.id);
        if (pr) total += pr.price * basket[p.id]; else missing++;
      }
      return { st, total, missing };
    })
    .sort((a, b) => a.missing - b.missing || a.total - b.total);
  const best = totals[0];
  const complete = totals.filter((t) => t.missing === 0);
  const saving = complete.length > 1 ? complete[complete.length - 1].total - complete[0].total : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={s.winner}>
        <Text style={s.winLabel}>أرخص سوبرماركت لسلتك</Text>
        <View style={s.winRow}>
          <StoreBadge store={best.st} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={s.winName}>{best.st.name}</Text>
            {best.missing > 0 && <Text style={s.winMiss}>ناقص {best.missing} منتج</Text>}
          </View>
          <Text style={s.winTotal}>{money(best.total)}</Text>
        </View>
        {saving > 0.009 && <Text style={s.saving}>توفّر {money(saving)} مقارنة بأغلى متجر</Text>}
      </View>

      <Text style={s.h}>مقارنة الإجمالي</Text>
      {totals.map(({ st, total, missing }, i) => (
        <View key={st.id} style={s.row}>
          <StoreBadge store={st} />
          <View style={{ flex: 1 }}>
            <Text style={s.store}>{st.name}</Text>
            {missing > 0 && <Text style={s.miss}>غير متوفر: {missing}</Text>}
          </View>
          <Text style={[s.total, i === 0 && { color: C.brand }]}>{money(total)}</Text>
        </View>
      ))}

      <View style={s.hRow}>
        <Text style={s.h}>منتجاتك ({items.length})</Text>
        <Pressable onPress={clear} hitSlop={10}><Text style={s.clear}>تفريغ السلة</Text></Pressable>
      </View>
      {items.map((p) => (
        <View key={p.id} style={s.row}>
          <Text style={{ fontSize: 26 }}>{p.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.store} numberOfLines={1}>{p.name}</Text>
            <Text style={s.miss}>{p.size}</Text>
          </View>
          <View style={s.stepper}>
            <Pressable style={s.step} onPress={() => setQty(p.id, basket[p.id] + 1)}><Text style={s.stepT}>+</Text></Pressable>
            <Text style={s.qty}>{basket[p.id]}</Text>
            <Pressable style={s.step} onPress={() => setQty(p.id, basket[p.id] - 1)}><Text style={s.stepT}>−</Text></Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyT: { fontSize: 20, fontWeight: '800', color: C.text, marginTop: 12 },
  emptyS: { fontSize: 14, color: C.sub, textAlign: 'center', marginTop: 6, lineHeight: 22 },
  cta: { backgroundColor: C.brand, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, marginTop: 20 },
  ctaT: { color: '#fff', fontWeight: '800', fontSize: 15 },
  winner: { backgroundColor: C.brandDark, borderRadius: 20, padding: 16, marginBottom: 18 },
  winLabel: { color: '#A7F3D0', fontSize: 13, fontWeight: '600' },
  winRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  winName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  winMiss: { color: '#FCA5A5', fontSize: 12 },
  winTotal: { color: '#fff', fontSize: 22, fontWeight: '800' },
  saving: { color: '#A7F3D0', fontSize: 13, marginTop: 10, fontWeight: '600' },
  h: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 10 },
  hRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  clear: { color: C.red, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8 },
  store: { fontSize: 15, fontWeight: '700', color: C.text },
  miss: { fontSize: 12, color: C.sub },
  total: { fontSize: 16, fontWeight: '800', color: C.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  step: { width: 30, height: 30, borderRadius: 10, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' },
  stepT: { color: C.brand, fontSize: 18, fontWeight: '800' },
  qty: { fontSize: 15, fontWeight: '800', minWidth: 18, textAlign: 'center' },
});
