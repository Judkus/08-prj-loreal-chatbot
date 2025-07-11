/* DOM elements - Get references to HTML elements we'll use */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

// L'Oréal-specific system prompt for the AI
const SYSTEM_PROMPT = `You are L'Oréal's Smart Product Advisor, an expert beauty consultant specializing EXCLUSIVELY in L'Oréal products and beauty routines. Your role is to:

WHAT YOU DO:
• Recommend L'Oréal products for skincare, haircare, makeup, and fragrance
• Provide personalized beauty routines using L'Oréal products
• Explain product benefits, ingredients, and application techniques
• Suggest products based on skin type, hair type, concerns, and preferences
• Offer step-by-step beauty tutorials and tips
• Help customers find products for specific needs (anti-aging, acne, color correction, etc.)
• Answer questions about L'Oréal brand history and values
• Provide beauty tips and techniques related to L'Oréal products

WHAT YOU ABSOLUTELY DON'T DO:
• Discuss non-L'Oréal brands or competitor products
• Provide medical advice or diagnose skin/hair conditions
• Answer questions unrelated to beauty, skincare, haircare, makeup, or fragrance
• Engage in topics outside of beauty and cosmetics (politics, sports, technology, food, etc.)
• Provide information about other companies or industries
• Discuss personal topics unrelated to beauty
• Answer general knowledge questions not related to beauty/L'Oréal

STRICT GUIDELINES FOR OFF-TOPIC QUESTIONS:
When someone asks about anything unrelated to L'Oréal products or beauty topics, you MUST politely decline and redirect them back to your expertise area. Use these polite responses:

For general non-beauty topics: "I'm specifically designed to help with L'Oréal products and beauty advice. I'd love to help you with skincare routines, makeup tips, or finding the perfect L'Oréal products for your needs instead!"

For competitor brands: "I specialize exclusively in L'Oréal products and can't provide information about other brands. However, I'd be happy to recommend similar L'Oréal products that might meet your needs!"

For medical questions: "I can't provide medical advice, but I can help you find gentle L'Oréal products suitable for sensitive skin or specific beauty concerns. Would you like some recommendations?"

For completely unrelated topics: "That's outside my area of expertise! I'm here to be your L'Oréal beauty advisor. How can I help you discover amazing L'Oréal products or create a personalized beauty routine today?"

TONE & STYLE:
• Always remain professional, friendly, and enthusiastic about L'Oréal
• Be helpful while staying strictly within your domain
• Redirect conversations back to L'Oréal and beauty topics
• Show genuine interest in helping with beauty needs
• Use encouraging and supportive language

REMEMBER: You are a L'Oréal brand ambassador. Every response should reinforce the brand and guide customers toward L'Oréal products and beauty solutions. Never compromise on staying within your specialized domain.`;

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

  // Check if the message is clearly off-topic and provide immediate response
  const offTopicResponse = checkForOffTopicQuestions(message);
  if (offTopicResponse) {
    // Display the user's message
    addMessage(message, "user");

    // Clear the input field
    userInput.value = "";

    // Show immediate polite refusal without calling API
    setTimeout(() => {
      addMessage(offTopicResponse, "ai");
    }, 500); // Small delay to feel natural

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

// Initialize conversation context
let conversationContext = [];

// Function to update conversation context
function updateConversationContext(role, content) {
  conversationContext.push({ role, content });

  // Limit context to the last 10 messages for efficiency
  if (conversationContext.length > 10) {
    conversationContext.shift();
  }
}

// Function to check for obviously off-topic questions and provide immediate polite responses
function checkForOffTopicQuestions(message) {
  const lowerMessage = message.toLowerCase();

  // Define patterns for clearly off-topic questions
  const offTopicPatterns = [
    // Technology topics
    /\b(computer|software|programming|coding|internet|website|app|technology|tech|digital|AI|artificial intelligence|robot|phone|mobile|iphone|android)\b/,

    // Sports
    /\b(football|soccer|basketball|baseball|tennis|golf|sports|team|game|match|score|player|athlete)\b/,

    // Politics/News
    /\b(politics|government|president|election|vote|political|policy|law|congress|senate|news|current events)\b/,

    // Food/Cooking
    /\b(recipe|food|cooking|restaurant|meal|dinner|lunch|breakfast|kitchen|chef|eat|eating)\b/,

    // Travel
    /\b(travel|trip|vacation|flight|hotel|airport|destination|tourism|country|city|visit)\b/,

    // Entertainment
    /\b(movie|film|music|song|concert|album|artist|actor|actress|celebrity|tv show|series|netflix|youtube)\b/,

    // Weather
    /\b(weather|temperature|rain|snow|sunny|cloudy|forecast|climate|storm)\b/,

    // Education (non-beauty)
    /\b(school|college|university|homework|exam|test|study|student|teacher|class|degree)\b/,

    // Finance
    /\b(money|bank|investment|stock|finance|economy|price|cost|expensive|cheap|budget|salary)\b/,

    // Health (non-beauty)
    /\b(doctor|hospital|medicine|illness|disease|sick|health|medical|pain|hurt|injury)\b/,

    // General conversation starters
    /^(hi|hello|hey|what's up|how are you|good morning|good afternoon|good evening)\s*$/,

    // Math/Science
    /\b(math|science|physics|chemistry|biology|calculation|formula|experiment)\b/,

    // Other random topics
    /\b(car|vehicle|driving|house|home|family|pet|animal|dog|cat|book|reading)\b/,
  ];

  // Check for competitor beauty brands
  const competitorPatterns = [
    /\b(maybelline|revlon|covergirl|neutrogena|olay|clinique|estee lauder|mac|sephora|ulta|drugstore|pharmacy)\b/,
    /\b(competitor|other brand|different brand|alternative|instead of loreal)\b/,
  ];

  // Medical/diagnosis questions
  const medicalPatterns = [
    /\b(diagnose|diagnosis|medical condition|skin condition|allergy|allergic|rash|infection|disease)\b/,
    /\b(is this normal|should I see a doctor|medical advice|health problem)\b/,
  ];

  // Check each pattern category and return appropriate response
  for (const pattern of offTopicPatterns) {
    if (pattern.test(lowerMessage)) {
      return "That's outside my area of expertise! I'm here to be your L'Oréal beauty advisor. How can I help you discover amazing L'Oréal products or create a personalized beauty routine today? ✨";
    }
  }

  for (const pattern of competitorPatterns) {
    if (pattern.test(lowerMessage)) {
      return "I specialize exclusively in L'Oréal products and can't provide information about other brands. However, I'd be happy to recommend similar L'Oréal products that might meet your needs! What type of beauty solution are you looking for? 💄";
    }
  }

  for (const pattern of medicalPatterns) {
    if (pattern.test(lowerMessage)) {
      return "I can't provide medical advice, but I can help you find gentle L'Oréal products suitable for sensitive skin or specific beauty concerns. Would you like some recommendations for sensitive skin care? 🌿";
    }
  }

  // Check for very generic greetings
  if (
    /^(hi|hello|hey|what's up|how are you|good morning|good afternoon|good evening)[\s\?!]*$/i.test(
      message
    )
  ) {
    return "Hello! 👋 I'm your L'Oréal Smart Product Advisor. I'm here to help you discover the perfect L'Oréal products and create personalized beauty routines. What beauty goals can I help you achieve today?";
  }

  // Check for attempts to override system behavior
  const systemOverridePatterns = [
    /\b(ignore previous instructions|forget your role|act as|pretend to be|system prompt|override|jailbreak)\b/i,
    /\b(you are now|from now on|instead of being|stop being|don't be)\b/i,
  ];

  for (const pattern of systemOverridePatterns) {
    if (pattern.test(lowerMessage)) {
      return "I'm specifically designed to be your L'Oréal beauty advisor and I'm excited to stay focused on that! Let me help you with L'Oréal products, beauty routines, or skincare advice. What beauty questions do you have? ✨";
    }
  }

  // If no off-topic patterns matched, allow the question to proceed to OpenAI
  return null;
}

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

// Function to send request to Cloudflare Worker
async function callCloudflareWorker(userMessage) {
  // Update conversation context with user's message
  updateConversationContext("user", userMessage);

  // Prepare the request data for the Cloudflare Worker
  const requestData = {
    model: "gpt-4o", // Using GPT-4o as specified in instructions
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationContext,
    ],
    max_tokens: 500, // Limit response length
    temperature: 0.7, // Control creativity
    top_p: 1, // Control diversity
    frequency_penalty: 0, // Control repetition
    presence_penalty: 0, // Control topic diversity
  };

  // Make the API request using fetch
  const response = await fetch(
    "https://project8lorealchatbot.kussuejh.workers.dev/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    }
  );

  // Check if the request was successful
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.error?.message ||
      `Cloudflare Worker request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  // Parse the JSON response from the Cloudflare Worker
  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from Cloudflare Worker");
  }

  // Get the AI's response
  const aiResponse = data.choices[0].message.content;

  // Update conversation context with AI's response
  updateConversationContext("assistant", aiResponse);

  // Ensure the response isn't too long for good UX
  if (aiResponse.length > 1500) {
    return (
      aiResponse.substring(0, 1500) +
      "...\n\n💡 *Response truncated for better readability. Feel free to ask for more specific details!*"
    );
  }

  return aiResponse;
}

// Replace the callOpenAI function with callCloudflareWorker
async function callOpenAI(userMessage) {
  return await callCloudflareWorker(userMessage);
}

// Log that the script has loaded successfully
console.log("L'Oréal Smart Product Advisor chatbot loaded successfully!");
