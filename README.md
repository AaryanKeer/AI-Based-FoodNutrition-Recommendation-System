# NutriTrack – Food Recommendation System using AI

NutriTrack is a personalised food recommendation system designed to promote healthier eating habits for both general users and individuals with dietary restrictions such as diabetes and hypertension. It combines structured nutritional data, user profiles, and rule-based filtering logic to suggest suitable meals across different meal times (breakfast, lunch, snacks, and dinner).

---


## 🚀 Features

- 👤 **Personalised recommendations** based on age, weight, height, activity level, and dietary preference.
- 🩺 **Support for chronic conditions** like diabetes and hypertension with nutrient-based filtering.
- 📊 **Meal categorisation** (breakfast, lunch, dinner, snacks) with caloric and macronutrient alignment.
- 💾 **User profile and meal tracking** with persistent storage via MongoDB.
- 🌐 **Interactive dashboard** for login, profile updates, and recommendation views.
- 🧠 **Experimental GCN Model** in Google Colab for exploring future machine learning integration.

---


## 🧱 System Architecture

### 1. Data Pipeline (Python - Google Colab)
- **Libraries Used**: `pandas`, `numpy`, `scikit-learn`, `PyTorch`
- **Process**:
  - Merges and cleans food datasets (Indian_Food, IFCT-2017)
  - Feature encoding, scaling, and label transformation
  - Implements KNN and GCN (BetterGCN) model for nutrient similarity and meal classification
  - Outputs: `merged_food.json` used in backend


### 2. Backend (Node.js + Express)
- **Database**: MongoDB (users, meals)
- **Endpoints**:
  - `POST /api/auth/register`: User registration
  - `POST /api/auth/login`: User login
  - `POST /api/recommend`: Meal recommendations based on user profile
  - Additional routes for saving meals and profile updates


### 3. Frontend (React + Vite)
- Responsive UI for:
  - Registering and logging in
  - Updating user details and health conditions
  - Viewing and selecting recommended meals
  - Displaying nutrient breakdown and warning messages

---



## 🤖 AI/ML Component (Colab)

Although not integrated into the live app, a **Graph Convolutional Network (GCN)** was trained on food nutrient vectors using label-encoded meal types.  
This was conducted to explore performance improvements and future model-based suggestions.

- **Model**: Custom BetterGCN
- **Accuracy Achieved**: ~94% (on dominant meal classes)
- **Evaluation**: Confusion Matrix, Accuracy, Loss Curves

📁 GCN experimentation is available on my Colab notebook

---


## 📂 Project Structure

**Basic Project structure**

NutriTrack/
│
├── backend/                 # Node.js + Express API + data
│   ├── routes/
│   ├── data/merged_food.json
│   ├── models/
│   └── utils/
│
├── frontend/                # React + Vite frontend
│   └── src/
│       ├── components/
│       └── pages/
│
│
│  
│
├── dataset/
│   ├── Indian_Food.csv
│   ├── IFCT_2017.csv
│   
│
└── README.md



🧪 How to Run
Backend:
cd backend
npm install
npm start


Frontend:
cd frontend
npm install
npm run dev


MongoDB
Ensure your MongoDB Atlas connection string is correctly set in .env.

📌 Limitations
No live ML deployment for GCN (GCN only in experimental phase)

Data coverage limited to Indian foods

Evaluation limited to rule-based output, not real user feedback

🧭 Future Scope
🧠 Integration of ML models like GCN, Transformers

🧪 Real-time nutrient tracking via wearables or barcode scanning

🌍 Global dataset expansion for international applicability

📱 Native mobile app version


📜 License
This project is for academic and demonstrative purposes. Dataset sources are acknowledged and not redistributed beyond project scope.



🙋‍♂️ Author
Your Aaryan S. Keer
GitHub: AaryanKeer