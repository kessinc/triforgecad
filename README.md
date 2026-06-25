# TriForge CAD Pro 3.0 Kullanım Kılavuzu

TriForge CAD Pro 3.0, tarayıcınız üzerinde çalışan güçlü bir 3D modelleme ve CAD tasarım platformudur. Bu kılavuz, uygulamanın tüm özelliklerini, araçlarını ve Blender benzeri kısayollarını detaylı şekilde açıklamakta ve tasarımlarınızı en verimli şekilde hayata geçirmenizi sağlamaktadır.

---

## 📌 İçindekiler
1. [Kullanıcı Arayüzü (UI) Genel Bakış](#1-kullanıcı-arayüzü-ui-genel-bakış)
2. [Kamera ve Sahne Navigasyonu](#2-kamera-ve-sahne-navigasyonu)
3. [Temel Nesne İşlemleri (Transform)](#3-temel-nesne-işlemleri-transform)
4. [Low-Poly Oyun Geometrisi Eklemek](#4-low-poly-oyun-geometrisi-eklemek)
5. [3D Yazıcı Modelleri (Print Hazırlık)](#5-3d-yazıcı-modelleri-print-hazırlık)
6. [Blender Tarzı Modelleme, Boyama ve Yoğurma (Sculpt) Araçları](#6-blender-tarzı-modelleme-boyama-ve-yoğurma-sculpt-araçları)
7. [2D Çizim (Sketch) ve 3D'ye Dönüştürme](#7-2d-çizim-sketch-ve-3dye-dönüştürme)
8. [Gelişmiş İşlemler (Modifiyeler ve Boolean)](#8-gelişmiş-işlemler-modifiyeler-ve-boolean)
9. [Yüzey Bükücü & Mıknatısı (Conform Warp) Modu](#9-yüzey-bükücü--mıknatısı-conform-warp-modu)
10. [Dosya Kaydetme, Açma ve Aktarma](#10-dosya-kaydetme-açma-ve-aktarma)
11. [Klavye Kısayolları Tablosu](#11-klavye-kısayolları-tablosu)

---

## 1. Kullanıcı Arayüzü (UI) Genel Bakış

Arayüz 6 ana bölgeye ayrılmıştır:
- **Üst Menü Barı (Menubar):** Dosya açma, kaydetme, geri/ileri alma, hizalama (snap), export (STL/OBJ) ve kamera görünüm ayarları.
- **Sol Dikey Araç Çubuğu (Left Toolbar):** Temel transform araçları (Seç, Taşı, Döndür, Ölçekle) ve gelişmiş Blender tarzı modelleme araçları (Boya Fırçası, Yüzey Boyama, Yüzey Uzatma, Yoğurma ve Yüzey Yapışması).
- **Sol Panel:** Hazır şekiller (Temel, Gelişmiş, Mimari, Oyun), 2D Çizim (Sketch) geometrisi, Boolean/Modifiye işlemleri, Sahne Hiyerarşisi (Outliner) ve Render ayarları.
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

> [!IMPORTANT]
> **Yüzey Yapışması (Surface Snap):** Sol araç çubuğundaki mıknatıs simgeli **Yüzey Yapışması** aracı aktif edildiğinde, taşıdığınız nesne altındaki diğer nesnelerin yüzeylerine otomatik olarak sıfırlanır ve iç içe geçerek kaybolmaları (clipping) engellenir. Bu özellik etkinken nesne dikey eksende serbestçe yukarı çekilebilir ancak altındaki nesnenin/zeminin yüzeyinden aşağıya inemez.

---

## 4. Low-Poly Oyun Geometrisi Eklemek

Oyun geliştiricileri ve low-poly (düşük poligonlu) tarzı sevenler için zengin hazır şablonlar eklenmiştir. Sol paneldeki **Şekiller** sekmesinde aşağıdaki bağımsız açılır-kapanır kategoriler altında bu nesneleri bulabilirsiniz:

### 👤 Karakterler & Canavarlar
- **Karakter:** İnsan modelleme ve ölçek testi için eklemli şablon.
- **Şövalye:** Mini şövalye karakteri, kalkanı ve silahı ile hazır.
- **Büyücü:** Asalı ve büyücü şapkalı karakter.
- **Slime:** Klasik slime yaratığı gövdesi.
- **Golem:** Kaya golem canavarı.
- **Göz Canavarı:** Yüzen, göz uzantıları olan beholder tarzı canavar.

### 🏠 Yapılar & Binalar
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

## 5. 3D Yazıcı Modelleri (Print Hazırlık)

Uygulamada 3D yazıcıdan baskı alabilmeniz için özel olarak tasarlanmış, bütünüyle beyaz (boyanmamış) hazır 3D model şablonları bulunur:
- **Karambit:** Parmağa geçirilen halkası, ergonomik kıvrımlı kabzası ve keskin pençe bıçağıyla procedurally üretilen bir model.
- **Kelebek (Butterfly Knife):** Çift saplı, pimli ve ortasında slotu olan, gerçeğe uygun biçimde tasarlanmış bir kelebek bıçağı modeli.

### 📐 Boyut Şablonları & Özel Boyutlandırma
Bu nesneleri seçtiğinizde sağ paneldeki **Geometri** sekmesinde şu ayarları göreceksiniz:
- **Boyut Şablonu Dropdown:** Standart (1:1), Küçük Boy veya Büyük Boy hazır boyutları tek tıkla uygulayabilirsiniz.
- **Özel Boyutlandırma Girdileri:** Bıçak Uzunluğu, Kabza Uzunluğu ve Kalınlık (Et) değerlerini milimetrik olarak tamamen bağımsız ayarlayabilirsiniz.

### 🖌️ Parça Parça Boyama
Modeller varsayılan olarak beyaz renkli vertex renkleriyle oluşturulur. Üst menüden **Boyama** moduna geçerek fırça yardımıyla bıçağın sadece ucunu, gövdesini veya halkasını dilediğiniz gibi farklı renklere boyayabilirsiniz. Boyama bittiğinde **STL Aktar** veya **OBJ Aktar** butonlarıyla modelinizi doğrudan boyanmış/baskıya hazır şekilde indirebilirsiniz.

## 6. Blender Tarzı Modelleme, Boyama ve Yoğurma (Sculpt) Araçları

Uygulamada, Blender benzeri profesyonel modelleme, yüzey manipülasyonu ve boyama işlemlerini doğrudan gerçekleştirebilirsiniz. Sol araç çubuğundaki ve sol paneldeki ilgili alanlar bu araçları kontrol eder:

### 🖌️ 1. Boya Fırçası (Paint Brush)
Seçili 3D nesneyi serbestçe boyamanızı sağlar.
- Sol araç çubuğundan fırça simgesine tıklayın.
- Sol paneldeki **İşlem (Ops)** sekmesinde açılan **Aktif Araç Ayarları** panelinden **Fırça Boyutu** ve **Boya Rengi** parametrelerini ayarlayın.
- Fare sol tıkı ile basılı tutup sürükleyerek nesneyi boyayın. Fare imlecinin ucunda, sahnedeki nesnenin yüzeyini ve eğimini takip eden 3D mavi bir halka (fırça boyutu önizlemesi) görünür. Boyama yumuşak bir geçişle (brush radius) uygulanır.

### 🎯 2. Yüzey Boyama (Face Paint)
Nesnenin sadece belirli yüzeylerini keskin sınırlarla boyamanızı sağlar.
- Sol araç çubuğundan yüzey boyama simgesine tıklayın.
- **Aktif Araç Ayarları** panelinden rengi seçin.
- Tıklayıp basılı tutarak nesnenin üzerinde fareyi sürüklediğinizde üzerinden geçtiğiniz tüm yüzeyleri boyar.
- **Tüm Düzlemi Boya** kutucuğu işaretliyse, tıkladığınız yüzeyle aynı düzlemde yer alan (coplanar) tüm yüzeyleri (örneğin bir küpün veya silindirin tüm düz yüzünü) tek tıkla komple boyar.

### 🧱 3. Yüzey Araçları (Face Tools)
Nesnenin yüzeyleri üzerinde Blender benzeri lokal işlemler yapmanızı sağlar. Sol araç çubuğundan küp üzerine ok olan simgeye tıklayarak aktif edebilir ve **Aktif Araç Ayarları** altındaki **İşlem Türü** seçeneğinden aşağıdaki işlemleri yapabilirsiniz:
- **Uzat (Extrude):** Yüzeyi normali doğrultusunda belirtilen **Derinlik** miktarında dışarı doğru uzatır ve yan duvarları örer.
- **İçerlek Yüzey (Inset):** Yüzeyi içeriye doğru daraltarak bir çerçeve ve yeni bir iç yüzey oluşturur. **Inset Oranı** (0.1 - 0.9) ile daralma miktarını ayarlayabilirsiniz.
- **Yüzey Böl (Subdivide):** Seçili üçgen yüzeyi merkezinden bölerek 3 yeni küçük yüzeye ayırır. Detaylı lokal boyama veya extrude işlemleri için yüzey detayını arttırmada kullanılır.
- **Yüzey Sil (Delete):** Seçili yüzeyi tamamen silerek model üzerinde bir boşluk/delik oluşturur.
- **Pah Kır (Bevel):** Yüzeyi içeriye doğru daraltıp dışa doğru uzatarak kenarlarda pah/eğim oluşturur.
- **Lokal Yumuşat (Smooth):** Seçili yüzeyin ve komşu yüzeylerin tepe noktalarını yerel olarak yumuşatarak daha dairesel/akıcı geçişler sağlar.

### 🏺 4. Yoğurma / Heykel (Sculpt) Modu
Seçtiğiniz bir nesneyi kilden bir heykel gibi fareyle yoğurmak için kullanılır.
- Sol araç çubuğundan yoğurma simgesine tıklayın.
- Fırça ile yoğurma yaparken nesnenin yüzeyinde brush boyutunu gösteren 3D mavi bir daire kılavuzluk eder.
- Sol paneldeki **İşlem (Ops)** sekmesinde yer alan fırça ayarlarını kullanın:
  - **Çek / Şişir (Pull):** Fareyi sürüklediğiniz yüzeyi dışa doğru şişirir.
  - **İt / Çökert (Push):** Fareyi sürüklediğiniz yüzeyi içe doğru çökertir, oyuk açar.
  - **Düzleştir (Smooth):** Yüzeydeki keskin köşeleri yumuşatır, pürüzsüz hale getirir.
  - **Kazı / Düzle (Flatten):** Farenin tıkladığı yerdeki yüzey seviyesini baz alarak o bölgeyi düz bir düzleme dönüştürür.
  - **Sıkıştır (Pinch):** Fırça altındaki tepe noktalarını merkeze doğru çekerek keskin hatlar oluşturur.
  - **Şişir (Inflate):** Poligonları yerel yüzey normalleri doğrultusunda şişirerek hacim kazandırır.
  - **Orjinale Döndür / Sil (Revert):** Yaptığınız değişiklikleri silerek nesneyi ilk ham haline geri döndürür.
- **Fırça Boyutu** ve **Fırça Gücü** değerlerini dilediğiniz gibi ayarlayabilirsiniz.

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

## 9. Yüzey Bükücü & Mıknatısı (Conform Warp) Modu

Yüzey Bükücü & Mıknatısı, karmaşık ve çok detaylı mekanik parçaları (zırh plakaları, logolar, vidalar vb.) kavisli veya yamuk hedef yüzeylerin üzerine bükerek yerleştirmek için tasarlanmış gelişmiş bir araçtır. Bu araç üç temel özellikten oluşur:

### ✍️ 1. Çizgisel Form Kılavuzu (Curve Guide)
Seçtiğiniz nesneyi ekranda serbestçe çizdiğiniz 2D/3D bir eğri boyunca canlı olarak bükmenizi sağlar.
- Sol araç çubuğundan **Yüzey Bükücü & Mıknatısı** aracını seçin.
- Sağ paneldeki **Eğri Kılavuz Modu** altından **✍️ Eğri Çiz** butonuna tıklayın.
- Ekranda farenin sol tuşuna basılı tutarak serbest bir çizgi çizin.
- Seçtiğiniz detaylı nesne, çizdiğiniz eğrinin formunu hiçbir görsel bozulma veya detay ezilmesi olmadan anlık olarak alacaktır.
- İstediğiniz bükülme eksenini **Deformasyon Ekseni** (X, Y, Z) menüsünden değiştirebilirsiniz.
- **Temizle** butonuna basarak eğriyi silebilir ve nesneyi orijinal formuna döndürebilirsiniz.

### 🧲 2. Yüzey Mıknatısı (Surface Conform)
Bükülmüş veya düz bir nesnenin alt yüzeyini karmaşık bir hedef modelin yüzeyine sıfırlarken, üstteki detayların oranlarını ve hacmini mükemmel şekilde korur.
- Sağ paneldeki **Mıknatıs Hedef Nesne** listesinden yapışılacak hedef nesneyi seçin (veya otomatik algılama için boş bırakın).
- **Hacim & Detay Koru** seçeneğinin işaretli olduğundan emin olun. Bu sayede nesnenin üst kısımlarındaki vidalar, oymalar veya logolar ezilmeden, yüzey normali boyunca orijinal yükseklikleri korunarak ötelenir.
- **🧲 Yüzeye Yapıştır** butonuna tıklayın. Nesnenin tabanı hedef nesneye cuk diye otururken 3D detaylar jilet gibi kalmaya devam eder.

### 🖌️ 3. Fırça İle Sürükleme (Mesh Flow Brush)
Detaylı mesh yapısını bir fırça yardımıyla hedef yüzeyin üzerinde sıvı gibi akıtarak yaymanızı sağlar.
- Sağ panelden **🖌️ Yüzeyde Fırçala** butonunu aktif edin.
- Fare imlecini hedef nesnenin kavisli yüzeyi üzerinde basılı tutup sürükleyin.
- Boyadığınız yol boyunca model kavisli yüzeyi takip edecek şekilde sıvı gibi yayılacak, ancak üzerindeki 3D detaylar oranlarını koruyarak jilet gibi net kalacaktır.
- Sağ panelden **Fırça Yarıçapı** değerini ayarlayarak yayılma alanını kontrol edebilirsiniz.

---

## 10. Dosya Kaydetme, Açma ve Aktarma

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

## 11. Klavye Kısayolları Tablosu

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
