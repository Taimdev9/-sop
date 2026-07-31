# LAST BEAT (آخر نبضة) 🫀
> **Sop Game Jam 2026 Entry - Theme: Critical Point**

![LAST BEAT Cover](https://img.shields.io/badge/Status-Playable_Full_Game-00ff66)
![Tech Stack](https://img.shields.io/badge/Tech-Three.js_|_Web_Audio_API_|_HTML5-ff1e43)

## 📌 عن اللعبة (About)
**LAST BEAT** هي لعبة رعب نفسي وتجربة تفاعلية 3D من منظور الشخص الأول (First-Person Psychological Horror & Story Adventure).
تم بناء اللعبة بالكامل باستخدام **Three.js** و **Web Audio API** بدون أي محركات خارجية ثقيلة، وتعمل مباشرة على المتصفح لمختلف الأجهزة (Computer, Phone, Tablet, iPad).

---

## 📜 القصة (Storyline)
في عام **2089**، يعاني البطل من مرض قلب نادر منذ طفولته. يخضع لعملية زراعة قلب ذكي جديدة داخل مستشفى متطور.
أثناء العملية، يدخل البطل في غيبوبة وتجربة نفسية غامضة داخل عقله بين الحياة والموت:
- يعتقد أنه يحاول إنقاذ المستشفى والمفاعل من الانهيار.
- يكتشف لاحقاً أن المفاعل لم يكن سوى رمزيّة لقلبه الحقيقي الذي يقاتل للبقاء على قيد الحياة على طاولة العمليات.

---

## ⚙️ أهم الأنظمة الميكانيكية (Core Mechanics)

### ❤️ نظام استقرار القلب (Heart Stability System)
لا يوجد شريط صحة (HP Bar)، بل يعتمد كل شيء على **Heart Stability (100% ➔ 0%)**:
- **100% - 70%:** استقرار حيوي وهدوء محيطي.
- **50% - 30%:** تسارع التنفس وظهور ذكريات الطفولة المرضية.
- **20% (Critical Point):** احمرار حواف الشاشة، اهتزاز الكاميرا، توقف الموسيقى، وارتفاع أصوات الصفير والنبض.
- **15% (Adrenaline Burst):** سرعة حركة مضاعفة للنجاة لكن مع هبوط مستمر للنسبة الحيوية.
- **0% (Flatline):** توقف النبض والنهاية السلبية.

### 🎧 محرك الصوت التخليقي (Procedural Web Audio API)
توليد كامل لنغمات ودقات القلب، أصوات التفريغ الكهربائي، التنفس، وصفير الأذن آلياً وبرمجياً دون الحاجة لملفات صوت خارجية.

---

## 🎮 عناصر التحكم (Controls)

| الجهاز | الحركة (Movement) | الركض (Run) | التفاعل (Interact) |
| :--- | :--- | :--- | :--- |
| **Computer** | `W, A, S, D` / `Arrows` | `Left Shift` | `E` / `Space` / `Click` |
| **Phone / Tablet** | Virtual On-screen Joystick | Touch Run Button 🏃 | Touch Interact ✋ |

---

## 👥 فريق التطوير (Credits)
- **Studio:** TRL TEAM FOR DEVELOPMENT
- **Game Creator & Developer:** TAIM
- **Event:** Sop Game Jam 2026