import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { C } from './src/theme';
import { Catalog, Price, Store } from './src/types';
import { loadCatalog } from './src/lib/catalog';
import { useBasket } from './src/lib/basket';
import HomeScreen from './src/screens/HomeScreen';
import BasketScreen from './src/screens/BasketScreen';
import ProductSheet from './src/components/ProductSheet';

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [tab, setTab] = useState<'home' | 'basket'>('home');
  const [openId, setOpenId] = useState<string | null>(null);
  const { basket, setQty, clear } = useBasket();

  useEffect(() => { loadCatalog().then(setCatalog); }, []);

  const pricesByProduct = useMemo(() => {
    const m: Record<string, Price[]> = {};
    catalog?.prices.forEach((p) => (m[p.product_id] ??= []).push(p));
    return m;
  }, [catalog]);
  const storeById = useMemo(
    () => Object.fromEntries((catalog?.stores ?? []).map((s) => [s.id, s])) as Record<string, Store>,
    [catalog],
  );
  const count = Object.values(basket).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.header}>
          <Text style={s.logo}>وفّر</Text>
          <Text style={s.tagline}>قارن أسعار السوبرماركت</Text>
        </View>
        {!catalog ? (
          <ActivityIndicator style={{ flex: 1 }} color={C.brand} />
        ) : (
          <View style={{ flex: 1 }}>
            {catalog.source === 'sample' && <Text style={s.note}>الأسعار المعروضة تجريبية</Text>}
            {tab === 'home' ? (
              <HomeScreen
                catalog={catalog} pricesByProduct={pricesByProduct} storeById={storeById} basket={basket}
                onOpen={setOpenId} onAdd={(id) => setQty(id, (basket[id] ?? 0) + 1)}
              />
            ) : (
              <BasketScreen
                catalog={catalog} pricesByProduct={pricesByProduct} basket={basket}
                setQty={setQty} clear={clear} onBrowse={() => setTab('home')}
              />
            )}
            <ProductSheet
              product={catalog.products.find((p) => p.id === openId) ?? null}
              prices={openId ? pricesByProduct[openId] ?? [] : []}
              stores={catalog.stores} qty={openId ? basket[openId] ?? 0 : 0}
              onClose={() => setOpenId(null)} onQty={(q) => openId && setQty(openId, q)}
            />
          </View>
        )}
        <SafeAreaView edges={['bottom']} style={s.tabs}>
          <Tab label="الرئيسية" icon="🏠" on={tab === 'home'} onPress={() => setTab('home')} />
          <Tab label="سلتي" icon="🧺" on={tab === 'basket'} onPress={() => setTab('basket')} badge={count} />
        </SafeAreaView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Tab({ label, icon, on, onPress, badge }: { label: string; icon: string; on: boolean; onPress: () => void; badge?: number }) {
  return (
    <Pressable style={s.tab} onPress={onPress}>
      <View>
        <Text style={{ fontSize: 22, opacity: on ? 1 : 0.5 }}>{icon}</Text>
        {!!badge && <View style={s.badge}><Text style={s.badgeT}>{badge}</Text></View>}
      </View>
      <Text style={[s.tabT, on && { color: C.brand }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: 16, paddingTop: 6 },
  logo: { fontSize: 26, fontWeight: '900', color: C.brand },
  tagline: { fontSize: 13, color: C.sub },
  note: { fontSize: 11, color: C.sub, textAlign: 'center', marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderColor: C.line, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 6 },
  tabT: { fontSize: 12, fontWeight: '700', color: C.sub, marginTop: 2 },
  badge: { position: 'absolute', top: -4, right: -12, backgroundColor: C.red, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeT: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
