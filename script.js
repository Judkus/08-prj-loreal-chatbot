/* DOM elements - Get references to HTML elements we'll use */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

// L'Oréal-specific system prompt for the AI
const SYSTEM_PROMPT = `You are L'Oréal's Smart Product Advisor, an expert beauty consultant specializing in L'Oréal products and beauty routines. Your role is to:

WHAT YOU DO:
• Recommend L'Oréal products for skincare, haircare, makeup, and fragrance
• Provide personalized beauty routines using L'Oréal products
• Explain product benefits, ingredients, and application techniques
• Suggest products based on skin type, hair type, concerns, and preferences
• Offer step-by-step beauty tutorials and tips
• Help customers find products for specific needs (anti-aging, acne, color correction, etc.)

WHAT YOU DON'T DO:
• Discuss non-L'Oréal brands or competitor products
• Provide medical advice or diagnose skin/hair conditions
• Answer questions unrelated to beauty, skincare, or L'Oréal products
• Engage in topics outside of beauty and cosmetics

TONE & STYLE:
• Professional yet friendly and approachable
• Enthusiastic about beauty and L'Oréal products
• Helpful and knowledgeable
• Encouraging and supportive

If asked about topics outside your expertise, politely redirect: "I'm here to help with L'Oréal products and beauty advice. How can I assist you with your beauty routine today?"

Always provide specific L'Oréal product recommendations when possible and explain why they're suitable for the customer's needs.`;

// Set initial welcome message when page loads
chatWindow.innerHTML =
  "<div class=\"msg ai\">👋 Hello! I'm your L'Oréal Smart Product Advisor. I'm here to help you discover the perfect L'Oréal products and create personalized beauty routines. What can I help you with today?</div>";

/* Handle form submit - This runs when user clicks send or presses Enter */
chatForm.addEventListener("submit", async (e) => {
  // Prevent form from refreshing the page
  e.preventDefault();

  // Get the user's message and remove extra spaces
  const message = userInput.value.trim();

  // Check if message is empty - don't send empty messages
  if (!message) {
    return;
  }

  // Check if message is too long (optional validation)
  if (message.length > 1000) {
    alert("Please keep your message under 1000 characters.");
    return;
  }

  // Display the user's message in the chat window
  addMessage(message, "user");

  // Clear the input field so user can type a new message
  userInput.value = "";

  // Disable send button to prevent multiple submissions
  sendBtn.disabled = true;

  // Show loading message while waiting for AI response
  addMessage("Thinking...", "ai", true);

  try {
    // Call OpenAI API to get AI response
    const response = await callOpenAI(message);

    // Remove loading message and add AI response
    removeLastMessage();
    addMessage(response, "ai");
  } catch (error) {
    // Remove loading message and show error
    removeLastMessage();
    addMessage(
      "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
      "ai"
    );
    console.error("OpenAI API error:", error);
  } finally {
    // Re-enable send button
    sendBtn.disabled = false;
    // Focus back on input field for next message
    userInput.focus();
  }
});

// Handle Enter key press in input field (additional way to send message)
userInput.addEventListener("keypress", (e) => {
  // Check if Enter key was pressed
  if (e.key === "Enter") {
    // Prevent default behavior and submit form
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

// Auto-focus on input field when page loads
userInput.focus();

// Function to add messages to chat window
function addMessage(message, sender, isLoading = false) {
  // Create a new div element for the message
  const messageDiv = document.createElement("div");
  messageDiv.className = `msg ${sender}`;

  // Add special ID for loading messages so we can remove them later
  if (isLoading) {
    messageDiv.id = "loading-message";
  }

  // Set the message text
  messageDiv.textContent = message;

  // Add message to chat window
  chatWindow.appendChild(messageDiv);

  // Scroll to bottom to show newest message
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Function to remove the last message (used for loading states)
function removeLastMessage() {
  const loadingMessage = document.getElementById("loading-message");
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

// Function to send request to OpenAI's Chat Completions API
async function callOpenAI(userMessage) {
  // Get API key from secrets.js file
  const API_KEY = window.OPENAI_API_KEY;

  // Check if API key is available
  if (!API_KEY || API_KEY === "your-api-key-here") {
    throw new Error(
      "OpenAI API key not found. Please check your secrets.js file."
    );
  }

  // Prepare the request data for OpenAI API
  const requestData = {
    model: "gpt-4o", // Using GPT-4o as specified in instructions
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    max_tokens: 500, // Limit response length
    temperature: 0.7, // Control creativity (0.0 = very focused, 1.0 = very creative)
    top_p: 1, // Control diversity
    frequency_penalty: 0, // Control repetition
    presence_penalty: 0, // Control topic diversity
  };

  // Make the API request using fetch (no external libraries needed)
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(requestData),
  });

  // Check if the request was successful
  if (!response.ok) {
    // Get error details from response
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.error?.message ||
      `API request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  // Parse the JSON response from OpenAI
  const data = await response.json();

  // Check if we got a valid response
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from OpenAI API");
  }

  // Return the AI's message content
  return data.choices[0].message.content;
}

// Log that the script has loaded successfully
console.log("L'Oréal Smart Product Advisor chatbot loaded successfully!");
