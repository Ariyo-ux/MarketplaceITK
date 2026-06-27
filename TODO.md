# TODO - Fix Android build failed

- [x] Ganti placeholder Google Maps API key di `app.json` dan `AndroidManifest.xml` (diisi kosong untuk mencegah crash plugin saat placeholder).
- [ ] Jalankan `npx expo prebuild --platform android`.
- [ ] Jalankan `npx expo run:android --variant=debug`.
- [ ] Jika masih gagal, ambil 10-30 baris terakhir log Gradle dari Expo build dan kirim ke chat untuk dilakukan koreksi lanjutan.
