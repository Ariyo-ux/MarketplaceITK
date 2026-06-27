import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTransaction } from '../context/TransactionContext';
import { useOrders } from '../context/OrderContext';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { transactions, refundBalance, cancelTransaction } = useTransaction();
  const { buyerOrders, sellerOrders, acceptOrder, rejectOrder } = useOrders();

  const { id, title, price, image, type, otherUser, date, isFirebase } = params;

  // Temukan transaksi terbaru dari context jika ada (untuk mendapatkan status terbaru)
  let currentTransaction: any = null;
  
  if (isFirebase === 'true') {
    if (type === 'Beli') {
      currentTransaction = buyerOrders.find(o => o.id === id);
    } else if (type === 'Jual') {
      currentTransaction = sellerOrders.find(o => o.id === id);
    }
  } else {
    currentTransaction = transactions.find(t => t.id === id);
  }

  const status = currentTransaction ? currentTransaction.status : params.status;
  
  const priceNum = currentTransaction 
    ? (currentTransaction.totalPrice || currentTransaction.priceNum) 
    : parseInt((price as string).replace(/[^0-9]/g, ''));

  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  const cancelReasons = [
    'Berubah pikiran',
    'Penjual tidak merespon',
    'Menemukan barang lebih murah',
    'Salah pilih barang/ukuran',
    'Lainnya'
  ];

  const handleAcceptOrder = () => {
    Alert.alert(
      "Terima Pesanan",
      "Apakah Anda yakin ingin menerima pesanan ini? Saldo penjualan akan langsung masuk ke akun Anda.",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Terima", 
          onPress: async () => {
            if (isFirebase === 'true') {
              await acceptOrder(id as string);
              refundBalance(priceNum, `Penjualan: ${title}`);
            }
            Alert.alert("Berhasil", "Pesanan telah diterima. Saldo telah masuk ke akun Anda.", [
              { text: "OK", onPress: () => router.back() }
            ]);
          }
        }
      ]
    );
  };

  const handleCancelOrder = async () => {
    if (!selectedReason) {
      Alert.alert('Pilih Alasan', 'Silakan pilih alasan pembatalan pesanan terlebih dahulu.');
      return;
    }

    if (isFirebase === 'true') {
      // 1. Batalkan pesanan di Firebase (jika pembeli atau penjual membatalkan, rejectOrder yang urus stocknya)
      await rejectOrder(id as string);
      
      // 2. Refund saldo ke pembeli (jika user adalah pembeli)
      if (type === 'Beli') {
        refundBalance(priceNum);
      }
    } else {
      // 1. Batalkan transaksi di local context
      cancelTransaction(id as string, selectedReason);
      
      // 2. Refund saldo local
      refundBalance(priceNum);
      
      // 3. Kembalikan stock produk di Firebase berdasarkan productId
      if (currentTransaction?.productId) {
        try {
          const prodRef = doc(db, "products", currentTransaction.productId);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const prodData = prodSnap.data();
            const quantityToRestore = currentTransaction.quantity || 1;
            const currentStock = prodData.stock || 0;
            await updateDoc(prodRef, { 
              stock: currentStock + quantityToRestore,
              status: 'active' 
            });
          }
        } catch (error) {
          console.error("Error restoring product stock:", error);
        }
      }
    }

    setCancelModalVisible(false);
    Alert.alert('Pesanan Dibatalkan', `Pesanan berhasil dibatalkan. Saldo sebesar Rp ${priceNum.toLocaleString('id-ID')} telah dikembalikan.`);
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Selesai': return '#4CAF50';
      case 'Proses': return '#FF9800';
      case 'Dibatalkan': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusBgColor = (s: string) => {
    switch (s) {
      case 'Selesai': return '#E8F5E9';
      case 'Proses': return '#FFF3E0';
      case 'Dibatalkan': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Transaksi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status Transaksi</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(status as string) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(status as string) }]}>{status}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>No. Invoice</Text>
            <Text style={styles.detailValue}>{id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tanggal Pembelian</Text>
            <Text style={styles.detailValue}>{date}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Detail Produk</Text>
          <View style={styles.productInfo}>
            <Image source={{ uri: image as string }} style={styles.productImage} />
            <View style={styles.productTextContainer}>
              <Text style={styles.productTitle} numberOfLines={2}>{title}</Text>
              <Text style={styles.productType}>Jenis: {type}</Text>
              <Text style={styles.productPrice}>{price}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informasi {type === 'Jual' ? 'Pembeli' : 'Penjual'}</Text>
          <View style={styles.userRow}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={20} color="#007AFF" />
            </View>
            <Text style={styles.userName}>{otherUser}</Text>
            <TouchableOpacity style={styles.chatButton}>
              <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Metode Pembayaran</Text>
            <Text style={styles.detailValue}>Saldo ITK Market</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Harga</Text>
            <Text style={styles.detailValue}>{price}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.totalPaymentLabel}>Total Belanja</Text>
            <Text style={styles.totalPaymentValue}>{price}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Kembali ke Transaksi</Text>
        </TouchableOpacity>

        {/* Tombol Batalkan Pesanan hanya untuk Pembeli saat status Proses */}
        {type === 'Beli' && status === 'Proses' && (
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => setCancelModalVisible(true)}
          >
            <Text style={styles.cancelButtonText}>Batalkan Pesanan</Text>
          </TouchableOpacity>
        )}

        {/* Tombol Terima Pesanan untuk Penjual saat status Proses */}
        {type === 'Jual' && status === 'Proses' && (
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: '#4CAF50', marginTop: 12 }]} 
            onPress={handleAcceptOrder}
          >
            <Text style={styles.primaryButtonText}>Terima Pesanan (ACC)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal Batalkan Pesanan */}
      <Modal
        visible={isCancelModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Batalkan Pesanan</Text>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Pilih alasan pembatalan pesanan:</Text>
            
            <ScrollView style={styles.reasonList}>
              {cancelReasons.map((reason, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.reasonItem, selectedReason === reason && styles.reasonItemSelected]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextSelected]}>{reason}</Text>
                  {selectedReason === reason && (
                    <Ionicons name="checkmark-circle" size={20} color="#1877F2" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalSubmitButton, !selectedReason && styles.modalSubmitButtonDisabled]} 
              onPress={handleCancelOrder}
              disabled={!selectedReason}
            >
              <Text style={styles.modalSubmitButtonText}>Konfirmasi Pembatalan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  productInfo: {
    flexDirection: 'row',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  productTextContainer: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  productType: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1877F2',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
    flex: 1,
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: '#1877F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  totalPaymentLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  totalPaymentValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1877F2',
  },
  primaryButton: {
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  reasonList: {
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  reasonItemSelected: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  reasonTextSelected: {
    color: '#1877F2',
    fontWeight: '600',
  },
  modalSubmitButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: '#FFCDD2',
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
