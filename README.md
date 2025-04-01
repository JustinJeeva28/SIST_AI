# SIST AI – An AI-powered Assistant for Sathyabama University

SIST AI is a Retrieval-Augmented Generation (RAG)-based AI application designed to provide students and faculty with comprehensive information about Sathyabama University. It helps users access details about courses, faculty, events, policies, and research materials efficiently.

## Features

- **AI-Powered Responses**: Uses Groq API's Llama 3.3 70B model for intelligent and context-aware answers.
- **Semantic Search**: Weaviate enables vector storage, embedding, and efficient data retrieval.
- **Secure Access**: Supabase is used for user authentication and file storage.
- **User-Friendly Interface**: Developed with React for seamless front-end interactions.
- **Robust Backend**: Flask is used for API management and query processing.

---

## Installation & Setup

### 1. Clone the Repository
```sh
git clone https://github.com/yourusername/SIST-AI.git
cd SIST-AI
```

### 2. Setting Up the Frontend
```sh
cd Sist_ai
npm install  # Install dependencies
npm run dev  # Start the frontend server
```

### 3. Setting Up the Backend
```sh
python -m venv venv  # Create a virtual environment
source venv/bin/activate  # Activate virtual environment (Linux/macOS)
venv\Scripts\activate  # Activate virtual environment (Windows)
```

### 4. Install Backend Dependencies
```sh
pip install -r requirements.txt
```

### 5. Configure Environment Variables
Copy `.example.env` to `.env` and fill in the required API keys and database credentials:
```sh
cp .example.env .env
```
Edit `.env` and replace placeholder values with your actual API keys.

### 6. Start the Backend Server
```sh
python Backend.py  # Start Flask backend
```

---

## Project Structure
```
/ (Main Directory)
├── .example.env
├── Backend.py
├── requirements.txt
├── Sist_ai/
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── supabase.js
│       ├── supabaseClient.js
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── SistImg.jsx
│       └── Pages/
│           ├── ChatbotPage.jsx
│           ├── ForgotPassword.jsx
│           ├── HomePage.jsx
│           ├── LoginPage.jsx
│           ├── ResetPasswordPage.jsx
│           └── SignupPage.jsx
```

---

## Technologies Used

### **Frontend**
- React (UI framework)
- Tailwind CSS (Styling)
- Axios (API calls)

### **Backend**
- Flask (Python web framework)
- Weaviate (Vector database)
- Supabase (User authentication & file storage)
- Groq API (LLM model)
