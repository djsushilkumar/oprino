# Oprino — सम्पूर्ण सिस्टम एवं कार्यप्रणाली गाइड (Complete System Guide — Hindi)

> **यह Oprino का सबसे विस्तृत और संपूर्ण व्यावहारिक गाइड है। इसमें पूरे सिस्टम की तकनीकी संरचना, डेटा प्रवाह (Data Flow) और सभी व्यावसायिक कार्यप्रणालियों (Workflows) को आरेखों (Diagrams) और सरल उदाहरणों के साथ समझाया गया है।**

---

## 1. सिस्टम का संपूर्ण आर्किटेक्चर (Full System Architecture)

Oprino एक आधुनिक, तीन-स्तरीय (3-Tier) सुरक्षित आर्किटेक्चर पर बना है:

```mermaid
graph TB
    subgraph ClientLayer ["1. क्लाइंट लेयर (Frontend & Mobile)"]
        Web["🖥️ Web Dashboard (Next.js 15)<br/>Admin & Manager Interface"]
        Mobile["📱 Mobile App (Flutter 3.47)<br/>Android & iOS Field Worker App"]
    end

    subgraph GatewayLayer ["2. बैकएंड एवं सुरक्षा लेयर (API & Auth)"]
        API["⚙️ Fastify TypeScript API<br/>Zero-Trust Gateway & Route Guards"]
        Auth["🔑 Better Auth + Session Security<br/>Role-Based Access Control (RBAC)"]
    end

    subgraph DataLayer ["3. डेटा एवं स्टोरेज लेयर (Storage & Cache)"]
        PG[("🐘 PostgreSQL + PostGIS<br/>Row-Level Security (RLS) Isolation")]
        Redis[("⚡ Redis HA Cache & Pub/Sub<br/>Live Map Streaming (SSE) & Job Queue")]
        Storage["📦 Object Storage (Private Bucket)<br/>Direct Presigned S3/R2 / Local Drive"]
    end

    Web -->|HTTPS + Cookies| API
    Mobile -->|HTTPS + Bearer Token| API
    API --> Auth
    API -->|SET LOCAL app.current_workspace_id| PG
    API --> Redis
    API -->|15-Min Presigned URLs| Storage
    Mobile -->|Direct Binary Upload| Storage
```

---

## 2. डेटाबेस और सुरक्षा कैसे काम करती है? (Multi-Tenant RLS Security)

Oprino में एक ही डेटाबेस में सैकड़ों कंपनियों का डेटा रह सकता है, लेकिन **कंपनी A का कर्मचारी या मालिक कभी भी कंपनी B का डेटा नहीं देख सकता**। 

इसे तकनीकी भाषा में **5-Stage Zero-Trust Verification** और **Row-Level Security (RLS)** कहते हैं:
1. **गेटवे जांच:** जब कोई रिक्वेस्ट आती है, तो सर्वर चेक करता है कि टोकन असली है या नहीं।
2. **कंपनी की जांच (Tenant Check):** क्या यह यूज़र वास्तव में इस कंपनी (Workspace) का सक्रिय सदस्य है?
3. **रोल और अनुमति (RBAC):** क्या इस यूज़र को यह काम करने की अनुमति (Permission) है? (उदाहरण: Employee कभी कंपनी की सेटिंग्स नहीं बदल सकता)।
4. **डेटाबेस स्तर पर सुरक्षा (PostgreSQL RLS):** हर डेटाबेस क्वेरी से पहले सर्वर डेटाबेस को कमांड देता है:
   ```sql
   SET LOCAL app.current_workspace_id = 'company-123';
   ```
   इसके बाद डेटाबेस खुद बाकी सभी कंपनियों के डेटा पर ताला लगा देता है। अगर कोड में कोई गलती भी हो, तब भी डेटाबेस शून्य रिकॉर्ड (0 rows) लौटाएगा।
5. **ट्रांजेक्शन स्कोप:** जैसे ही रिक्वेस्ट पूरी होती है, कनेक्शन पूल में कनेक्शन साफ हो जाता है ताकि अगली रिक्वेस्ट में कोई डेटा लीक न हो।

---

## 3. मुख्य कार्यप्रणालियाँ (Detailed Operational Workflows)

### कार्यप्रणाली 1: कंपनी ऑनबोर्डिंग और कर्मचारी जोड़ना (Admin Onboarding)

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin (मालिक)
    participant W as Web Dashboard
    participant API as Fastify API
    participant DB as PostgreSQL
    actor E as New Employee (नया कर्मचारी)

    A->>W: 1. कंपनी का नाम और विवरण दर्ज किया
    W->>API: 2. POST /v1/workspaces
    API->>DB: 3. नया Workspace बनाया (Admin रोल असाइन)
    A->>W: 4. कर्मचारियों की CSV फ़ाइल अपलोड की (25-100 लोग)
    W->>API: 5. POST /v1/workspaces/members/import-csv
    API->>DB: 6. सिंगल-यूज़ इनविटेशन टोकन जनरेट किए
    API-->>E: 7. कर्मचारी को ईमेल में इनविटेशन लिंक मिला
    E->>W: 8. लिंक खोला (/auth/activate?token=XYZ)
    E->>W: 9. अपना पासवर्ड सेट किया
    W->>API: 10. POST /v1/auth/invitations/accept
    API->>DB: 11. अकाउंट सक्रिय हुआ (Active Member)
```

---

### कार्यप्रणाली 2: बायोमेट्रिक हाजिरी और ऑन-ड्यूटी ट्रैकिंग (Attendance & GPS)

```mermaid
sequenceDiagram
    autonumber
    actor E as Field Worker
    participant M as Mobile App (Flutter)
    participant S as Local Storage / Drift
    participant API as Fastify API
    participant R2 as Private Media Bucket

    E->>M: 1. 'Punch In' बटन दबाया
    M->>M: 2. फ्रंट कैमरा खुला — कर्मचारी ने सेल्फी ली
    M->>M: 3. GPS हार्डवेयर से अक्षांश/देशांतर (Lat/Lng) प्राप्त किया
    M->>API: 4. POST /v1/media/upload-url (सेल्फी के लिए URL मांगा)
    API-->>M: 5. 15-मिनट का सुरक्षित Presigned Upload URL मिला
    M->>R2: 6. सेल्फी की बाइनरी फ़ाइल सीधे स्टोरेज में अपलोड की
    M->>API: 7. POST /v1/attendance/punch-in (सेल्फी की + GPS)
    alt सर्वर पुष्टि (200 OK)
        API-->>M: 8a. हाजिरी दर्ज -> स्टेटस 'ON_DUTY'
        M->>M: 9a. बैकग्राउंड GPS ट्रैकिंग शुरू
    else रिजेक्शन (4xx - गलत लोकेशन/नीति उल्लंघन)
        API-->>M: 8b. एरर: हाजिरी अस्वीकृत
        M->>M: 9b. स्टेटस रोलबैक होकर 'NOT_STARTED' (GPS बंद)
    end
```

---

### कार्यप्रणाली 3: फील्ड टास्क, फोटो प्रूफ और डिजिटल सिग्नेचर (Task Execution)

```mermaid
sequenceDiagram
    autonumber
    actor E as Field Worker
    actor C as Site Customer
    participant M as Mobile App
    participant API as Fastify API
    actor Mgr as Manager (Web)

    Mgr->>API: 1. टास्क बनाया और कर्मचारी को असाइन किया
    E->>M: 2. टास्क लिस्ट में नया टास्क देखा और स्वीकार किया
    E->>M: 3. साइट पर पहुंचकर चेकलिस्ट के बिंदु टिक किए
    E->>M: 4. 'Take Proof Photo' दबाया (कैमरे से लाइव फोटो ली)
    M->>M: 5. फोटो पर वॉटरमार्क लगा (GPS, तारीख, कर्मचारी का नाम)
    C->>M: 6. ग्राहक ने मोबाइल स्क्रीन पर अपनी उंगली से साइन किए
    M->>API: 7. फोटो प्रूफ और ग्राहक हस्ताक्षर अपलोड किए
    M->>API: 8. टास्क स्टेटस 'SUBMITTED' मार्क किया
    Mgr->>Mgr: 9. मैनेजर ने वेब पर फोटो और साइन जांचे
    Mgr->>API: 10. टास्क को 'VERIFIED' (स्वीकृत) मार्क किया
```

---

### कार्यप्रणाली 4: ऑफलाइन सिंक और नेटवर्क रिकवरी (Offline Resilience)

जब कर्मचारी किसी बेसमेंट, लिफ्ट या दूरदराज के इलाके में होता है जहां इंटरनेट बिल्कुल नहीं है:

```mermaid
flowchart TD
    A[📱 कर्मचारी ने कोई एक्शन लिया<br/>हाजिरी / चेकलिस्ट / फोटो] --> B{इंटरनेट उपलब्ध है?}
    B -- हाँ --> C[सीधे Fastify API पर भेजा]
    B -- नहीं --> D[💾 लोकल Drift/SQLite डेटाबेस के<br/>Outbox Queue में सुरक्षित सेव किया]
    D --> E[स्क्रीन पर 🟠 OFFLINE PENDING दिखाया]
    E --> F[फोन बंद होने या ऐप रीस्टार्ट होने पर भी<br/>डेटा सुरक्षित रहता है]
    F --> G{इंटरनेट वापस आया?}
    G -- हाँ --> H[🔄 SyncService ने कतार में लगे<br/>सभी रिकॉर्ड्स को क्रम से सर्वर पर भेजा]
    H --> I[सर्वर ने 200 OK पुष्टि दी]
    I --> J[स्क्रीन पर 🟢 SERVER CONFIRMED दिखा]
    J --> K[लोकल फोन मेमोरी से टेम्परेरी फ़ाइल हटाई गई]
```

---

### कार्यप्रणाली 5: ड्यूटी समाप्ति और प्राइवेसी सुरक्षा (Punch Out & Zero GPS)

कर्मचारियों के मानवाधिकार और डेटा सुरक्षा (GDPR/Privacy Invariants) के तहत:

1. जैसे ही कर्मचारी मोबाइल पर **'Punch Out'** दबाता है:
   - ऐप तुरंत Android OS के Foreground Location Service को टर्मिनेट (Kill) कर देता है।
   - मोबाइल की स्क्रीन पर स्टेटस **OFF DUTY** हो जाता है।
2. यदि डिवाइस के नेटवर्क लैग या किसी बग के कारण कोई पुराना GPS पॉइंट Punch Out के बाद सर्वर पर पहुंचे:
   - सर्वर कर्मचारी का एक्टिव सेशन चेक करता है।
   - एक्टिव सेशन न मिलने पर सर्वर उस डेटा को डेटाबेस में लिखे बिना तुरंत **403 Forbidden (`OFF_DUTY_TRACKING_PROHIBITED`)** के साथ ड्रॉप कर देता है।
3. **30-दिन का स्वतः डेटा प्रूनिंग (Retention Policy):**
   - डेटाबेस में एक ऑटोमैटिक जॉब चलता है जो 30 दिन से पुराने GPS ब्रेडक्रम्ब्स को हमेशा के लिए डिलीट कर देता है, ताकि कंपनियों को अनावश्यक डेटा स्टोरेज का खर्च न उठाना पड़े और प्राइवेसी कानून का पालन हो।

---

## 4. तकनीकी शब्दों का सरल शब्दकोश (Glossary for Owners)

| तकनीकी शब्द | सरल हिंदी में मतलब | Oprino में इसका महत्व |
|---|---|---|
| **Multi-Tenancy** | बहु-किरायेदारी (एक ही सॉफ्टवेयर में कई कंपनियों का अलग-अलग डेटा) | आपके सर्वर का खर्च 90% कम होता है क्योंकि हर कंपनी के लिए अलग सर्वर नहीं खरीदना पड़ता। |
| **Row-Level Security (RLS)** | डेटाबेस में पंक्ति स्तर पर सुरक्षा | कंपनी का डेटा लीक होने से रोकने की दुनिया की सबसे मजबूत डेटाबेस सुरक्षा तकनीक। |
| **Offline-First** | पहले लोकल में सेव, फिर इंटरनेट पर | भारत या अन्य देशों में जहां इंटरनेट कटता रहता है, वहां ऐप कभी हैंग या क्रैश नहीं होता। |
| **Presigned URL** | पूर्व-हस्ताक्षरित सुरक्षित लिंक | आपका मुख्य सर्वर फोटो अपलोड से धीमा नहीं होता; मोबाइल सीधे क्लाउड स्टोरेज पर फोटो भेजता है। |
| **ForeGround Service** | Android की निरंतर चलने वाली सेवा | जब मोबाइल की स्क्रीन बंद होती है, तब भी ड्यूटी के दौरान लोकेशन ट्रैक होती रहती है। |
| **Doze Mode** | Android का बैटरी सेवर सिस्टम | फोन की बैटरी बचाने के लिए Android बैकग्राउंड ऐप्स को रोकता है; Oprino की सर्विस इसे बायपास करने के लिए अधिकृत है। |
