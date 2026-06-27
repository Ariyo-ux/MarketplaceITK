import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTransaction } from '../context/TransactionContext';

export default function TagihanScreen() {
  const router = useRouter();
  const { transactions } = useTransaction();

  // Tagihan = transaksi Beli yang masih berstatus Proses (belum selesai dibayarkan / pending)
  const pendingBills = transactions.filter(t => t.type === 'Beli' && t.status === 'Proses');
  const totalTagihan = pendingBills.reduce((sum, t) => sum + t.priceNum, 0);

  const formatRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tagihan</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconWrapper}>
          <Ionicons name="receipt" size={32} color="#E11D48" />
        </View>
        <Text style={styles.summaryLabel}>Total Tagihan Aktif</Text>
        <Text style={styles.summaryValue}>{formatRp(totalTagihan)}</Text>
        <Text style={styles.summaryNote}>
          {pendingBills.length} pesanan sedang diproses
        </Text>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={18} color="#0284C7" />
        <Text style={styles.infoText}>
          Tagihan menampilkan pesanan yang masih dalam proses dan belum diselesaikan oleh penjual.
        </Text>
      </View>

      {/* Bill List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Detail Tagihan</Text>
      </View>

      {pendingBills.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={60} color="#10B981" />
          <Text style={styles.emptyTitle}>Tidak Ada Tagihan</Text>
          <Text style={styles.emptyText}>Semua pesanan Anda sudah diselesaikan 🎉</Text>
        </View>
      ) : (
        <FlatList
          data={pendingBills}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.billItem}
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
              <View style={styles.billLeft}>
                <View style={styles.billIconWrapper}>
                  <Ionicons name="time" size={20} color="#F59E0B" />
                </View>
                <View style={styles.billInfo}>
                  <Text style={styles.billTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.billDate}>{item.date} • {item.otherUser}</Text>
                </View>
              </View>
              <View style={styles.billRight}>
                <Text style={styles.billAmount}>{item.price}</Text>
                <View style={styles.billStatusBadge}>
                  <Text style={styles.billStatusText}>Proses</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
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
    backgroundColor: '#E11D48',
    paddingTop: 50,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  summaryCard: {
    backgroundColor: '#E11D48',
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
  summaryValue: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 6 },
  summaryNote: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  infoText: { fontSize: 12, color: '#0369A1', marginLeft: 8, flex: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 6 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  billItem: {
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
  billLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  billIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billInfo: { flex: 1 },
  billTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 3 },
  billDate: { fontSize: 12, color: '#94A3B8' },
  billRight: { alignItems: 'flex-end', marginLeft: 10 },
  billAmount: { fontSize: 14, fontWeight: '700', color: '#E11D48', marginBottom: 4 },
  billStatusBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  billStatusText: { fontSize: 11, fontWeight: '600', color: '#F59E0B' },
});
