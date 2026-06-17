# TriForge CAD Pro 3.0 Kullanım Kılavuzu

TriForge CAD Pro 3.0, tarayıcınız üzerinde çalışan güçlü bir 3D modelleme ve CAD tasarım platformudur. Bu kılavuz, uygulamanın tüm özelliklerini, araçlarını ve Blender benzeri kısayollarını detaylı şekilde açıklamakta ve tasarımlarınızı en verimli şekilde hayata geçirmenizi sağlamaktadır.

---

## 📌 İçindekiler
1. [Kullanıcı Arayüzü (UI) Genel Bakış](#1-kullanıcı-arayüzü-ui-genel-bakış)
2. [Kamera ve Sahne Navigasyonu](#2-kamera-ve-sahne-navigasyonu)
3. [Temel Nesne İşlemleri (Transform)](#3-temel-nesne-işlemleri-transform)
4. [Low-Poly Oyun Geometrisi Eklemek](#4-low-poly-oyun-geometrisi-eklemek)
5. [Harita Tasarım Modu, Su Arazileri ve Yol Tasarımı](#5-harita-tasarım-modu-su-arazileri-ve-yol-tasarımı)
6. [Blender Tarzı Yoğurma / Heykel (Sculpt) Modu](#6-blender-tarzı-yoğurma--heykel-sculpt-modu)
7. [2D Çizim (Sketch) ve 3D'ye Dönüştürme](#7-2d-çizim-sketch-ve-3dye-dönüştürme)
8. [Gelişmiş İşlemler (Modifiyeler ve Boolean)](#8-gelişmiş-işlemler-modifiyeler-ve-boolean)
9. [Dosya Kaydetme, Açma ve Aktarma](#9-dosya-kaydetme-açma-ve-aktarma)
10. [Klavye Kısayolları Tablosu](#10-klavye-kısayolları-tablosu)

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

Oyun geliştiricileri ve low-poly (düşük poligonlu) tarzı sevenler için zengin hazır şablonlar eklenmiştir. Sol paneldeki **Şekiller** sekmesinde **OYUN GEOMETRİLERİ (LOW-POLY)** başlığı altında bu nesneleri 3 ana kategoride bulabilirsiniz:

### 🏠 Yapılar & Karakter
- **Karakter:** İnsan modelleme ve ölçek testi için eklemli şablon.
- **Ev:** Çatısı ve bacası olan low-poly minik ev.
- **Kule:** Burçları olan dairesel kale/savunma kulesi.
- **Duvar:** Ortasında kapı boşluğu bulunan modüler duvar parçası.
- **Merdiven:** Basamaklı hazır merdiven geometrisi.
- **Köprü:** Korkulukları ve sütunları olan ahşap köprü.
- **Değirmen:** Pervaneli yel değirmeni.
- **Kuyu:** Silindirik taş gövdeli su kuyusu.
- **Çadır:** Low-poly kamp çadırı.
- **Şato:** Mini kale surları ve kuleleri.
- **Deniz Feneri:** Üstü lambalı deniz feneri gövdesi.
- **Harabe:** Yıkık duvarlı ve eğik sütunlu antik harabe kemeri.
- **Kulübe:** Ahşap log duvarlı ve çatı kaplamalı kulübe.
- **Geçit:** İçinde portal diski olan halka şeklinde geçit kemeri.

### 🌲 Doğa & Çevre
- **Meşe Ağacı:** Düşük poligonlu, çizgi film tarzı hazır meşe ağacı.
- **Çam Ağacı:** Katmanlı yaprakları olan çam ağacı şablonu.
- **Kaya:** Doğal görünümlü, köşeli kaya/boulder parçası.
- **Kamp Ateşi:** Odunları ve alev konisi olan kamp ateşi.
- **Kristal:** Çift konili enerji/değerli maden kristali.
- **Mantar:** Şapkalı ve saplı orman mantarı.
- **Kaktüs:** Gövdesi ve kolları olan çöl kaktüsü.
- **Bulut:** Kürelerden oluşan fluffy low-poly bulut.
- **Çiçek:** Saplı ve 5 yapraklı orman çiçeği.

### 🛡️ Eşyalar & Savaş (Savaş & Dekor Props)
- **Kılıç:** Kabzalı ve siperlikli şovalye kılıcı.
- **Kalkan:** Dairesel kabartmalı hexagonal kalkan.
- **Sandık:** Kapağı ve ön kilidi bulunan hazine sandığı.
- **Varil:** Dış kasnağı ve demir çemberleri olan fıçı/varil.
- **Meşale:** Duvara asılabilir alevli meşale.
- **Fener:** Sokak lambası/feneri.
- **Çit:** Modüler ahşap çit parçası.
- **Tekne:** Küçük ahşap sandal/tekne gövdesi.
- **Sütun:** Klasik antik mimari sütun parçası.
- **Bayrak:** Direkli kale/ülke bayrağı.
- **Mezar:** Üzerinde haç işareti oyması olan mezar taşı.
- **Top:** Tekerlekli ve namlulu savaş topu.
- **Kasa:** Çapraz ahşap çıtalı nakliye kasası.
- **Örs:** Demirci örsü.
- **Vagon:** Tekerlekli taşıma vagonu/at arabası kasası.

---

## 5. Harita Tasarım Modu, Su Arazileri ve Yol Tasarımı

TriForge CAD Pro 3.0, geniş araziler, nehir yolları ve karmaşık yol ağları tasarlayabilmeniz için özel bir **Ortam ve Harita Tasarım Modu** içerir.

### 🏞️ Harita Tasarım Modu (Environment Mode)
Sol paneldeki **Arazi (Terrain)** sekmesine tıkladığınızda, çalışma alanı anında CAD modundan çıkarak Roblox Studio veya Unity tarzı bir harita editörüne dönüşür:
- **Gökyüzü ve Sis:** Siyah uzay boşluğu yerini tatlı mavi bir gökyüzü rengine ve yumuşak bir ufuk çizgisi sisine bırakır.
- **Sonsuz Çimen Zemin:** Çalışma alanının altına yeşil bir çimenlik düzlem serilir. Bu sayede arazilerin boşlukta yüzmesi engellenir.
- **Sıcak Işıklandırma:** Işıklar daha parlak ve güneş sarısı rengini alarak low-poly modellerin canlı görünmesini sağlar.
- Diğer sekmelere (Şekiller, Çizim vb.) geçildiğinde sahne anında koyu renkli hassas CAD moduna geri döner.

### 💧 Gelişmiş Su Arazileri (Göl, Nehir, Vaha, Bataklık)
Su temalı arazi şablonları eklendiğinde veya parametreleri değiştirildiğinde, Three.js tabanlı özel şeffaf su kütleleri (Water Planes) otomatik olarak araziyle bütünleşik şekilde oluşturulur:
- **Göl (Lake):** Merkezinde dairesel bir çukur olan ve bu çukuru dolduran tatlı mavi bir göl suyu katmanı içerir.
- **Nehir (River):** X ekseninde kıvrılarak ilerleyen bir nehir yatağı ve içine yerleştirilmiş nehir suyu düzlemi oluşturur.
- **Vaha (Oasis):** Çöl kumullarıyla çevrili derin bir vaha havuzu ve turkuaz renkli berrak su katmanı ekler.
- **Bataklık (Swamp):** Koyu yeşil çamurlu su birikintileri ve bataklık zemin dokusu oluşturur.

> [!TIP]
> Sağ paneldeki müfettişten Arazi Parametrelerini (Genişlik, Derinlik, Yükseklik, Pürüzlülük, Arazi Tipi) değiştirdiğinizde, içindeki su kütleleri ve derinlik hesaplamaları da gerçek zamanlı olarak otomatik güncellenir.

### 🛣️ Modüler Yol Elemanları (Yol ve Ulaşım)
Arazi sekmesindeki **Yol ve Ulaşım Elemanları** kategorisini kullanarak kendi yollarınızı birleştirebilirsiniz:
- **Düz Yol:** Standart doğrusal yol parçası.
- **Viraj:** 90 derecelik virajlı dönüş parçası.
- **T-Kavşak:** T şeklinde üçlü yol birleşimi.
- **Dört Yol:** Standart artı şekilli kavşak.
- **Köprü Yol:** Altında sütun ayakları olan yükseltilmiş köprü yolu.
- **Vertex Renklendirme:** Yollar herhangi bir resim kaplamasına (texture) ihtiyaç duymadan, kendi içlerinde koyu gri asfalt, açık gri kaldırımlar ve sarı kesikli yol çizgileri ile hazır boyanmış (Vertex Colors) olarak gelir. Sahnede doğrudan rengarenk ve profesyonel görünür.

---

## 6. Blender Tarzı Yoğurma / Heykel (Sculpt) Modu

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

## 7. 2D Çizim (Sketch) ve 3D'ye Dönüştürme

Serbestçe 2D çizgiler çizip bunları tek tıkla 3D katı nesnelere dönüştürebilirsiniz:
1. Üst menüden veya klavyeden `Ctrl+K` ile **Çizim Modu**'na girin.
2. Sol araç çubuğundaki Çizim butonlarından birini seçin (Çizik, Dikdörtgen, Daire, Yıldız vb.).
3. Çizim Düzlemini seçin (XZ = zemin, XY = ön duvar, YZ = yan duvar).
4. Ekranda tıklayarak veya fareyi sürükleyerek çiziminizi yapın.
5. Çizimi tamamladıktan sonra sol paneldeki **Çizimi 3D'ye Dönüştür** butonuna (veya klavyeden `Enter`) basarak çiziminizi katı bir model haline getirin.

---

## 8. Gelişmiş İşlemler (Modifiyeler ve Boolean)

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

## 9. Dosya Kaydetme, Açma ve Aktarma

TriForge CAD Pro 3.0, tarayıcınızın modern **File System Access API** (Dosya Sistemi Erişim Arayüzü) özelliklerini kullanarak tam bir masaüstü CAD uygulaması gibi çalışır.

### 💾 Projeyi Kaydetmek (Save) & Farklı Kaydet (Save As):
- **Kaydet (`Ctrl+S`):** Eğer proje daha önce bir dosyadan açıldıysa veya "Farklı Kaydet" ile kaydedildiyse, herhangi bir onay kutusu sormadan **doğrudan o dosyanın üzerine yazar (direct overwrite)**. Eğer proje henüz kaydedilmemişse, otomatik olarak Farklı Kaydet penceresini tetikler.
- **Farklı Kaydet (`Ctrl+Shift+S`):** İşletim sisteminizin "Farklı Kaydet" penceresini doğrudan tetikler. Buradan projenizi istediğiniz klasöre (Masaüstü, İndirilenler, diğer diskler vb.) istediğiniz isimle kaydedebilirsiniz.

### 📂 Proje Açmak (Open):
Üst menüden **Aç** butonuna tıkladığınızda işletim sisteminizin dosya açma seçicisi gelir. Seçtiğiniz `.json` uzantılı proje dosyası yüklenirken, dosyanın yazma yetkisi (handle) uygulamada saklanır. Bu sayede projenin üstüne doğrudan "Kaydet" yapabilirsiniz.

> [!NOTE]
> File System Access API'yi desteklemeyen eski tarayıcılarda, "Farklı Kaydet" işlemi tarayıcının varsayılan indirme klasörüne doğrudan `.json` indirmesi yapacak şekilde otomatik ve güvenli bir geri dönüş (fallback) mekanizması ile çalışır.

### ⬇ Dosya Aktarma (Export):
Tasarımlarınızı 3D yazıcıda basmak veya Blender, Unity gibi diğer programlara aktarmak için:
- **STL Aktar:** 3D yazıcılar için endüstri standardı format.
- **OBJ Aktar:** Genel 3D modelleme programları için mesh formatı.

---

## 10. Klavye Kısayolları Tablosu

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
| `Ctrl + S` | Sahneyi Doğrudan Kaydet (Overwrite) / Yeni ise Farklı Kaydet |
| `Ctrl + Shift + S` | Farklı Kaydet Penceresini Aç |
| `Enter` | Çizim Modunda Çizimi Bitir ve 3D Yap |
| `Esc` | Aktif Moddan Çık / Çizimi İptal Et |
| `1` (Rakam) | Sahneye Ön Görünümden Bak |
| `3` (Rakam) | Sahneye Sağ Görünümden Bak |
| `7` (Rakam) | Sahneye Üst Görünümden Bak |
| `Home` | Perspektif Açıya Geri Dön |
