import { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
import { C } from '../theme';
import { Catalog, Price, Store } from '../types';
import { Basket } from '../lib/basket';
import AdBanner from '../components/AdBanner';
import ProductRow from '../components/ProductRow';

type Props = {
  catalog: Catalog; pricesByProduct: Record<string, Price[]>; storeById: Record<string, Store>;
  basket: Basket; onOpen: (id: string) => void; onAdd: (id: string) => void;
};

const norm = (t: string) => t.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase().trim();

export default function HomeScreen({ catalog, pricesByProduct, storeById, basket, onOpen, onAdd }: Props) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);

  const list = useMemo(() => {
    const nq = norm(q);
    return catalog.products.filter(
      (p) => (!cat || p.category_id === cat) && (!nq || norm(p.name).includes(nq)),
    );
  }, [catalog.products, q, cat]);

  return (
    <View style={{ flex: 1 }}>
      <AdBanner ads={catalog.ads} />
      <View style={s.search}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <TextInput
          value={q} onChangeText={setQ} placeholder="ابحث عن منتج… حليب، أرز، دجاج"
          placeholderTextColor={C.sub} style={s.input} returnKeyType="search"
        />
        {!!q && <Pressable onPress={() => setQ('')} hitSlop={10}><Text style={{ color: C.sub }}>✕</Text></Pressable>}
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
          <Chip label="الكل" on={!cat} onPress={() => setCat(null)} />
          {catalog.categories.map((c) => (
            <Chip key={c.id} label={`${c.emoji ?? ''} ${c.name}`} on={cat === c.id} onPress={() => setCat(cat === c.id ? null : c.id)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={s.empty}>ما لقينا منتج بهالاسم</Text>}
        renderItem={({ item }) => (
          <ProductRow
            product={item} prices={pricesByProduct[item.id] ?? []} storeById={storeById}
            qty={basket[item.id] ?? 0} onPress={() => onOpen(item.id)} onAdd={() => onAdd(item.id)}
          />
        )}
      />
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && s.chipOn]}>
      <Text style={[s.chipT, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, borderRadius: 14, height: 48, borderWidth: 1, borderColor: C.line },
  input: { flex: 1, fontSize: 15, color: C.text, height: '100%' },
  cats: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.brand, borderColor: C.brand },
  chipT: { fontSize: 13, fontWeight: '600', color: C.text },
  empty: { textAlign: 'center', color: C.sub, marginTop: 40 },
});
