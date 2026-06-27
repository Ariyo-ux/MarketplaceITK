import React, { createContext, useState, useContext, useEffect } from 'react';

type Message = {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  product?: {
    name: string;
    price: string | number;
    image: string;
  };
};

type ChatHistoryItem = {
  id: string;
  name: string;
  message: string;
  time: string;
  unreadCount: number;
  online: boolean;
  avatar: string;
  read: boolean;
};

type ChatContextType = {
  chatList: ChatHistoryItem[];
  getMessages: (userId: string) => Message[];
  sendMessage: (userId: string, name: string, text: string, product?: Message['product']) => void;
  markAsRead: (userId: string) => void;
  simulateIncomingOrder: (productName: string, price: number, image: string, buyerName?: string, buyerId?: string) => void;
};

const INITIAL_CHATS: ChatHistoryItem[] = [
  {
    id: '1',
    name: 'Ahmad Subarjo',
    message: 'Apakah bukunya masih tersedia kak? Saya...',
    time: '10:24',
    unreadCount: 2,
    online: true,
    avatar: 'https://i.pravatar.cc/150?img=11',
    read: false,
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    message: 'Oke kak, nanti sore jam 4 di Gedung C ya.',
    time: 'Yesterday',
    unreadCount: 0,
    read: true,
    online: false,
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: 'm1', text: 'Halo kak, apakah barangnya masih ada?', sender: 'other', time: '10:20' },
    { id: 'm2', text: 'Apakah bukunya masih tersedia kak? Saya...', sender: 'other', time: '10:24' },
  ],
  '2': [
    { id: 'm3', text: 'Bisa COD?', sender: 'other', time: 'Kemarin' },
    { id: 'm4', text: 'Bisa kak.', sender: 'me', time: 'Kemarin', status: 'read' },
    { id: 'm5', text: 'Oke kak, nanti sore jam 4 di Gedung C ya.', sender: 'other', time: 'Kemarin' },
  ]
};

export const ChatContext = createContext<ChatContextType>({} as ChatContextType);

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [chatList, setChatList] = useState<ChatHistoryItem[]>(INITIAL_CHATS);
  const [messagesData, setMessagesData] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);

  const getMessages = (userId: string) => {
    return messagesData[userId] || [];
  };

  const sendMessage = (userId: string, name: string, text: string, product?: Message['product']) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      text,
      sender: 'me',
      time: timeNow,
      status: 'sent',
      product,
    };

    // Update messages to 'sent'
    setMessagesData((prev) => {
      const userMessages = prev[userId] || [];
      return {
        ...prev,
        [userId]: [...userMessages, newMessage],
      };
    });

    // Update chat list history
    setChatList((prev) => {
      const existingIndex = prev.findIndex(c => c.id === userId);
      const updatedList = [...prev];
      
      if (existingIndex >= 0) {
        const chat = updatedList[existingIndex];
        chat.message = text;
        chat.time = timeNow;
        chat.read = true;
        chat.unreadCount = 0;
        // Move to top
        updatedList.splice(existingIndex, 1);
        updatedList.unshift(chat);
      } else {
        updatedList.unshift({
          id: userId,
          name: name,
          message: text,
          time: timeNow,
          unreadCount: 0,
          online: true,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          read: true,
        });
      }
      return updatedList;
    });

    // Simulate 'delivered' after 800ms
    setTimeout(() => {
      setMessagesData((prev) => {
        const userMessages = prev[userId] || [];
        const msgIndex = userMessages.findIndex(m => m.id === messageId);
        if (msgIndex >= 0) {
          const updatedMessages = [...userMessages];
          updatedMessages[msgIndex] = { ...updatedMessages[msgIndex], status: 'delivered' };
          return { ...prev, [userId]: updatedMessages };
        }
        return prev;
      });
    }, 800);

    // Simulate 'read' after 2000ms
    setTimeout(() => {
      setMessagesData((prev) => {
        const userMessages = prev[userId] || [];
        const msgIndex = userMessages.findIndex(m => m.id === messageId);
        if (msgIndex >= 0) {
          const updatedMessages = [...userMessages];
          updatedMessages[msgIndex] = { ...updatedMessages[msgIndex], status: 'read' };
          return { ...prev, [userId]: updatedMessages };
        }
        return prev;
      });
    }, 2000);
  };

  const simulateIncomingOrder = (productName: string, price: number, image: string, buyerName?: string, buyerId?: string) => {
    const actualBuyerId = buyerId || 'budi_santoso';
    const actualBuyerName = buyerName || 'Budi Santoso';
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageId = Date.now().toString();
    const textMsg = `Halo kak, saya ${actualBuyerName} sudah melakukan pembayaran untuk produk "${productName}". Tolong segera diproses ya!`;
    
    const newMessage: Message = {
      id: messageId,
      text: textMsg,
      sender: 'other',
      time: timeNow,
      product: {
        name: productName,
        price: `Rp ${price.toLocaleString('id-ID')}`,
        image: image,
      }
    };

    setMessagesData((prev) => {
      const userMessages = prev[actualBuyerId] || [];
      return {
        ...prev,
        [actualBuyerId]: [...userMessages, newMessage],
      };
    });

    setChatList((prev) => {
      const existingIndex = prev.findIndex(c => c.id === actualBuyerId);
      const updatedList = [...prev];
      
      if (existingIndex >= 0) {
        const chat = updatedList[existingIndex];
        chat.message = textMsg;
        chat.time = timeNow;
        chat.read = false;
        chat.unreadCount += 1;
        updatedList.splice(existingIndex, 1);
        updatedList.unshift(chat);
      } else {
        updatedList.unshift({
          id: actualBuyerId,
          name: actualBuyerName,
          message: textMsg,
          time: timeNow,
          unreadCount: 1,
          online: true,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(actualBuyerName)}&background=random`,
          read: false,
        });
      }
      return updatedList;
    });
  };

  const markAsRead = (userId: string) => {
    setChatList((prev) => {
      const existingIndex = prev.findIndex(c => c.id === userId);
      if (existingIndex >= 0 && prev[existingIndex].unreadCount > 0) {
        const updatedList = [...prev];
        updatedList[existingIndex].unreadCount = 0;
        updatedList[existingIndex].read = true;
        return updatedList;
      }
      return prev;
    });
  };

  return (
    <ChatContext.Provider value={{ chatList, getMessages, sendMessage, markAsRead, simulateIncomingOrder }}>
      {children}
    </ChatContext.Provider>
  );
};
