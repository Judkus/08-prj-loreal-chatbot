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

    // Remove loading message and add AI response with typing effect
    removeLastMessage();
    addMessageWithTyping(response, "ai");
  } catch (error) {
    // Remove loading message and show error
    removeLastMessage();

    // Provide more specific error messages based on the error type
    let errorMessage =
      "Sorry, I'm having trouble connecting right now. Please try again in a moment.";

    if (error.message.includes("API key")) {
      errorMessage =
        "⚠️ API configuration issue. Please check your setup and try again.";
    } else if (error.message.includes("429")) {
      errorMessage =
        "⏳ I'm getting too many requests right now. Please wait a moment and try again.";
    } else if (error.message.includes("401")) {
      errorMessage =
        "🔐 Authentication issue. Please check your API key configuration.";
    } else if (error.message.includes("500") || error.message.includes("503")) {
      errorMessage =
        "🔧 OpenAI service is temporarily unavailable. Please try again in a few moments.";
    } else if (!navigator.onLine) {
      errorMessage =
        "📡 No internet connection. Please check your connection and try again.";
    }

    addMessage(errorMessage, "ai");
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

// Function to add messages to chat window with enhanced display
function addMessage(message, sender, isLoading = false) {
  // Create a new div element for the message
  const messageDiv = document.createElement("div");
  messageDiv.className = `msg ${sender}`;

  // Add special ID for loading messages so we can remove them later
  if (isLoading) {
    messageDiv.id = "loading-message";
    // Add typing animation for loading messages
    messageDiv.innerHTML =
      '<span class="typing-indicator">Thinking<span class="dots">...</span></span>';
  } else {
    // Format the message content for better display
    const formattedMessage = formatMessageContent(message, sender);
    messageDiv.innerHTML = formattedMessage;
  }

  // Add message to chat window
  chatWindow.appendChild(messageDiv);

  // Scroll to bottom to show newest message with smooth animation
  chatWindow.scrollTo({
    top: chatWindow.scrollHeight,
    behavior: "smooth",
  });

  // Add fade-in animation for new messages
  if (!isLoading) {
    messageDiv.style.opacity = "0";
    messageDiv.style.transform = "translateY(10px)";

    // Animate in after a brief delay
    setTimeout(() => {
      messageDiv.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      messageDiv.style.opacity = "1";
      messageDiv.style.transform = "translateY(0)";
    }, 10);
  }
}

// Function to add messages with typing effect for AI responses
function addMessageWithTyping(message, sender) {
  if (sender === "ai") {
    // Create the message element
    const messageDiv = document.createElement("div");
    messageDiv.className = `msg ${sender}`;

    // Add message header
    const formattedMessage = formatMessageContent("", sender);
    messageDiv.innerHTML = formattedMessage;

    // Add to chat window
    chatWindow.appendChild(messageDiv);

    // Get the content div where we'll type the message
    const contentDiv = messageDiv.querySelector(".message-content");

    // Type the message character by character
    let currentIndex = 0;
    const typingSpeed = 30; // milliseconds per character

    function typeNextCharacter() {
      if (currentIndex < message.length) {
        // Add next character
        const currentText = message.substring(0, currentIndex + 1);
        const formattedText = formatMessageContentOnly(currentText);
        contentDiv.innerHTML = formattedText;

        currentIndex++;
        setTimeout(typeNextCharacter, typingSpeed);

        // Scroll to bottom as we type
        chatWindow.scrollTo({
          top: chatWindow.scrollHeight,
          behavior: "smooth",
        });
      }
    }

    // Start typing
    typeNextCharacter();

    // Add fade-in animation
    messageDiv.style.opacity = "0";
    messageDiv.style.transform = "translateY(10px)";

    setTimeout(() => {
      messageDiv.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      messageDiv.style.opacity = "1";
      messageDiv.style.transform = "translateY(0)";
    }, 10);
  } else {
    // For non-AI messages, use regular addMessage
    addMessage(message, sender);
  }
}

// Helper function to format just the content part of a message
function formatMessageContentOnly(content) {
  // Convert bullet points to proper HTML lists
  content = content.replace(/^•\s(.+)$/gm, "<li>$1</li>");
  if (content.includes("<li>")) {
    content = content
      .replace(/<li>/g, "<ul><li>")
      .replace(/<\/li>/g, "</li></ul>");
    // Fix multiple nested ul tags
    content = content.replace(/<\/ul>\s*<ul>/g, "");
  }

  // Make product names bold
  content = content.replace(
    /L'Oréal\s+([A-Z][A-Za-z\s]+)/g,
    "<strong>L'Oréal $1</strong>"
  );
  content = content.replace(/"([^"]+)"/g, '<strong>"$1"</strong>');

  // Convert line breaks to HTML breaks
  content = content.replace(/\n/g, "<br>");

  return content;
}

// Function to format message content for better readability
function formatMessageContent(message, sender) {
  // For AI messages, format with better structure
  if (sender === "ai") {
    // Add AI avatar/icon
    let formattedMessage = '<div class="message-header">';
    formattedMessage += '<span class="ai-avatar">🤖</span>';
    formattedMessage += '<span class="sender-name">L\'Oréal Advisor</span>';
    formattedMessage += "</div>";

    // Format the message content
    let content = message;

    // Convert bullet points to proper HTML lists
    content = content.replace(/^•\s(.+)$/gm, "<li>$1</li>");
    if (content.includes("<li>")) {
      content = content
        .replace(/<li>/g, "<ul><li>")
        .replace(/<\/li>/g, "</li></ul>");
      // Fix multiple nested ul tags
      content = content.replace(/<\/ul>\s*<ul>/g, "");
    }

    // Make product names bold (assuming they're in quotes or ALL CAPS)
    content = content.replace(
      /L'Oréal\s+([A-Z][A-Za-z\s]+)/g,
      "<strong>L'Oréal $1</strong>"
    );
    content = content.replace(/"([^"]+)"/g, '<strong>"$1"</strong>');

    // Convert line breaks to HTML breaks
    content = content.replace(/\n/g, "<br>");

    formattedMessage += '<div class="message-content">' + content + "</div>";

    return formattedMessage;
  } else {
    // For user messages, keep it simple but add user avatar
    return (
      '<div class="message-header">' +
      '<span class="user-avatar">👤</span>' +
      '<span class="sender-name">You</span>' +
      "</div>" +
      '<div class="message-content">' +
      message +
      "</div>"
    );
  }
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
  const data = await response.json(); // Check if we got a valid response
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from OpenAI API");
  }

  // Get the AI's response
  let aiResponse = data.choices[0].message.content;

  // Ensure the response isn't too long for good UX
  if (aiResponse.length > 1500) {
    // Truncate very long responses and add a note
    aiResponse =
      aiResponse.substring(0, 1500) +
      "...\n\n💡 *Response truncated for better readability. Feel free to ask for more specific details!*";
  }

  // Return the AI's message content
  return aiResponse;
}

// Log that the script has loaded successfully
console.log("L'Oréal Smart Product Advisor chatbot loaded successfully!");
