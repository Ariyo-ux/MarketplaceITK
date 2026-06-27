import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTransaction } from '../context/TransactionContext';
import { useOrders } from '../context/OrderContext';
import { db } from '../config/firebase';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { balance, deductBalance, addTransaction } = useTransaction();
  const { createOrder } = useOrders();
  const params = useLocalSearchParams();

  const { productId, title, price, imageBase64, sellerName, sellerId, stock } = params;
  const priceNum = Number(price) || 0;
  const currentStock = Number(stock) || 1;

  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'transfer'>('saldo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const formatRp = (n: number) =>
    'Rp ' + n.toLocaleString('id-ID');

  const serviceFee = 2000;
  const totalPayment = (priceNum * quantity) + serviceFee;

  const handlePay = () => {
    if (paymentMethod === 'saldo' && balance < totalPayment) {
      Alert.alert('Saldo Tidak Cukup', `Saldo Anda ${formatRp(balance)} tidak mencukupi untuk membayar ${formatRp(totalPayment)}.`);
      return;
    }

    const doCheckout = async () => {
      setIsProcessing(true);
      try {
        // Kurangi saldo
        deductBalance(totalPayment);
        // Update Firebase stock
        const remainingStock = currentStock - quantity;
        if (remainingStock <= 0) {
          updateDoc(doc(db, 'products', productId as string), {
            stock: 0,
            status: 'sold'
          }).catch(console.error);
        } else {
          updateDoc(doc(db, 'products', productId as string), {
            stock: remainingStock
          }).catch(console.error);
        }

        // Buat order di Firestore (agar penjual bisa lihat dari akun mereka)
        await createOrder({
          productId: productId as string,
          productTitle: title as string,
          productImage: imageBase64 as string || '',
          productPrice: priceNum,
          quantity: quantity,
          totalPrice: priceNum * quantity,
          buyerId: user?.id || '',
          buyerName: user?.name || 'Pembeli',
          sellerId: sellerId as string || '',
          sellerName: sellerName as string || 'Penjual',
          status: 'Proses',
        });

        // Tambah transaksi lokal (sisi pembeli)
        const newTrx = addTransaction({
          type: 'Beli',
          status: 'Proses',
          title: title as string,
          price: formatRp(priceNum * quantity),
          priceNum: priceNum * quantity,
          image: imageBase64 as string || 'https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=500&q=80',
          otherUser: sellerName as string || 'Penjual',
          productId: productId as string,
          quantity: quantity,
        });

        router.replace({
          pathname: '/order-success',
          params: {
            invoiceId: newTrx.id,
            title: quantity > 1 ? `${title} (${quantity} pcs)` : (title as string),
            price: formatRp(priceNum * quantity),
            totalPayment: formatRp(totalPayment),
            sellerName: sellerName as string,
            date: newTrx.date,
          },
        });
      } catch (error) {
        console.error('Checkout error:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat checkout.');
      } finally {
        setIsProcessing(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Bayar ${formatRp(totalPayment)} untuk "${title}"?`)) {
        doCheckout();
      }
    } else {
      Alert.alert(
        'Konfirmasi Pembayaran',
        `Bayar ${formatRp(totalPayment)} menggunakan ${paymentMethod === 'saldo' ? 'Saldo' : 'Transfer Bank'}?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Bayar Sekarang', onPress: doCheckout },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Ringkasan Produk */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
          <View style={styles.productRow}>
            {imageBase64 ? (
              <Image source={{ uri: imageBase64 as string }} style={styles.productImg} />
            ) : (
              <View style={[styles.productImg, styles.productImgPlaceholder]}>
                <Ionicons name="image-outline" size={28} color="#ccc" />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>{title}</Text>
              <Text style={styles.sellerName}>Penjual: {sellerName}</Text>
              <Text style={styles.productPrice}>{formatRp(priceNum)}</Text>
              
              {currentStock > 1 && (
                <View style={styles.qtyContainer}>
                  <TouchableOpacity 
                    style={styles.qtyBtn} 
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Ionicons name="remove" size={16} color="#0F172A" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <TouchableOpacity 
                    style={styles.qtyBtn} 
                    onPress={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  >
                    <Ionicons name="add" size={16} color="#0F172A" />
                  </TouchableOpacity>
                  <Text style={styles.stockText}>Sisa {currentStock}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Info Pembeli */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Info Pembeli</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={20} color="#64748B" />
            <Text style={styles.infoText}>{user?.name ?? 'Tamu'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={20} color="#64748B" />
            <Text style={styles.infoText}>NIM: {user?.nim ?? '-'}</Text>
          </View>
        </View>

        {/* Metode Pembayaran */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>

          <TouchableOpacity
            style={[styles.methodItem, paymentMethod === 'saldo' && styles.methodSelected]}
            onPress={() => setPaymentMethod('saldo')}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIcon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="wallet" size={22} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.methodLabel}>Saldo ITK Market</Text>
                <Text style={styles.methodBalance}>{formatRp(balance)}</Text>
              </View>
            </View>
            <View style={[styles.radioOuter, paymentMethod === 'saldo' && styles.radioOuterSelected]}>
              {paymentMethod === 'saldo' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodItem, styles.methodDisabled]}
            disabled
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIcon, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="card-outline" size={22} color="#94A3B8" />
              </View>
              <View>
                <Text style={[styles.methodLabel, { color: '#94A3B8' }]}>Transfer Bank</Text>
                <Text style={[styles.methodBalance, { color: '#CBD5E1' }]}>Segera hadir</Text>
              </View>
            </View>
            <View style={styles.radioOuter}>
            </View>
          </TouchableOpacity>
        </View>

        {/* Rincian Biaya */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rincian Biaya</Text>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>
              Harga Barang {quantity > 1 ? `(${quantity} pcs × ${formatRp(priceNum)})` : ''}
            </Text>
            <Text style={styles.feeValue}>{formatRp(priceNum * quantity)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Biaya Layanan</Text>
            <Text style={styles.feeValue}>{formatRp(serviceFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.feeRow}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>{formatRp(totalPayment)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Pay Button */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalSmallLabel}>Total Bayar</Text>
          <Text style={styles.totalBigValue}>{formatRp(totalPayment)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.payButtonText}>Memproses...</Text>
          ) : (
            <Text style={styles.payButtonText}>Bayar Sekarang</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productImg: {
    width: 72, height: 72, borderRadius: 10, marginRight: 14,
    backgroundColor: '#F1F5F9',
  },
  productImgPlaceholder: {
    justifyContent: 'center', alignItems: 'center',
  },
  productInfo: { flex: 1 },
  productTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  sellerName: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  productPrice: { fontSize: 16, fontWeight: '800', color: '#0056D2' },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginHorizontal: 12,
  },
  stockText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 14, color: '#334155', marginLeft: 10 },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  methodSelected: { borderColor: '#0284C7', backgroundColor: '#F0F9FF' },
  methodDisabled: { backgroundColor: '#F8FAFC', opacity: 0.7 },
  methodLeft: { flexDirection: 'row', alignItems: 'center' },
  methodIcon: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  methodLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  methodBalance: { fontSize: 13, color: '#0284C7', fontWeight: '600', marginTop: 2 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#CBD5E1',
    justifyContent: 'center', alignItems: 'center',
  },
  radioOuterSelected: { borderColor: '#0284C7' },
  radioInner: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#0284C7',
  },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  feeLabel: { fontSize: 14, color: '#64748B' },
  feeValue: { fontSize: 14, color: '#334155', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  totalValue: { fontSize: 15, fontWeight: '800', color: '#0056D2' },
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalSmallLabel: { fontSize: 12, color: '#64748B' },
  totalBigValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  payButton: {
    backgroundColor: '#0056D2',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  payButtonDisabled: { backgroundColor: '#94A3B8' },
  payButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
