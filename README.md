# Pro1101910

## Installation

Follow these steps to set up the project on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- Expo CLI installed globally (`npm install -g expo-cli`)
- A [Firebase](https://firebase.google.com/) account and project set up

### Steps

1. **Clone the Repository**

   Open your terminal and run the following commands:

   ```bash
   git clone https://github.com/ISnowSakuraI/Pro1101910.git
   cd Pro1101910
   ```

2. **Install Dependencies**

   Run the following command to install the necessary dependencies:

   ```bash
   npm install
   ```

3. **Set Up Firebase**

   - Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore, Storage, and Authentication in your Firebase project.
   - Copy your Firebase configuration and replace the existing configuration in `firebase/Firebase.js`.

4. **Prebuild the Project**

   Run the following command to prebuild the project:

   ```bash
   npm run prebuild
   ```

5. **Run the Project**

   Start the Expo development server:

   ```bash
   npx expo start
   ```

   Use the Expo Go app on your mobile device to scan the QR code and run the app.

---

# Pro1101910

## การติดตั้ง

ทำตามขั้นตอนเหล่านี้เพื่อตั้งค่าโปรเจกต์บนเครื่องของคุณ

### ข้อกำหนดเบื้องต้น

- ติดตั้ง [Node.js](https://nodejs.org/)
- ติดตั้ง Expo CLI (`npm install -g expo-cli`)
- มีบัญชีและโปรเจกต์ [Firebase](https://firebase.google.com/)

### ขั้นตอน

1. **โคลน Repository**

   เปิดเทอร์มินัลและรันคำสั่งต่อไปนี้:

   ```bash
   git clone https://github.com/ISnowSakuraI/Pro1101910.git
   cd Pro1101910
   ```

2. **ติดตั้ง Dependencies**

   รันคำสั่งต่อไปนี้เพื่อติดตั้ง dependencies ที่จำเป็น:

   ```bash
   npm install
   ```

3. **ตั้งค่า Firebase**

   - สร้างโปรเจกต์ใน [Firebase Console](https://console.firebase.google.com/).
   - เปิดใช้งาน Firestore, Storage และ Authentication
   - คัดลอกการตั้งค่า Firebase ของคุณมาแทนที่ไฟล์ `firebase/Firebase.js`.

4. **Prebuild โปรเจกต์**

   รันคำสั่งต่อไปนี้เพื่อ prebuild โปรเจกต์:

   ```bash
   npm run prebuild
   ```

5. **รันโปรเจกต์**

   เริ่มการทำงานของเซิร์ฟเวอร์ Expo:

   ```bash
   npx expo start
   ```

   ใช้แอป Expo Go บนอุปกรณ์มือถือของคุณเพื่อสแกน QR code และรันแอป
