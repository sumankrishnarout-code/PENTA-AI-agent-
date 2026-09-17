# Penta AI Agent

Penta is an artificial intelligence assistant interface powered by Groq high-performance language models and built using Python, Flask, and LangChain. It provides a real-time streaming web chat application as well as a command-line interface.

---

## Features

- **Real-Time Streaming**: Server-Sent Events (SSE) deliver streamed AI response chunks with minimal latency.
- **Text-to-Speech Integration**: Built-in speech synthesis allows users to read responses aloud directly from the chat interface.
- **Thread Management**: Supports multi-thread history tracking with persistent state and thread deletion capabilities.
- **Responsive Web Interface**: Modern, dark-themed user interface designed for readability and accessibility.
- **Command-Line Mode**: Includes an interactive CLI chat option for quick terminal-based testing and usage.

---

## Tech Stack

- **Backend**: Python, Flask, LangChain, LangChain-Groq
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Marked.js
- **Model**: Groq LLM API (`openai/gpt-oss-120b`)

---

## Prerequisites

- Python 3.8 or higher
- A valid Groq API key

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sumankrishnarout-code/PENTA-AI-agent-.git
   cd PENTA-AI-agent-
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required dependencies:
   ```bash
   pip install flask langchain-core langchain-groq
   ```

---

## Configuration

Set your Groq API key as an environment variable:

**Windows (PowerShell):**
```powershell
$env:GROQ_API_KEY="your_groq_api_key_here"
```

**Windows (CMD):**
```cmd
set GROQ_API_KEY=your_groq_api_key_here
```

**Linux / macOS:**
```bash
export GROQ_API_KEY="your_groq_api_key_here"
```

Alternatively, you can update the fallback `GROQ_API_KEY` variable in `abc.py`.

---

## Running the Application

### 1. Web Application Mode

Run the main script to start the local Flask development server:

```bash
python abc.py
```

Open your browser and navigate to:
```text
http://127.0.0.1:5000
```

### 2. Command-Line (CLI) Mode

To run Penta directly inside your terminal:

```bash
python abc.py --cli
```

Type your prompt when asked, or type `exit` to end the session.

---

## Project Structure

```text
PENTA-AI-agent-/
├── abc.py              # Main Flask application and CLI entry point
├── static/
│   ├── index.html      # Frontend HTML template
│   ├── styles.css      # Custom dark theme stylesheet
│   └── app.js          # Client-side chat logic & speech synthesis
├── .gitignore          # Git exclusion patterns
└── README.md           # Project documentation
```

---

## License

This project is open source and available under the MIT License.
