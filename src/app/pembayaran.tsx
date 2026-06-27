import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTransaction } from '../context/TransactionContext';

export default function PembayaranScreen() {
  const router = useRouter();
  const { transactions } = useTransaction();

  // Pembayaran = semua transaksi Beli yang sudah selesai atau dibatalkan (sudah ada kejelasan pembayarannya)
  const completedPayments = transactions.filter(t => t.type === 'Beli' && (t.status === 'Selesai' || t.status === 'Dibatalkan'));
  const totalDibayar = completedPayments
    .filter(t => t.status === 'Selesai')
    .reduce((sum, t) => sum + t.priceNum, 0);

  const formatRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Selesai':
        return { color: '#16A34A', bg: '#DCFCE7', icon: 'checkmark-circle' as const, label: 'Lunas' };
      case 'Dibatalkan':
        return { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle' as const, label: 'Dibatalkan' };
      default:
        return { color: '#64748B', bg: '#F1F5F9', icon: 'help-circle' as const, label: status };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pembayaran</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconWrapper}>
          <Ionicons name="card" size={32} color="#FFF" />
        </View>
        <Text style={styles.summaryLabel}>Total Pembayaran Selesai</Text>
        <Text style={styles.summaryValue}>{formatRp(totalDibayar)}</Text>
        <View style={styles.summaryStatsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {completedPayments.filter(t => t.status === 'Selesai').length}
            </Text>
            <Text style={styles.statLabel}>Lunas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {completedPayments.filter(t => t.status === 'Dibatalkan').length}
            </Text>
            <Text style={styles.statLabel}>Batal</Text>
          </View>
        </View>
      </View>

      {/* Payment List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Riwayat Pembayaran</Text>
      </View>

      {completedPayments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={60} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Belum Ada Pembayaran</Text>
          <Text style={styles.emptyText}>Riwayat pembayaran Anda akan muncul di sini</Text>
        </View>
      ) : (
        <FlatList
          data={completedPayments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const sc = getStatusConfig(item.status);
            return (
              <TouchableOpacity
                style={styles.paymentItem}
                onPress={() => router.push({
                  pathname: '/transaction-detail',
                  params: {
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    status: item.status,
                    image: item.image,
                    type: item.type,
                    otherUser: item.otherUser,
                    date: item.date,
                  },
                })}
              >
                <View style={styles.paymentLeft}>
                  <View style={[styles.paymentIconWrapper, { backgroundColor: sc.bg }]}>
                    <Ionicons name={sc.icon} size={20} color={sc.color} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.paymentDate}>{item.date} • {item.otherUser}</Text>
                  </View>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={[
                    styles.paymentAmount,
                    { color: item.status === 'Dibatalkan' ? '#94A3B8' : '#0F172A' },
                    item.status === 'Dibatalkan' && { textDecorationLine: 'line-through' },
                  ]}>
                    {item.price}
                  </Text>
                  <View style={[styles.paymentStatusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.paymentStatusText, { color: sc.color }]}>{sc.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#16A34A',
    paddingTop: 50,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  summaryCard: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  summaryIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  summaryValue: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 16 },
  summaryStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 16 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 6 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  paymentIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 3 },
  paymentDate: { fontSize: 12, color: '#94A3B8' },
  paymentRight: { alignItems: 'flex-end', marginLeft: 10 },
  paymentAmount: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paymentStatusText: { fontSize: 11, fontWeight: '600' },
});
