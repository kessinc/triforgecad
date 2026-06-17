# TriForge CAD Pro 3.0 Kullanım Kılavuzu

TriForge CAD Pro 3.0, tarayıcınız üzerinde çalışan güçlü bir 3D modelleme ve CAD tasarım platformudur. Bu kılavuz, uygulamanın tüm özelliklerini, araçlarını ve Blender benzeri kısayollarını detaylı şekilde açıklamakta ve tasarımlarınızı en verimli şekilde hayata geçirmenizi sağlamaktadır.

---

## 📌 İçindekiler
1. [Kullanıcı Arayüzü (UI) Genel Bakış](#1-kullanıcı-arayüzü-ui-genel-bakış)
2. [Kamera ve Sahne Navigasyonu](#2-kamera-ve-sahne-navigasyonu)
3. [Temel Nesne İşlemleri (Transform)](#3-temel-nesne-işlemleri-transform)
4. [Low-Poly Oyun Geometrisi Eklemek](#4-low-poly-oyun-geometrisi-eklemek)
5. [Blender Tarzı Yoğurma / Heykel (Sculpt) Modu](#5-blender-tarzı-yoğurma--heykel-sculpt-modu)
6. [2D Çizim (Sketch) ve 3D'ye Dönüştürme](#6-2d-çizim-sketch-ve-3dye-dönüştürme)
7. [Gelişmiş İşlemler (Modifiyeler ve Boolean)](#7-gelişmiş-işlemler-modifiyeler-ve-boolean)
8. [Dosya Kaydetme, Açma ve Aktarma](#8-dosya-kaydetme-açma-ve-aktarma)
9. [Klavye Kısayolları Tablosu](#9-klavye-kısayolları-tablosu)

---

## 1. Kullanıcı Arayüzü (UI) Genel Bakış

Arayüz 6 ana bölgeye ayrılmıştır:
- **Üst Menü Barı (Menubar):** Dosya açma, kaydetme, geri/ileri alma, hizalama (snap), export (STL/OBJ) ve kamera görünüm ayarları.
- **Sol Dikey Araç Çubuğu (Left Toolbar):** Temel transform araçları (Seç, Taşı, Döndür, Ölçekle), 2D çizim araçları, ölçüm ve odaklanma araçları.
- **Sol Panel:** Hazır şekiller (Temel, Gelişmiş, Mimari, Oyun), Boolean/Modifiye işlemleri, Sahne Hiyerarşisi (Outliner) ve Render ayarları.
- **Orta Çalışma Alanı (Viewport Canvas):** 3D sahnenizin görüntülendiği, nesnelerin düzenlendiği ana 3D canvas alanıdır.
- **Sağ Müfettiş Paneli (Inspector):** Seçili olan nesnenin konum, dönüşüm, ölçek, malzeme (renk, metaliklik vb.) ve geometri parametrelerinin düzenlendiği bölümdür.
- **Alt Durum Çubuğu (Status Bar):** O andaki durumu, seçili objenin adını ve anlık transform verilerini gösterir.

---

## 2. Kamera ve Sahne Navigasyonu

Sahneyi serbestçe incelemek için farenizi ve aşağıdaki kısayolları kullanabilirsiniz:
- **Kamerayı Döndürmek (Orbit):** Canvas alanında **Sol Tık** yapıp fareyi sürükleyin. (Veya farenin tekerleğine basılı tutarak).
- **Sahneyi Kaydırmak (Pan):** **Sağ Tık** yapıp basılı tutarak fareyi sürükleyin (Veya `Shift + Sol Tık`).
- **Yakınlaşma / Uzaklaşma (Zoom):** Farenizin **Tekerleğini** (Scroll) ileri-geri kaydırın.
- **Hazır Kamera Açıları:** Üst menü barında sağda yer alan "Persp", "Üst", "Ön", "Sağ", "Sol" butonlarına tıklayarak veya klavyedeki `1` (Ön), `3` (Sağ), `7` (Üst) rakamlarına basarak kamerayı sabitleyebilirsiniz.
- **Nesneye Odaklanma:** Sahnede kaybolduğunuzda veya seçili objeyi merkeze almak istediğinizde klavyeden `F` tuşuna basın.

---

## 3. Temel Nesne İşlemleri (Transform)

Sahnede nesneleri hareket ettirmek ve şekillendirmek için 4 ana mod bulunur. Sol araç çubuğundan veya klavyedeki kısayollarla geçiş yapabilirsiniz:
1. **Seçim Modu (`Q`):** Nesnelere tıklayarak seçebilir, sağ panelden özelliklerini görebilirsiniz.
2. **Taşıma Modu (`W` veya `G`):** Nesne üzerinde beliren **kırmızı (X), yeşil (Y) ve mavi (Z)** okları çekerek nesneyi hareket ettirebilirsiniz.
3. **Döndürme Modu (`E`):** Nesne etrafındaki çemberleri çevirerek nesneyi kendi ekseninde döndürebilirsiniz.
4. **Ölçekleme Modu (`R`):** Beliren küpleri çekerek nesneyi büyütebilir veya küçültebilirsiniz. Sağ panelden "Orantılı" seçeneği işaretliyse nesne her yöne eşit büyür.

> [!TIP]
> **Hizalama (Snap):** Tasarımlarınızın düzgün birleşmesi için üst menüden **Snap** butonunu aktif edin ve grid aralığını (örn: 1mm, 5mm) seçin. Hareketleriniz otomatik olarak bu aralıklara kilitlenecektir.

---

## 4. Low-Poly Oyun Geometrisi Eklemek

Oyun geliştiricileri ve low-poly (düşük poligonlu) tarzı sevenler için özel şablonlar eklenmiştir. Sol paneldeki **Şekiller** sekmesinde **OYUN GEOMETRİLERİ (LOW-POLY)** başlığı altında bulabilirsiniz:
- **Karakter:** Eklem yerleri belirgin, insan modelleme ve ölçek testi şablonu.
- **Ağaç:** Düşük poligonlu, çizgi film tarzı hazır çam ağacı.
- **Arazi:** Üzerinde engebeleri olan hazır zemin kaplaması.
- **Merdiven:** Belirtilen basamak sayısına göre oluşturulan hazır merdiven geometrisi.
- **Duvar:** Ortasında kapı boşluğu bulunan, modüler duvar parçası.
- **Ev:** Çatısı ve bacası olan low-poly minik kulübe / ev.
- **Kılıç:** Kabzası, siperliği ve keskin ağzı olan low-poly kılıç modeli.
- **Kule:** Burçları olan dairesel kale/savunma kulesi.
- **Kaya:** Doğal görünümlü, köşeli low-poly kaya/boulder parçası.
- **Kalkan:** Dairesel kabartması ve kenarları olan hexagonal low-poly şovalye kalkanı.
- **Sandık:** Gövdesi, kapağı ve ön kilidi bulunan ahşap görünümlü hazine sandığı.
- **Varil:** Dış kasnağı ve demir çemberleri olan low-poly klasik fıçı/varil.

---

## 5. Blender Tarzı Yoğurma / Heykel (Sculpt) Modu

Seçtiğiniz bir nesneyi kilden bir heykel gibi fareyle yoğurmak için Blender'daki heykel fırçalarına benzer bir sistem kullanabilirsiniz:
1. Sahnede düzenlemek istediğiniz nesneyi seçin.
2. Üst menüden **Edit Modu**'na geçin (Veya klavyeden `Tab` tuşuna basın).
3. Sağ paneldeki "Geometri" sekmesinde yer alan **Yoğurma / Şekillendirme** fırça ayarlarını göreceksiniz.
4. Fareyi nesne üzerine basılı tutarak sürüklediğinizde nesne şekil almaya başlar.

### 🖌 Fırça Türleri:
- **Çek / Şişir (Pull):** Fareyi sürüklediğiniz yüzeyi dışa doğru şişirir.
- **İt / Çökert (Push):** Fareyi sürüklediğiniz yüzeyi içe doğru çökertir, oyuk açar.
- **Düzleştir (Smooth):** Yüzeydeki keskin köşeleri yumuşatır, pürüzsüz hale getirir.
- **Kazı / Düzle (Flatten):** Farenin tıkladığı yerdeki yüzey seviyesini baz alarak o bölgeyi düz bir düzleme dönüştürür (düz zemin yapmak için idealdir).
- **Orjinale Döndür / Sil (Revert):** Yaptığınız değişiklikleri silerek, fırçanın değdiği kısımları nesnenin ilk oluşturulduğu ham haline geri döndürür (bir nevi **silgi** görevi görür).

### ⚙ Fırça Ayarları:
- **Fırça Boyutu:** Yoğurma alanının genişliğini belirler.
- **Fırça Gücü:** Yoğurmanın ne kadar hızlı ve sert uygulanacağını kontrol eder.

---

## 6. 2D Çizim (Sketch) ve 3D'ye Dönüştürme

Serbestçe 2D çizgiler çizip bunları tek tıkla 3D katı nesnelere dönüştürebilirsiniz:
1. Üst menüden veya klavyeden `Ctrl+K` ile **Çizim Modu**'na girin.
2. Sol araç çubuğundaki Çizim butonlarından birini seçin (Çizik, Dikdörtgen, Daire, Yıldız vb.).
3. Çizim Düzlemini seçin (XZ = zemin, XY = ön duvar, YZ = yan duvar).
4. Ekranda tıklayarak veya fareyi sürükleyerek çiziminizi yapın.
5. Çizimi tamamladıktan sonra sol paneldeki **Çizimi 3D'ye Dönüştür** butonuna (veya klavyeden `Enter`) basarak çiziminizi katı bir model haline getirin.

---

## 7. Gelişmiş İşlemler (Modifiyeler ve Boolean)

Nesneleri birbirine eklemek veya karmaşık modeller yapmak için sol paneldeki **İşlem (Ops)** sekmesini kullanın:
- **Boolean İşlemleri:** 
  - **Birleştir (Union):** Sahnede kesişen iki nesneyi birleştirip tek bir gövde yapar.
  - **Çıkar (Subtract):** Seçtiğiniz ilk nesneden, ikinci nesnenin hacmini keserek delik açar.
- **Modifiyeler:**
  - **Extrude:** Seçili nesnenin yüzeylerini uzatarak kalınlaştırır.
  - **Bevel:** Seçili nesnenin kenarlarını hafifçe törpüleyip pah kırar.
  - **Subdivide:** Nesnenin poligon sayısını artırarak detay ekler.
  - **Dizi (Array):** Nesneyi doğrusal veya dairesel eksende belirli aralıklarla kopyalayarak çoğaltır.

---

## 8. Dosya Kaydetme, Açma ve Aktarma

TriForge CAD Pro 3.0 hem sunucu tabanlı hem de yerel bilgisayar tabanlı dosya sistemini destekler.

### 💾 Projeyi Kaydetmek (Save):
Üst menüden **Kaydet** (`Ctrl+S`) butonuna bastığınızda karşınıza bir panel açılır:
1. **Cihaza Kaydet (Önerilen):** Projenizi doğrudan kendi bilgisayarınıza kaydeder. Modern tarayıcılarda sisteminizdeki "Masaüstü", "İndirilenler" veya istediğiniz bir diski seçebileceğiniz **Sistem Farklı Kaydet** paneli açılır. Proje `.json` uzantılı bir dosya olarak kaydedilir.
2. **Sunucuya Kaydet:** Projenizi web sunucusu üzerindeki `projects/` klasörüne kaydeder.

### 📂 Proje Açmak (Open):
Üst menüden **Aç** butonuna tıkladığınızda sistem dosya seçiciniz açılır. Daha önce bilgisayarınıza indirdiğiniz `.json` uzantılı proje dosyasını seçerek kaldığınız yerden çalışmaya devam edebilirsiniz.

### ⬇ Dosya Aktarma (Export):
Tasarımlarınızı 3D yazıcıda basmak veya Blender, Unity gibi diğer programlara aktarmak için:
- **STL Aktar:** 3D yazıcılar için endüstri standardı format.
- **OBJ Aktar:** Genel 3D modelleme programları için mesh formatı.

---

## 9. Klavye Kısayolları Tablosu

Blender benzeri hızlı modelleme deneyimi için klavyenizi aktif olarak kullanın:

| Tuş Kombinasyonu | İşlev |
| :--- | :--- |
| `Q` | Seçim Aracını Aktif Et |
| `W` veya `G` | Taşıma (Translate) Aracını Aktif Et |
| `E` | Döndürme (Rotate) Aracını Aktif Et |
| `R` | Ölçekleme (Scale) Aracını Aktif Et |
| `Tab` | Obje Modu ile Edit Modu Arasında Geçiş Yap |
| `Ctrl + K` | Çizim Modunu Aç / Kapat |
| `F` | Seçili Objeye Odaklan / Yakınlaş |
| `A` | Sahnedeki Tüm Nesneleri Seç |
| `Del` veya `X` | Seçili Nesneyi Sil |
| `Ctrl + D` | Seçili Nesneyi Kopyala (Duplicate) |
| `Ctrl + Z` | Son İşlemi Geri Al (Undo) |
| `Ctrl + Y` | Geri Alınan İşlemi İleri Al (Redo) |
| `Ctrl + N` | Yeni/Temiz Sahne Oluştur |
| `Ctrl + S` | Sahneyi Kaydet Panelini Aç |
| `Enter` | Çizim Modunda Çizimi Bitir ve 3D Yap |
| `Esc` | Aktif Moddan Çık / Çizimi İptal Et |
| `1` (Rakam) | Sahneye Ön Görünümden Bak |
| `3` (Rakam) | Sahneye Sağ Görünümden Bak |
| `7` (Rakam) | Sahneye Üst Görünümden Bak |
| `Home` | Perspektif Açıya Geri Dön |
