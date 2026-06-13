import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Buku', 'Elektronik', 'Jasa', 'Makanan', 'Pakaian', 'Kos & Kontrak', 'Lainnya'];
const CONDITIONS = ['Baru', 'Bekas - Sangat Baik', 'Bekas - Baik', 'Bekas - Cukup'];

export default function AddProductScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);

  // Pilih foto dari galeri
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Aplikasi membutuhkan izin akses galeri foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,          // kompres otomatis ke 40%
      base64: true,           // dapatkan base64 untuk disimpan ke Firestore
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPrice('');
    setDescription('');
    setCategory('');
    setCondition('');
    setImageUri(null);
    setImageBase64(null);
  };

  const handleSubmit = async () => {
    if (!title || !price || !description || !category || !condition) {
      Alert.alert('Form Belum Lengkap', 'Mohon isi semua field yang diperlukan.');
      return;
    }
    if (!imageBase64) {
      Alert.alert('Foto Belum Ada', 'Mohon pilih foto produk terlebih dahulu.');
      return;
    }

    const priceNum = parseInt(price.replace(/\D/g, ''), 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Harga Tidak Valid', 'Masukkan harga yang valid.');
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        title: title.trim(),
        price: priceNum,
        description: description.trim(),
        category,
        condition,
        imageBase64: `data:image/jpeg;base64,${imageBase64}`,
        sellerId: user!.id,
        sellerName: user!.name,
        sellerPhone: user!.phone || '',
        sellerNim: user!.nim || '',
        status: 'active',
        createdAt: serverTimestamp(),
      });

      Alert.alert('Berhasil! 🎉', 'Produkmu sudah diposting dan bisa dilihat oleh mahasiswa ITK lainnya.', [
        { text: 'OK', onPress: resetForm },
      ]);
    } catch (error) {
      console.error('Error posting product:', error);
      Alert.alert('Gagal Posting', 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format harga dengan pemisah ribuan
  const handlePriceChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const formatted = digits ? parseInt(digits, 10).toLocaleString('id-ID') : '';
    setPrice(formatted);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.unauthContainer}>
          <Ionicons name="cart-outline" size={100} color="#CCCCCC" />
          <Text style={styles.unauthTitle}>Mulai Berjualan!</Text>
          <Text style={styles.unauthSubtitle}>
            Anda harus masuk atau mendaftar terlebih dahulu sebelum bisa menjual produk.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
            <Text style={styles.primaryButtonText}>Masuk</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isFormValid = title && price && description && category && condition && imageBase64;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Jual Barang Baru</Text>
          <Text style={styles.headerSubtitle}>Tawarkan barangmu ke mahasiswa ITK lainnya</Text>
        </View>

        {/* Upload Foto */}
        <TouchableOpacity style={styles.imageUpload} onPress={pickImage} activeOpacity={0.7}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <View style={styles.changePhotoOverlay}>
                <Ionicons name="camera" size={20} color="#FFF" />
                <Text style={styles.changePhotoText}>Ganti Foto</Text>
              </View>
            </>
          ) : (
            <>
              <Ionicons name="camera-outline" size={40} color="#007AFF" />
              <Text style={styles.imageUploadText}>Upload Foto Produk</Text>
              <Text style={styles.imageUploadHint}>Tap untuk pilih dari galeri</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Nama Produk */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Produk <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Cth: Buku Kalkulus Purcell Edisi 9"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Harga */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Harga (Rp) <Text style={styles.required}>*</Text></Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              keyboardType="numeric"
              value={price}
              onChangeText={handlePriceChange}
            />
          </View>
        </View>

        {/* Kategori */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Kategori <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowCategoryModal(true)}>
            <Text style={[styles.dropdownText, !category && styles.dropdownPlaceholder]}>
              {category || 'Pilih Kategori'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Kondisi */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Kondisi <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowConditionModal(true)}>
            <Text style={[styles.dropdownText, !condition && styles.dropdownPlaceholder]}>
              {condition || 'Pilih Kondisi Barang'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Deskripsi */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Deskripsi <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Jelaskan kondisi barang, kelengkapan, cara bertemu, dll."
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!isFormValid || isLoading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Posting Produk</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Kategori */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pilih Kategori</Text>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.modalOption, category === cat && styles.modalOptionSelected]}
                onPress={() => { setCategory(cat); setShowCategoryModal(false); }}
              >
                <Text style={[styles.modalOptionText, category === cat && styles.modalOptionTextSelected]}>
                  {cat}
                </Text>
                {category === cat && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Kondisi */}
      <Modal visible={showConditionModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowConditionModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Kondisi Barang</Text>
            {CONDITIONS.map((cond) => (
              <TouchableOpacity
                key={cond}
                style={[styles.modalOption, condition === cond && styles.modalOptionSelected]}
                onPress={() => { setCondition(cond); setShowConditionModal(false); }}
              >
                <Text style={[styles.modalOptionText, condition === cond && styles.modalOptionTextSelected]}>
                  {cond}
                </Text>
                {condition === cond && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  imageUpload: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  changePhotoText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  imageUploadText: {
    marginTop: 10,
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  imageUploadHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333333',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 14,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333333',
  },
  dropdownPlaceholder: {
    color: '#AAAAAA',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0CFFF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Unauth
  unauthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unauthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
  },
  modalOptionSelected: {
    backgroundColor: '#EEF5FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  modalOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
