import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useChat } from '../../context/ChatContext';

export default function ChatScreen() {
  const router = useRouter();
  const { id, name, productName, productImage, productPrice, initialMessage } = useLocalSearchParams(); // ID dan Nama penjual/lawan bicara
  const { getMessages, sendMessage } = useChat();
  const messages = getMessages(id as string);
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(true); // default true untuk dummy
  const [attachedProduct, setAttachedProduct] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // Set initial text and attached product if it changes (e.g. navigation params update)
  useEffect(() => {
    if (initialMessage && typeof initialMessage === 'string' && messages.length === 0) {
      setInputText(initialMessage);
      if (productName) {
        setAttachedProduct({
          name: productName as string,
          price: productPrice as string,
          image: productImage as string,
        });
      }
    }
  }, [initialMessage]);

  useEffect(() => {
    if (id && typeof id === 'string' && id.length > 10) {
      const unsub = onSnapshot(doc(db, 'users', id), (docSnap) => {
        if (docSnap.exists()) {
          setIsOnline(docSnap.data().isOnline === true);
        }
      });
      return () => unsub();
    }
  }, [id]);

  const handleSend = () => {
    if (inputText.trim() === '' && !attachedProduct) return;
    sendMessage(id as string, name as string || 'Penjual', inputText, attachedProduct);
    setInputText('');
    setAttachedProduct(null);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, [messages.length]);

  const renderAttachedProduct = () => {
    if (!attachedProduct) return null;
    return (
      <View style={styles.attachedProductBanner}>
        <View style={styles.attachedProductContent}>
          {attachedProduct.image ? (
            <Image source={{ uri: attachedProduct.image }} style={styles.attachedProductImage} />
          ) : (
            <View style={[styles.attachedProductImage, { backgroundColor: '#ccc' }]} />
          )}
          <View style={styles.attachedProductInfo}>
            <Text style={styles.attachedProductName} numberOfLines={1}>{attachedProduct.name}</Text>
            <Text style={styles.attachedProductPrice}>Rp {Number(attachedProduct.price || 0).toLocaleString('id-ID')}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeProductButton} onPress={() => setAttachedProduct(null)}>
          <Ionicons name="close-circle" size={24} color="#888" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageOther]}>
        {item.product && (
          <View style={styles.messageProductCard}>
            {item.product.image ? (
              <Image source={{ uri: item.product.image }} style={styles.messageProductImage} />
            ) : (
              <View style={[styles.messageProductImage, { backgroundColor: '#ccc' }]} />
            )}
            <View style={styles.messageProductInfo}>
              <Text style={styles.messageProductName} numberOfLines={2}>{item.product.name}</Text>
              <Text style={styles.messageProductPrice}>Rp {Number(item.product.price || 0).toLocaleString('id-ID')}</Text>
            </View>
          </View>
        )}
        {item.text ? <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>{item.text}</Text> : null}
        <View style={styles.timeContainer}>
          <Text style={[styles.messageTime, isMe ? styles.timeMe : styles.timeOther]}>{item.time}</Text>
          {isMe && (
            <Ionicons 
              name={item.status === 'sent' ? 'checkmark' : 'checkmark-done'} 
              size={14} 
              color={item.status === 'read' ? '#4D94FF' : 'rgba(255, 255, 255, 0.7)'} 
              style={{ marginLeft: 4, marginTop: 4 }} 
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/mail")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{name || 'Penjual'}</Text>
            <Text style={[styles.headerStatus, !isOnline && { color: '#888' }]}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
          <Ionicons name="ellipsis-vertical" size={24} color="#1A1A1A" />
        </View>

        {/* Chat List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input Area */}
        <View style={styles.inputWrapper}>
          {renderAttachedProduct()}
          <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={28} color="#888" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Ketik pesan..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, (inputText.trim() || attachedProduct) ? styles.sendButtonActive : null]}
            onPress={handleSend}
            disabled={!inputText.trim() && !attachedProduct}
          >
            <Ionicons name="send" size={20} color={(inputText.trim() || attachedProduct) ? '#FFF' : '#888'} />
          </TouchableOpacity>
        </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerStatus: {
    fontSize: 13,
    color: '#4CAF50',
  },
  chatList: {
    padding: 16,
    flexGrow: 1,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  attachedProductBanner: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attachedProductContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachedProductImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
  },
  attachedProductInfo: {
    flex: 1,
  },
  attachedProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  attachedProductPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0056D2',
  },
  closeProductButton: {
    padding: 4,
  },
  messageProductCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  messageProductImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    marginRight: 10,
  },
  messageProductInfo: {
    flex: 1,
  },
  messageProductName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  messageProductPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0056D2',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  messageMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#1877F2',
    borderBottomRightRadius: 4,
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  textMe: {
    color: '#FFFFFF',
  },
  textOther: {
    color: '#1A1A1A',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeOther: {
    color: '#888888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButtonActive: {
    backgroundColor: '#1877F2',
  },
});
