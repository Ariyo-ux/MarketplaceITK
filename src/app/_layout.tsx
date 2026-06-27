import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import { TransactionProvider } from '../context/TransactionContext';
import { SavedProvider } from '../context/SavedContext';
import { OrderProvider } from '../context/OrderContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <TransactionProvider>
        <OrderProvider>
          <SavedProvider>
            <ChatProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="product/[id]" options={{ title: 'Detail Produk' }} />
                <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="checkout" options={{ headerShown: false }} />
                <Stack.Screen name="order-success" options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="transaction-detail" options={{ headerShown: false }} />
                <Stack.Screen name="saldo" options={{ headerShown: false }} />
                <Stack.Screen name="tagihan" options={{ headerShown: false }} />
                <Stack.Screen name="pembayaran" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="register" options={{ headerShown: false, presentation: 'modal' }} />
              </Stack>
            </ChatProvider>
          </SavedProvider>
        </OrderProvider>
      </TransactionProvider>
    </AuthProvider>
  );
}
