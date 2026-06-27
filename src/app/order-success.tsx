import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Animated, ScrollView, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { invoiceId, title, price, totalPayment, sellerName, date } = params;

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Start pulsing effect on the icon ring after entrance
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Background Decor */}
      <View style={styles.bgDecorTop} />
      <View style={styles.bgDecorBottom} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-done" size={48} color="#FFF" />
            </View>
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%', alignItems: 'center' }]}>
          <Text style={styles.successTitle}>Hore, Berhasil!</Text>
          <Text style={styles.successSubtitle}>
            Pembayaran untuk pesananmu sudah kami terima. Penjual akan segera memprosesnya.
          </Text>

          {/* Receipt Card */}
          <View style={styles.receiptContainer}>
            {/* Top jagged edge simulated with border radius */}
            <View style={styles.receiptTopBorder} />
            <View style={styles.receiptCard}>
              
              <View style={styles.receiptHeader}>
                <View style={styles.receiptHeaderLeft}>
                  <Ionicons name="receipt" size={20} color="#0EA5E9" />
                  <Text style={styles.invoiceHeaderTitle}>Ringkasan Transaksi</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Proses</Text>
                </View>
              </View>

              <View style={styles.dashedDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>No. Invoice</Text>
                <Text style={styles.detailValueHighlight}>{invoiceId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Waktu</Text>
                <Text style={styles.detailValue}>{date}</Text>
              </View>
              
              <View style={styles.itemBox}>
                <View style={styles.itemIconBox}>
                  <Ionicons name="cube-outline" size={20} color="#6366F1" />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{title}</Text>
                  <Text style={styles.itemSeller}>Penjual: {sellerName}</Text>
                </View>
              </View>

              <View style={styles.dashedDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Harga Barang</Text>
                <Text style={styles.detailValue}>{price}</Text>
              </View>

              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total Dibayar</Text>
                <Text style={styles.totalValue}>{totalPayment}</Text>
              </View>
            </View>
            {/* Bottom edge */}
            <View style={styles.receiptBottomBorder} />
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="wallet" size={20} color="#0EA5E9" />
            </View>
            <Text style={styles.infoText}>
              Saldo sebesar <Text style={styles.infoTextBold}>{totalPayment}</Text> berhasil dipotong.
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)/transaction')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Lihat Status Pesanan</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/' as any)}
            activeOpacity={0.6}
          >
            <Text style={styles.secondaryButtonText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  bgDecorTop: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#E0F2FE',
    opacity: 0.6,
  },
  bgDecorBottom: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#EEF2FF',
    opacity: 0.7,
  },
  container: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 48,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    height: 140,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    opacity: 0.2,
  },
  iconWrapper: {
    zIndex: 2,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  receiptContainer: {
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  receiptCard: {
    backgroundColor: '#FFF',
    padding: 20,
  },
  receiptTopBorder: {
    height: 8,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  receiptBottomBorder: {
    height: 12,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceHeaderTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#0F172A',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
    marginRight: 6,
  },
  statusText: { fontSize: 12, fontWeight: '700', color: '#EA580C' },
  dashedDivider: {
    height: 1,
    borderBottomWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  detailValueHighlight: { fontSize: 14, color: '#0EA5E9', fontWeight: '700' },
  itemBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  itemSeller: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#0369A1' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#0284C7' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 32,
    width: '100%',
  },
  infoIconWrapper: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
  },
  infoTextBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#64748B', fontWeight: '700', fontSize: 15 },
});
