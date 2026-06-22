export interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocument {
  slug: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<string, LegalDocument> = {
  "gizlilik-politikasi": {
    slug: "gizlilik-politikasi",
    title: "Gizlilik Politikası",
    description:
      "MarginalBridge platformunda kişisel verilerinizin nasıl toplandığı, işlendiği ve korunduğu.",
    updatedAt: "16 Haziran 2026",
    sections: [
      {
        title: "1. Veri Sorumlusu",
        paragraphs: [
          "MarginalBridge («Platform»), cross-border e-ticaret satıcılarına yönelik B2B SaaS hizmeti sunar. Bu Gizlilik Politikası, platformu kullanırken toplanan kişisel verilerin işlenmesine ilişkin esasları açıklar.",
          "Veri sorumlusu: MarginalBridge — İletişim: info@marginalbridge.com",
        ],
      },
      {
        title: "2. Toplanan Veriler",
        paragraphs: ["Hizmet kapsamında aşağıdaki veri kategorileri işlenebilir:"],
        bullets: [
          "Kimlik ve iletişim bilgileri (ad, soyad, e-posta, şirket unvanı)",
          "Hesap ve kimlik doğrulama verileri (şifre özeti, OAuth sağlayıcı bilgileri)",
          "Pazaryeri ve mağaza entegrasyon bilgileri (API anahtarları, mağaza kimlikleri)",
          "Ürün, sipariş ve işlem verileri (senkronize edilen katalog ve sipariş kayıtları)",
          "Teknik veriler (IP adresi, tarayıcı bilgisi, oturum çerezleri, kullanım logları)",
        ],
      },
      {
        title: "3. Verilerin İşlenme Amaçları",
        paragraphs: ["Kişisel verileriniz aşağıdaki amaçlarla işlenir:"],
        bullets: [
          "Hesap oluşturma, kimlik doğrulama ve panel erişimi sağlama",
          "GTİP, gümrük ve marj hesaplama hizmetlerinin sunulması",
          "Bağlı pazaryeri ve Shopify mağazalarından ürün/sipariş senkronizasyonu",
          "Müşteri desteği, güvenlik ve hizmet kalitesinin iyileştirilmesi",
          "Yasal yükümlülüklerin yerine getirilmesi",
        ],
      },
      {
        title: "4. Verilerin Aktarımı",
        paragraphs: [
          "Verileriniz; barındırma (Vercel), veritabanı (Neon/Postgres), kimlik doğrulama (Google/Apple OAuth) ve entegrasyon sağlayıcıları (Trendyol, Shopify vb.) ile yalnızca hizmetin sunulması için gerekli ölçüde paylaşılabilir.",
          "Yasal zorunluluklar dışında üçüncü taraflara satış veya ticari amaçla aktarım yapılmaz.",
        ],
      },
      {
        title: "5. Saklama Süresi",
        paragraphs: [
          "Verileriniz, hesabınız aktif olduğu sürece ve ilgili mevzuatta öngörülen süreler boyunca saklanır. Hesap silme talebinde, yasal saklama yükümlülükleri hariç olmak üzere veriler makul sürede silinir veya anonimleştirilir.",
        ],
      },
      {
        title: "6. Haklarınız",
        paragraphs: [
          "KVKK kapsamında kişisel verilerinize erişim, düzeltme, silme, işlemeyi kısıtlama ve itiraz haklarına sahipsiniz. Talepleriniz için info@marginalbridge.com adresine yazabilirsiniz.",
        ],
      },
      {
        title: "7. Güvenlik",
        paragraphs: [
          "Verileriniz; şifreli bağlantı (HTTPS), güvenli oturum yönetimi, erişim kontrolü ve sunucu tarafı güvenlik önlemleri ile korunur. API anahtarlarınız yalnızca sizin adınıza entegrasyon işlemleri için kullanılır.",
        ],
      },
      {
        title: "8. Politika Güncellemeleri",
        paragraphs: [
          "Bu politika gerektiğinde güncellenebilir. Güncel sürüm her zaman bu sayfada yayımlanır. Önemli değişikliklerde kullanıcılar bilgilendirilir.",
        ],
      },
    ],
  },
  "kullanim-kosullari": {
    slug: "kullanim-kosullari",
    title: "Kullanım Koşulları",
    description:
      "MarginalBridge platformunun kullanımına ilişkin hak, yükümlülük ve sınırlamalar.",
    updatedAt: "16 Haziran 2026",
    sections: [
      {
        title: "1. Hizmetin Kapsamı",
        paragraphs: [
          "MarginalBridge; gümrük maliyeti hesaplama, GTİP matrisi, pazaryeri entegrasyonu, ürün kataloğu yönetimi ve marj koruma araçları sunan bir B2B yazılım platformudur.",
          "Platforma kayıt olarak bu Kullanım Koşullarını kabul etmiş sayılırsınız.",
        ],
      },
      {
        title: "2. Hesap ve Erişim",
        paragraphs: ["Hesap oluştururken doğru ve güncel bilgi vermekle yükümlüsünüz."],
        bullets: [
          "Hesap bilgilerinizin gizliliğinden siz sorumlusunuz.",
          "Yetkisiz erişim şüphesinde derhal info@marginalbridge.com adresine bildirmelisiniz.",
          "Yönetici onayı veya abonelik koşulları gerektiren özelliklere erişim, hesap durumunuza bağlıdır.",
        ],
      },
      {
        title: "3. Kabul Edilebilir Kullanım",
        paragraphs: ["Platform aşağıdaki amaçlarla kullanılamaz:"],
        bullets: [
          "Yürürlükteki mevzuata aykırı faaliyetler",
          "Başkalarının API anahtarları veya hesaplarına izinsiz erişim",
          "Hizmeti aşırı yükleyecek otomatik saldırı veya kötüye kullanım",
          "Yanıltıcı fiyatlandırma, sahte ürün veya tüketiciyi aldatıcı ticari uygulamalar",
        ],
      },
      {
        title: "4. Entegrasyonlar ve Üçüncü Taraflar",
        paragraphs: [
          "Trendyol, Shopify ve diğer pazaryeri entegrasyonları ilgili platformların kendi kullanım şartlarına tabidir. MarginalBridge, üçüncü taraf API kesintilerinden veya veri doğruluğundan doğrudan sorumlu tutulamaz; ancak makul çabayı göstermeyi taahhüt eder.",
        ],
      },
      {
        title: "5. Fikri Mülkiyet",
        paragraphs: [
          "Platform yazılımı, arayüzü, markası ve içerikleri MarginalBridge'e aittir. İzinsiz kopyalama, tersine mühendislik veya yeniden satış yasaktır.",
        ],
      },
      {
        title: "6. Ücretlendirme ve Deneme",
        paragraphs: [
          "Paket fiyatları ve deneme süreleri web sitesinde ilan edilir. Ücretli aboneliklerde iptal ve iade koşulları seçilen plana göre uygulanır. Ücretsiz deneme süresi sonunda hizmet, seçilen plana göre devam eder veya askıya alınır.",
        ],
      },
      {
        title: "7. Sorumluluk Sınırı",
        paragraphs: [
          "MarginalBridge, GTİP hesaplamaları ve fiyat önerilerini bilgilendirme amaçlı sunar. Nihai ticari kararlar kullanıcıya aittir. Dolaylı zararlar, kâr kaybı ve veri kaybından doğan sorumluluk, yasal olarak izin verilen azami ölçüde sınırlıdır.",
        ],
      },
      {
        title: "8. Fesih",
        paragraphs: [
          "Koşulların ihlali halinde hesabınız askıya alınabilir veya sonlandırılabilir. Kullanıcı, hesap kapatma talebini info@marginalbridge.com üzerinden iletebilir.",
        ],
      },
      {
        title: "9. Uygulanacak Hukuk",
        paragraphs: [
          "Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul (Merkez) mahkemeleri ve icra daireleri yetkilidir.",
        ],
      },
    ],
  },
  kvkk: {
    slug: "kvkk",
    title: "KVKK Aydınlatma Metni",
    description:
      "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.",
    updatedAt: "16 Haziran 2026",
    sections: [
      {
        title: "1. Veri Sorumlusu",
        paragraphs: [
          "6698 sayılı Kişisel Verilerin Korunması Kanunu («KVKK») uyarınca veri sorumlusu MarginalBridge'dir.",
          "Adres: İstanbul, Türkiye — E-posta: info@marginalbridge.com",
        ],
      },
      {
        title: "2. İşlenen Kişisel Veriler",
        paragraphs: ["Aşağıdaki kişisel veri kategorileri işlenebilmektedir:"],
        bullets: [
          "Kimlik bilgisi (ad, soyad)",
          "İletişim bilgisi (e-posta, şirket adı)",
          "Müşteri işlem bilgisi (sipariş, ürün, mağaza senkronizasyon kayıtları)",
          "İşlem güvenliği bilgisi (oturum kayıtları, IP, log verileri)",
          "Finansal bilgi (fatura/abonelik bilgileri — ödeme altyapısı üzerinden)",
        ],
      },
      {
        title: "3. Kişisel Verilerin İşlenme Amaçları",
        paragraphs: ["Kişisel verileriniz KVKK m.5 ve m.6 kapsamında şu amaçlarla işlenir:"],
        bullets: [
          "Sözleşmenin kurulması ve ifası (hizmet sunumu, hesap yönetimi)",
          "Hukuki yükümlülüklerin yerine getirilmesi",
          "Meşru menfaat (güvenlik, dolandırıcılık önleme, hizmet iyileştirme)",
          "Açık rıza gerektiren hallerde (pazarlama iletişimi vb.) ayrıca onayınız alınır",
        ],
      },
      {
        title: "4. Kişisel Verilerin Aktarılması",
        paragraphs: [
          "Verileriniz; yurt içinde barındırma ve altyapı sağlayıcılarına, entegrasyon partnerlerine (pazaryeri API'leri) ve yasal mercilere, KVKK m.8 ve m.9 hükümlerine uygun şekilde aktarılabilir.",
          "Yurt dışına aktarım gerektiğinde, KVKK'da öngörülen güvenceler sağlanır.",
        ],
      },
      {
        title: "5. Toplama Yöntemi ve Hukuki Sebep",
        paragraphs: [
          "Veriler; web sitesi, mobil arayüz, API entegrasyonları, çerezler ve destek kanalları aracılığıyla otomatik veya kısmen otomatik yollarla toplanır.",
          "Hukuki sebepler: sözleşmenin ifası, kanuni yükümlülük, meşru menfaat ve gerektiğinde açık rıza.",
        ],
      },
      {
        title: "6. İlgili Kişi Hakları (KVKK m.11)",
        paragraphs: ["KVKK kapsamında aşağıdaki haklara sahipsiniz:"],
        bullets: [
          "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
          "İşlenmişse buna ilişkin bilgi talep etme",
          "Amacına uygun kullanılıp kullanılmadığını öğrenme",
          "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme",
          "Eksik veya yanlış işlenmişse düzeltilmesini isteme",
          "KVKK m.7 kapsamında silinmesini veya yok edilmesini isteme",
          "Otomatik sistemler ile analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme",
          "Kanuna aykırı işleme nedeniyle zarara uğramanız halinde tazminat talep etme",
        ],
      },
      {
        title: "7. Başvuru Yöntemi",
        paragraphs: [
          "Haklarınıza ilişkin taleplerinizi info@marginalbridge.com adresine iletebilirsiniz. Başvurular en geç 30 gün içinde sonuçlandırılır.",
          "Kişisel Verileri Koruma Kurulu'na şikâyet hakkınız saklıdır.",
        ],
      },
    ],
  },
};

export const LEGAL_LINKS = [
  { href: "/gizlilik-politikasi", label: "Gizlilik Politikası" },
  { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
  { href: "/kvkk", label: "KVKK" },
] as const;

export function getLegalDocument(slug: string): LegalDocument | null {
  return LEGAL_DOCUMENTS[slug] ?? null;
}
