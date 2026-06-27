import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTransaction } from '../context/TransactionContext';

export default function SaldoScreen() {
  const router = useRouter();
  const { balance, balanceHistory } = useTransaction();

  const formatRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    }) + ', ' + d.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saldo Saya</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Saldo</Text>
        <Text style={styles.balanceValue}>{formatRp(balance)}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceStat}>
            <Ionicons name="arrow-down-circle" size={18} color="#10B981" />
            <Text style={styles.balanceStatLabel}> Pemasukan</Text>
          </View>
          <View style={styles.balanceStat}>
            <Ionicons name="arrow-up-circle" size={18} color="#EF4444" />
            <Text style={styles.balanceStatLabel}> Pengeluaran</Text>
          </View>
        </View>
      </View>

      {/* History */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Riwayat Saldo</Text>
      </View>

      {balanceHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={60} color="#CBD5E1" />
          <Text style={styles.emptyText}>Belum ada riwayat saldo</Text>
        </View>
      ) : (
        <FlatList
          data={balanceHistory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View style={[
                styles.historyIcon,
                { backgroundColor: item.type === 'masuk' ? '#DCFCE7' : '#FEE2E2' }
              ]}>
                <Ionicons
                  name={item.type === 'masuk' ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={item.type === 'masuk' ? '#16A34A' : '#EF4444'}
                />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyDesc}>{item.description}</Text>
                <Text style={styles.historyDate}>{formatDateTime(item.timestamp)}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={[
                  styles.historyAmount,
                  { color: item.type === 'masuk' ? '#16A34A' : '#EF4444' }
                ]}>
                  {item.type === 'masuk' ? '+' : '-'}{formatRp(item.amount)}
                </Text>
                <Text style={styles.historyBalance}>Sisa: {formatRp(item.balanceAfter)}</Text>
              </View>
            </View>
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
    backgroundColor: '#0284C7',
    paddingTop: 50,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  balanceCard: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  balanceValue: { fontSize: 32, fontWeight: '900', color: '#FFF', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', gap: 24 },
  balanceStat: { flexDirection: 'row', alignItems: 'center' },
  balanceStatLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#94A3B8', marginTop: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: { flex: 1 },
  historyDesc: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 3 },
  historyDate: { fontSize: 12, color: '#94A3B8' },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  historyBalance: { fontSize: 11, color: '#94A3B8' },
});
