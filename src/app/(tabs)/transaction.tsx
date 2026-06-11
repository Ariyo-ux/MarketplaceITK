import { View, Text, StyleSheet } from 'react-native';

export default function TransactionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction</Text>
      <Text style={styles.subtitle}>Belum ada riwayat transaksi.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
});
