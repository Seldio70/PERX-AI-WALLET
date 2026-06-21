import { useState } from "react";
import { DimensionValue, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { styles } from "../styles/appStyles";
import { currency } from "../lib/format";

export type ProviderMetricItem = {
  label: string;
  value: string;
  hint?: string;
  onPress?: () => void;
};

export function ProviderRevenueChart({
  data
}: {
  data: Array<{ label: string; revenue: number }>;
}) {
  const max = Math.max(...data.map((item) => item.revenue), 1);

  return (
    <View style={styles.providerChartWrap}>
      <View style={styles.providerChartBars}>
        {data.map((item) => {
          const heightPct = Math.max(8, Math.round((item.revenue / max) * 100));
          return (
            <View key={item.label} style={styles.providerChartBarCol}>
              <View style={styles.providerChartBarTrack}>
                <View style={[styles.providerChartBarFill, { height: `${heightPct}%` }]} />
              </View>
              <Text style={styles.providerChartBarLabel}>{item.label}</Text>
              <Text style={styles.providerChartBarValue} numberOfLines={1}>
                {item.revenue > 0 ? currency(item.revenue) : "—"}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.providerChartCaption}>Revenue · last 7 days</Text>
    </View>
  );
}

export function ProviderMetricChip({
  label,
  value,
  hint,
  carousel = false
}: {
  label: string;
  value: string;
  hint?: string;
  carousel?: boolean;
}) {
  return (
    <View style={[styles.providerMetricChip, carousel && styles.providerMetricChipCarousel]}>
      <Text style={styles.providerMetricChipLabel}>{label}</Text>
      <Text style={styles.providerMetricChipValue}>{value}</Text>
      {hint ? <Text style={styles.providerMetricChipHint}>{hint}</Text> : null}
    </View>
  );
}

export function ProviderMetricCarousel({ items }: { items: ProviderMetricItem[] }) {
  const { width } = useWindowDimensions();
  const slideWidth = Math.round((width - 40) * 0.48);
  const gap = 8;
  const stride = slideWidth + gap;
  const [activeIndex, setActiveIndex] = useState(0);
  const showCarouselHint = items.length > 2;

  return (
    <View style={styles.providerMetricCarouselWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={stride}
        snapToAlignment="start"
        disableIntervalMomentum
        scrollEventThrottle={16}
        contentContainerStyle={styles.providerMetricCarouselContent}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / stride);
          setActiveIndex(Math.max(0, Math.min(items.length - 1, next)));
        }}
      >
        {items.map((item) => {
          const chip = (
            <ProviderMetricChip carousel label={item.label} value={item.value} hint={item.hint} />
          );
          return (
            <View key={item.label} style={{ width: slideWidth }}>
              {item.onPress ? (
                <Pressable onPress={item.onPress}>{chip}</Pressable>
              ) : (
                chip
              )}
            </View>
          );
        })}
      </ScrollView>
      {showCarouselHint ? (
        <View style={styles.providerMetricCarouselFooter}>
          <View style={styles.providerMetricCarouselDots}>
            {items.map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.providerMetricCarouselDot,
                  index === activeIndex && styles.providerMetricCarouselDotActive
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function ProviderProgressBar({ ratio }: { ratio: number }) {
  const width = `${Math.min(100, Math.max(0, ratio * 100))}%` as DimensionValue;
  return (
    <View style={styles.providerProgressTrack}>
      <View style={[styles.providerProgressFill, { width }]} />
    </View>
  );
}
