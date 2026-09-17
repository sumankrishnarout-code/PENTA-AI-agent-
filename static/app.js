const STORAGE_KEY = "penta-threads-v1";

const prompts = [
  "Explain this project like I am new to AI agents.",
  "Write a clean Python function that retries an API call.",
  "Compare streaming chat UIs vs waiting for a full reply.",
  "Draft a short launch note for an original AI agent named Penta.",
];

const els = {
  rail: document.getElementById("rail"),
  threads: document.getElementById("threads"),
  transcript: document.getElementById("transcript"),
  composer: document.getElementById("composer"),
  input: document.getElementById("input"),
  send: document.getElementById("send"),
  stop: document.getElementById("stop"),
  newChat: document.getElementById("new-chat"),
  title: document.getElementById("thread-title"),
  menu: document.getElementById("menu-toggle"),
};

let state = loadState();
let activeId = state.threads[0]?.id || createThread().id;
let abortController = null;
let currentSpeakingBtn = null;

if (window.marked) {
  marked.setOptions({ gfm: true, breaks: true });
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

els.newChat.addEventListener("click", () => {
  stopSpeech();
  const thread = createThread();
  activeId = thread.id;
  render();
  els.input.focus();
});

els.menu.addEventListener("click", () => els.rail.classList.toggle("open"));

els.input.addEventListener("input", () => {
  els.input.style.height = "auto";
  els.input.style.height = `${Math.min(els.input.scrollHeight, 180)}px`;
});

els.input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    els.composer.requestSubmit();
  }
});

els.stop.addEventListener("click", () => abortController?.abort());

els.composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = els.input.value.trim();
  if (!text || abortController) return;
  els.input.value = "";
  els.input.style.height = "auto";
  await sendMessage(text);
});

render();
els.input.focus();

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "");
    if (parsed?.threads?.length) return parsed;
  } catch {
    /* start fresh */
  }
  return { threads: [] };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createThread() {
  const thread = {
    id: crypto.randomUUID(),
    title: "New thread",
    messages: [],
  };
  state.threads.unshift(thread);
  saveState();
  return thread;
}

function activeThread() {
  return state.threads.find((thread) => thread.id === activeId) || state.threads[0];
}

function render() {
  const thread = activeThread();
  activeId = thread.id;
  els.title.textContent = thread.title;
  renderThreads();
  renderTranscript(thread);
}

function deleteThread(id) {
  stopSpeech();
  state.threads = state.threads.filter((t) => t.id !== id);
  if (!state.threads.length) {
    const fresh = createThread();
    activeId = fresh.id;
  } else if (activeId === id) {
    activeId = state.threads[0].id;
  }
  saveState();
  render();
}

function renderThreads() {
  els.threads.innerHTML = "";
  state.threads.forEach((thread) => {
    const item = document.createElement("div");
    item.className = `thread-item${thread.id === activeId ? " active" : ""}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "thread-btn";
    button.textContent = thread.title;
    button.title = thread.title;
    button.addEventListener("click", () => {
      stopSpeech();
      activeId = thread.id;
      els.rail.classList.remove("open");
      render();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-thread-btn";
    deleteBtn.title = "Delete thread";
    deleteBtn.setAttribute("aria-label", "Delete thread");
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"></path>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    `;

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteThread(thread.id);
    });

    item.append(button, deleteBtn);
    els.threads.appendChild(item);
  });
}

function renderTranscript(thread) {
  els.transcript.innerHTML = "";
  if (!thread.messages.length) {
    els.transcript.appendChild(emptyState());
    return;
  }
  thread.messages.forEach((message) => {
    els.transcript.appendChild(messageEl(message.role, message.content));
  });
  els.transcript.scrollTop = els.transcript.scrollHeight;
}

function emptyState() {
  const wrap = document.createElement("div");
  wrap.className = "empty";
  wrap.innerHTML = `
    <h2>Ready when you are.</h2>
    <p>Penta keeps the thread, streams the answer, and stays on the question you actually asked.</p>
  `;
  const grid = document.createElement("div");
  grid.className = "prompts";
  prompts.forEach((text) => {
    const button = document.createElement("button");
    button.className = "prompt";
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", () => sendMessage(text));
    grid.appendChild(button);
  });
  wrap.appendChild(grid);
  return wrap;
}

function stopSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (currentSpeakingBtn) {
    currentSpeakingBtn.classList.remove("speaking");
    const label = currentSpeakingBtn.querySelector(".action-label");
    if (label) label.textContent = "Read aloud";
    currentSpeakingBtn.setAttribute("title", "Read aloud");
    currentSpeakingBtn = null;
  }
}

function stripMarkdownAndHTML(text) {
  if (!text) return "";
  const temp = document.createElement("div");
  if (window.marked) {
    temp.innerHTML = marked.parse(text);
  } else {
    temp.textContent = text;
  }
  return (temp.innerText || temp.textContent || "").trim();
}

function toggleSpeech(rawText, button) {
  if (!("speechSynthesis" in window)) {
    alert("Text-to-speech is not supported in this browser.");
    return;
  }

  const label = button.querySelector(".action-label");

  if (currentSpeakingBtn === button) {
    stopSpeech();
    return;
  }

  stopSpeech();

  const textToRead = stripMarkdownAndHTML(rawText);
  if (!textToRead) return;

  window.speechSynthesis.cancel();
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.lang = "en-US";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const voice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
    if (voice) utterance.voice = voice;
  }

  button.classList.add("speaking");
  if (label) label.textContent = "Speaking...";
  button.setAttribute("title", "Stop reading");
  currentSpeakingBtn = button;

  utterance.onend = () => {
    if (currentSpeakingBtn === button) {
      button.classList.remove("speaking");
      if (label) label.textContent = "Read aloud";
      button.setAttribute("title", "Read aloud");
      currentSpeakingBtn = null;
    }
  };

  utterance.onerror = (err) => {
    console.warn("Speech synthesis error:", err);
    if (currentSpeakingBtn === button) {
      button.classList.remove("speaking");
      if (label) label.textContent = "Read aloud";
      button.setAttribute("title", "Read aloud");
      currentSpeakingBtn = null;
    }
  };

  window.speechSynthesis.speak(utterance);
}

function messageEl(role, content, streaming = false) {
  const row = document.createElement("article");
  row.className = `message ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "You" : "P";
  const bubble = document.createElement("div");
  bubble.className = `bubble${streaming ? " typing" : ""}`;
  const who = document.createElement("div");
  who.className = "who";
  who.textContent = role === "user" ? "You" : "Penta";
  const body = document.createElement("div");
  body.className = "md";
  body.innerHTML = format(content);
  bubble.append(who, body);

  if (role === "assistant") {
    const actions = document.createElement("div");
    actions.className = "message-actions";

    const speakBtn = document.createElement("button");
    speakBtn.type = "button";
    speakBtn.className = "speak-btn";
    speakBtn.title = "Read aloud";
    speakBtn.setAttribute("aria-label", "Read aloud");
    speakBtn.innerHTML = `
      <svg class="speaker-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      </svg>
      <span class="action-label">Read aloud</span>
    `;

    speakBtn.addEventListener("click", () => {
      const latestText = body.innerText || body.textContent || content;
      toggleSpeech(latestText, speakBtn);
    });

    actions.appendChild(speakBtn);
    bubble.appendChild(actions);
  }

  row.append(avatar, bubble);
  return row;
}

function format(text) {
  const raw = text || "";
  if (window.marked) return marked.parse(raw);
  return raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");
}

async function sendMessage(text) {
  const thread = activeThread();
  thread.messages.push({ role: "user", content: text });
  if (thread.title === "New thread") {
    thread.title = text.slice(0, 42) + (text.length > 42 ? "…" : "");
  }
  thread.messages.push({ role: "assistant", content: "" });
  saveState();
  render();

  const assistant = thread.messages[thread.messages.length - 1];
  const bubble = els.transcript.querySelector(".message.assistant:last-of-type .bubble");
  const body = bubble?.querySelector(".md");
  setBusy(true);

  abortController = new AbortController();
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: thread.messages.slice(0, -1) }),
      signal: abortController.signal,
    });

    if (!response.ok || !response.body) {
      const err = await response.json().catch(() => ({ error: "Request failed." }));
      throw new Error(err.error || "Request failed.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        const line = part.replace(/^data:\s*/, "").trim();
        if (!line || line === "[DONE]") continue;
        const payload = JSON.parse(line);
        if (payload.error) throw new Error(payload.error);
        assistant.content += payload.delta || "";
        if (body) body.innerHTML = format(assistant.content);
        if (bubble) bubble.classList.add("typing");
        els.transcript.scrollTop = els.transcript.scrollHeight;
      }
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      assistant.content = assistant.content || `I could not finish that reply. ${error.message}`;
      if (body) body.innerHTML = `<p class="error">${assistant.content}</p>`;
    }
  } finally {
    if (bubble) bubble.classList.remove("typing");
    abortController = null;
    setBusy(false);
    saveState();
    render();
  }
}

function setBusy(busy) {
  els.send.disabled = busy;
  els.stop.hidden = !busy;
  els.input.disabled = busy;
}
