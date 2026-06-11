export type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  seller: string;
  condition?: string;
  description?: string;
  phone?: string;
};

export const DUMMY_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Buku Kalkulus Edisi 9',
    price: 150000,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
    category: 'Buku',
    seller: 'Ariyo Arianto',
    condition: 'Bekas - Sangat Baik',
    description: 'Buku Kalkulus edisi 9 karangan Purcell. Kondisi masih sangat mulus, tidak ada coretan sama sekali. Cocok untuk mahasiswa TPB ITK. Harga pas, tidak bisa nego.',
    phone: '6281234567890'
  },
  {
    id: '2',
    title: 'Laptop ASUS ROG',
    price: 8500000,
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=800&auto=format&fit=crop',
    category: 'Elektronik',
    seller: 'Zuda Ersa Hidayat',
    condition: 'Bekas - Baik',
    description: 'Laptop gaming ASUS ROG. Pemakaian wajar untuk nugas dan main game tipis-tipis. Baterai masih awet 3-4 jam. Kelengkapan: Laptop, Charger original, Dusbook. Boleh nego bensin.',
    phone: '6281234567890'
  },
  {
    id: '3',
    title: 'Jasa Desain Poster',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop',
    category: 'Jasa',
    seller: 'Ismail',
    condition: 'Baru',
    description: 'Menerima jasa desain poster untuk kegiatan himpunan, UKM, atau tugas kuliah. Revisi maksimal 3 kali. Pengerjaan 1-2 hari tergantung tingkat kesulitan.',
    phone: '6281234567890'
  },
  {
    id: '4',
    title: 'Nasi Padang Warung Ara',
    price: 15000,
    image: 'https://i.pinimg.com/736x/f1/f4/5e/f1f45ed44221431b0ed8b0d85f817dc1.jpg',
    category: 'Makanan',
    seller: 'Warung Ara',
    condition: 'Baru',
    description: 'Nasi Padang autentik dengan bumbu rempah asli Minang. Disajikan lengkap dengan kuah gulai kental, sayur nangka, daun singkong, dan sambal hijau yang nendang. Pilihan lauk melimpah, mulai dari Rendang daging sapi empuk, Ayam Pop gurih, hingga Gulai Tunjang yang lembut. Bisa delivery area sekitar kos.',
    phone: '6281234567890'
  }
];
