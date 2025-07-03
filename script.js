/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// This function sends a message to the OpenAI API and returns the assistant's reply
async function getOpenAIResponse(userMessage) {
  // Call the backend proxy instead of OpenAI directly
  const response = await fetch("http://localhost:3001/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: userMessage })
  });

  const result = await response.json();
  return result.reply;
}

// Helper function to add a message to the chat window
function addMessageToChat(role, message) {
  const messageDiv = document.createElement("div");
  // Use .msg.user for user, .msg.ai for assistant (matches style.css)
  if (role === "user") {
    messageDiv.className = "msg user";
  } else {
    messageDiv.className = "msg ai";
  }
  messageDiv.textContent = message;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}

// Set initial message
chatWindow.innerHTML = ""; // Clear any previous content
addMessageToChat("assistant", "👋 Hello! How can I help you today?");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = userInput.value;
  if (!userMessage) return;

  // Show user's message
  addMessageToChat("user", userMessage);
  userInput.value = "";

  // Show a loading message while waiting for the API
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "msg ai";
  loadingDiv.textContent = "Thinking...";
  chatWindow.appendChild(loadingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Get assistant's reply from OpenAI
  try {
    const reply = await getOpenAIResponse(userMessage);
    loadingDiv.textContent = reply;
  } catch (error) {
    loadingDiv.textContent =
      "Sorry, there was a problem connecting to the assistant.";
  }
});
