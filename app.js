// Teachable Machine Model URL
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/MR4cmgfqD/";

let model, maxPredictions;

// Hastalık bilgileri ve öneriler
const diseaseInfo = {
    "Balgam": {
        icon: "🦠",
        color: "#F44336",
        advice: [
            "Hastalıklı yaprakları derhal kesin ve imha edin",
            "Bakır bazlı fungisit uygulayın",
            "Serada havalandırmayı artırın",
            "Sulamayı yaprak üzerinden değil, kökten yapın"
        ]
    },
    "Ballı Basra": {
        icon: "🍯",
        color: "#FF9800",
        advice: [
            "Enfekte bitkileri izole edin",
            "Özel fungisit tedavisi uygulayın",
            "Serada nem oranını kontrol edin",
            "Düzenli ilaçlama programı başlatın"
        ]
    },
    "Çikolata Hastalığı": {
        icon: "🍫",
        color: "#795548",
        advice: [
            "Hasta bitki kısımlarını temizleyin",
            "Fungal enfeksiyona karşı ilaç uygulayın",
            "Toprak drenajını kontrol edin",
            "Aşırı sulamadan kaçının"
        ]
    },
    "Kanser": {
        icon: "☢️",
        color: "#E91E63",
        advice: [
            "Enfekte bitkileri derhal çıkarın ve yakın",
            "Ekipmanları dezenfekte edin",
            "Sağlıklı bitkilerle mesafeyi artırın",
            "Hastalığa dayanıklı çeşitler tercih edin"
        ]
    },
    "Kırmızı Örümcek": {
        icon: "🕷️",
        color: "#D32F2F",
        advice: [
            "Akar ilaçları (akarisit) kullanın",
            "Serada nem oranını artırın (%60-70)",
            "Yaprak altlarını kontrol edin",
            "Biyolojik mücadele ajanları kullanın"
        ]
    },
    "Kurt Hastalığı": {
        icon: "🐛",
        color: "#8BC34A",
        advice: [
            "Larvaları elle toplayın",
            "Biyolojik insektisitler kullanın (Bacillus thuringiensis)",
            "Feromon tuzakları yerleştirin",
            "Gece kontrolleri yapın (kurtlar gece aktif)"
        ]
    },
    "Külleme": {
        icon: "☁️",
        color: "#9E9E9E",
        advice: [
            "Kükürt bazlı fungisitler uygulayın",
            "Havalandırmayı iyileştirin",
            "Yapraklar arası mesafeyi artırın",
            "Sabah erken saatlerde sulama yapın"
        ]
    },
    "Mozaik Virüsü": {
        icon: "🦠",
        color: "#FF5722",
        advice: [
            "Virüslü bitkileri derhal çıkarın ve imha edin",
            "Vektör böcekleri (yaprak biti) kontrol edin",
            "Yeni tohum/fide alırken sertifikalı tercih edin",
            "Serada hijyen kurallarına dikkat edin"
        ]
    },
    "Sağlıklı Domates": {
        icon: "✅",
        color: "#4CAF50",
        advice: [
            "Harika! Bitkileriniz sağlıklı görünüyor",
            "Normal bakım rutinine devam edin",
            "Düzenli sulama ve gübreleme yapın",
            "Yaprakları haftada bir kontrol edin"
        ]
    }
};

// Sayfa yüklendiğinde modeli yükle
window.addEventListener('load', async () => {
    await loadModel();
    registerServiceWorker();
    setupInstallPrompt();
});

// Modeli yükle
async function loadModel() {
    try {
        console.log("Model yükleniyor...");
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";
        
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        
        console.log("✅ Model başarıyla yüklendi!");
        console.log("Sınıf sayısı:", maxPredictions);
    } catch (error) {
        console.error("❌ Model yükleme hatası:", error);
        alert("Model yüklenirken hata oluştu. Lütfen internet bağlantınızı kontrol edin.");
    }
}

// Kamera aç
function openCamera() {
    document.getElementById('cameraInput').click();
}

// Galeri aç
function openGallery() {
    document.getElementById('galleryInput').click();
}

// Fotoğraf yüklendiğinde
async function handleImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Preview göster
    const reader = new FileReader();
    reader.onload = async (e) => {
        const imgElement = document.getElementById('imagePreview');
        imgElement.src = e.target.result;
        
        document.getElementById('previewSection').classList.add('active');
        document.getElementById('loadingSection').classList.add('active');
        document.getElementById('resultSection').classList.remove('active');

        // Scroll to preview
        document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Resim yüklendikten sonra analiz et
        imgElement.onload = async () => {
            await analyzePlant(imgElement);
        };
    };
    reader.readAsDataURL(file);
}

// Bitkiyi analiz et
async function analyzePlant(imgElement) {
    try {
        if (!model) {
            alert("Model henüz yüklenmedi. Lütfen bekleyin...");
            await loadModel();
        }

        // Tahmin yap
        const predictions = await model.predict(imgElement);
        
        // En yüksek olasılıklı tahmini bul
        let maxPrediction = predictions[0];
        for (let pred of predictions) {
            if (pred.probability > maxPrediction.probability) {
                maxPrediction = pred;
            }
        }

        // Tüm tahminleri konsola yazdır
        console.log("📊 Tüm Tahminler:");
        predictions.forEach(pred => {
            console.log(`${pred.className}: ${(pred.probability * 100).toFixed(1)}%`);
        });

        // Sonucu göster
        displayResult(maxPrediction);

    } catch (error) {
        console.error("Analiz hatası:", error);
        alert("Analiz sırasında hata oluştu: " + error.message);
        document.getElementById('loadingSection').classList.remove('active');
    }
}

// Sonucu göster
function displayResult(prediction) {
    const className = prediction.className;
    const confidence = (prediction.probability * 100).toFixed(1);
    
    const info = diseaseInfo[className] || {
        icon: "❓",
        color: "#9E9E9E",
        advice: ["Bilinmeyen hastalık. Uzman desteği alın."]
    };

    // Loading gizle
    document.getElementById('loadingSection').classList.remove('active');
    
    // Sonuç göster
    document.getElementById('resultSection').classList.add('active');
    document.getElementById('resultIcon').textContent = info.icon;
    document.getElementById('resultTitle').textContent = className;
    document.getElementById('resultTitle').style.color = info.color;
    
    // Güven skoru
    document.getElementById('confidenceText').textContent = confidence + "%";
    const fillElement = document.getElementById('confidenceFill');
    fillElement.style.width = "0%";
    fillElement.style.background = info.color;
    setTimeout(() => {
        fillElement.style.width = confidence + "%";
    }, 100);

    // Öneriler
    const adviceList = document.getElementById('adviceList');
    adviceList.innerHTML = '';
    info.advice.forEach(advice => {
        const li = document.createElement('li');
        li.textContent = advice;
        adviceList.appendChild(li);
    });

    // Scroll to result
    setTimeout(() => {
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);

    // Vibration feedback (if supported)
    if (navigator.vibrate) {
        navigator.vibrate(200);
    }
}

// Uygulamayı sıfırla
function resetApp() {
    document.getElementById('previewSection').classList.remove('active');
    document.getElementById('resultSection').classList.remove('active');
    document.getElementById('loadingSection').classList.remove('active');
    document.getElementById('cameraInput').value = '';
    document.getElementById('galleryInput').value = '';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Service Worker kaydet
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('✅ Service Worker kayıtlı:', reg.scope))
            .catch(err => console.log('❌ Service Worker hatası:', err));
    }
}

// PWA Install Prompt
let deferredPrompt;

function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Install prompt göster
        document.getElementById('installPrompt').classList.add('active');
    });

    document.getElementById('installButton').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Install outcome: ${outcome}`);
            deferredPrompt = null;
            document.getElementById('installPrompt').classList.remove('active');
        }
    });

    // Yüklendikten sonra prompt gizle
    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA yüklendi!');
        document.getElementById('installPrompt').classList.remove('active');
    });
}

// Online/Offline durum kontrolü
window.addEventListener('online', () => {
    console.log('✅ İnternet bağlantısı aktif');
});

window.addEventListener('offline', () => {
    console.log('⚠️ Offline moddasınız');
    alert('İnternet bağlantısı kesildi. Bazı özellikler çalışmayabilir.');
});