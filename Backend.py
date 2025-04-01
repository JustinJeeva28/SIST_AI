from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv
import weaviate
from groq import Groq

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('chatbot.log'), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class Config:
    WEAVIATE_URL = os.getenv("WEAVIATE_URL")
    WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    CLASS_NAME = "Sathyabama UniversityDocuments"
    TOP_K = 10

config = Config()

class WeaviateManager:
    def __init__(self):
        try:
            # Verify connection first
            self.client = weaviate.Client(
                url=config.WEAVIATE_URL,
                auth_client_secret=weaviate.auth.AuthApiKey(api_key=config.WEAVIATE_API_KEY),
                additional_headers={
                    "X-Weaviate-Api-Key": config.WEAVIATE_API_KEY,
                    "X-Weaviate-Cluster-Url": config.WEAVIATE_URL
                },
                timeout_config=(5, 15)
            )
            
            # Verify server is live
            if not self.client.is_live():
                raise ConnectionError("Weaviate server not reachable")
            
            logger.info("Weaviate connection established")
            
        except Exception as e:
            logger.critical(f"Weaviate initialization failed: {str(e)}")
            raise RuntimeError("Failed to initialize Weaviate") from e

    def query_documents(self, query: str) -> List[Dict]:
        try:
            result = self.client.query.get(
                config.CLASS_NAME,
                ["content", "filename", "page_number"]
            ).with_hybrid(query=query, alpha=0.5).with_limit(config.TOP_K).do()
            return result["data"]["Get"][config.CLASS_NAME]
        except Exception as e:
            logger.error(f"Query error: {str(e)}")
            return []

class GroqResponder:
    def __init__(self):
        self.client = Groq(api_key=config.GROQ_API_KEY)
        self.system_prompt = """🎓 Welcome to Sathyabama University AI Assistant! 
        You are a friendly, knowledgeable guide helping with:
        - Admissions 💼
        - Academic programs 📚
        - Campus facilities 🏫
        - Student life 🎉
        🔥 Use ONLY the provided documents to answer.  
        📌 If you don't find an answer, say:  
        "I don't have enough information. Please check the official website."
        🔹 Answer in **structured sections** using **bullet points** when needed.  
        🔹 Keep responses engaging but **clear and professional**.
        Current Context: {context}"""
        
        # Chat history for memory
        self.chat_histories = {}  # Dictionary to store chat histories by session ID

    def _format_response(self, text: str) -> str:
        """Format the response - simplified for API use"""
        return text

    def generate_response(self, query: str, context: List[str], session_id: str) -> str:
        try:
            logger.info(f"🟢 Generating response for session: {session_id}")
            logger.info(f"📝 User Query: {query}")

            # Initialize chat history for this session if it doesn't exist
            if session_id not in self.chat_histories:
                self.chat_histories[session_id] = []

            logger.info(f"🗃️ Retrieved chat history (Last 10 messages): {self.chat_histories[session_id][-10:]}")

            # Build messages with history
            messages = [{
                "role": "system",
                "content": self.system_prompt.format(context=" ".join(context))
            }]

            # Add chat history (up to last 10 exchanges)
            messages.extend(self.chat_histories[session_id][-10:])
            
            # Add current query
            messages.append({
                "role": "user",
                "content": query
            })

            logger.info(f"📤 Sending messages to Groq API: {messages}")

            try:
                response = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.3,
                    max_tokens=1024
                )
            except Exception as api_error:
                logger.error(f"❌ Groq API Request Failed: {str(api_error)}")
                return "🔴 Error: Groq API request failed. Please try again."

            # Validate response structure
            if not response or not hasattr(response, "choices") or not response.choices:
                logger.error("❌ Invalid response received from Groq API")
                return "🔴 Error: Invalid response received from AI. Try again later."

            response_content = response.choices[0].message.content.strip()
            logger.info(f"✅ Groq API Response: {response_content}")

            # Update chat history
            self.chat_histories[session_id].append({"role": "user", "content": query})
            self.chat_histories[session_id].append({"role": "assistant", "content": response_content})

            return self._format_response(response_content)

        except Exception as e:
            logger.error(f"🔥 Unexpected Error in generate_response: {str(e)}")
            return "🔴 Sorry, an unexpected error occurred while processing your request."


# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Enable CORS for all routes

# Initialize components
try:
    weaviate_mgr = WeaviateManager()
    groq_responder = GroqResponder()
    logger.info("Backend services initialized successfully")
except Exception as e:
    logger.critical(f"Failed to initialize backend services: {str(e)}")
    weaviate_mgr = None
    groq_responder = None

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get('message', '')
        session_id = data.get('sessionId', 'default')
        
        if not user_input.strip():
            return jsonify({"error": "Empty message"}), 400
        
        if not weaviate_mgr or not groq_responder:
            return jsonify({"error": "Backend services not initialized"}), 500
        
        # Retrieve relevant documents
        context_results = weaviate_mgr.query_documents(user_input)
        context = [result["content"] for result in context_results]
        
        # Generate response using retrieved context
        response = groq_responder.generate_response(user_input, context, session_id)
        
        return jsonify({"response": response})
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5173))
    app.run(host="0.0.0.0", port=port, debug=False)