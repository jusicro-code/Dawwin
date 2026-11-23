import { ComponentRef, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking, Image, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ad } from '../types';

/** هيدر الإعلانات: بانرات تتقلب تلقائياً كل 4 ثواني */
export default function AdBanner({ ads }: { ads: Ad[] }) {
  const { width } = useWindowDimensions();
  const w = width - 32;
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => {
      setI((cur) => {
        const next = (cur + 1) % ads.length;
        ref.current?.scrollTo({ x: next * (w + 12), animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [ads.length, w]);

  if (!ads.length) return null;
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setI(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / (w + 12)));

  return (
    <View style={s.wrap}>
      <ScrollView
        ref={ref}
        horizontal
        style={{ direction: 'ltr' }}
        showsHorizontalScrollIndicator={false}
        snapToInterval={w + 12}
        decelerationRate="fast"
        onMomentumScrollEnd={onEnd}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {ads.map((ad) => (
          <Pressable
            key={ad.id}
            onPress={() => ad.link_url && Linking.openURL(ad.link_url)}
            style={[s.card, { width: w, backgroundColor: ad.bg_color, direction: 'rtl' }]}
          >
            {ad.image_url ? (
              <Image source={{ uri: ad.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <>
                <View style={{ flex: 1 }}>
                  <Text style={s.tag}>إعلان</Text>
                  <Text style={s.title}>{ad.title}</Text>
                  {!!ad.subtitle && <Text style={s.sub}>{ad.subtitle}</Text>}
                </View>
                <Text style={s.emoji}>{ad.emoji}</Text>
              </>
            )}
          </Pressable>
        ))}
      </ScrollView>
      {ads.length > 1 && (
        <View style={s.dots}>
          {ads.map((a, k) => <View key={a.id} style={[s.dot, k === i && s.dotOn]} />)}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingTop: 8 },
  card: { height: 104, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  tag: { color: '#fff', opacity: 0.7, fontSize: 11, marginBottom: 2 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sub: { color: '#fff', opacity: 0.9, fontSize: 13, marginTop: 4 },
  emoji: { fontSize: 46 },
  dots: { flexDirection: 'row', direction: 'ltr', justifyContent: 'center', gap: 5, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' },
  dotOn: { width: 16, backgroundColor: '#059669' },
});
