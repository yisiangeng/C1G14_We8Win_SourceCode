import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

// Simple CSS-in-JS for styling. You can move this to a separate .css file.
const styles = `
  .chatbot-container {
    width: 400px;
    height: 600px;
    border: 1px solid #ccc;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    font-family: Arial, sans-serif;
    background-color: #f9f9f9;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  .messages-container {
    flex-grow: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .message {
    padding: 10px 15px;
    border-radius: 20px;
    max-width: 80%;
    word-wrap: break-word;
    white-space: pre-wrap; /* To respect newlines and markdown-like formatting */
  }
  .message.user {
    background-color: #007bff;
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 5px;
  }
  .message.bot {
    background-color: #e9e9eb;
    color: #333;
    align-self: flex-start;
    border-bottom-left-radius: 5px;
  }
  .typing-indicator {
    align-self: flex-start;
    padding: 10px 15px;
    color: #888;
    font-style: italic;
  }
  .input-area {
    display: flex;
    padding: 10px;
    border-top: 1px solid #ccc;
    background-color: #fff;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }
  .input-area input {
    flex-grow: 1;
    border: 1px solid #ccc;
    border-radius: 20px;
    padding: 10px 15px;
    font-size: 16px;
  }
  .input-area button {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 20px;
    padding: 10px 20px;
    margin-left: 10px;
    cursor: pointer;
    font-size: 16px;
  }
  .input-area button:hover {
    background-color: #0056b3;
  }
  .suggested-questions {
    padding: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    border-top: 1px solid #eee;
  }
  .suggested-questions button {
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 15px;
    padding: 5px 12px;
    font-size: 12px;
    cursor: pointer;
    color: #333;
  }
  .suggested-questions button:hover {
    background-color: #e0e0e0;
  }
  /* Simple animation for new messages */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .message.animated {
    animation: fadeIn 0.4s ease-out;
  }
  .message h1, .message h2, .message h3 {
    margin: 8px 0 6px 0;
    font-size: inherit;
  }
  .message h1 {
    font-size: 1.1em;
    font-weight: 700;
  }
  .message h2 {
    font-size: 1em;
    font-weight: 600;
  }
  .message h3 {
    font-size: 0.95em;
    font-weight: 600;
  }
  .message p {
    margin: 4px 0;
    font-size: 0.95em;
    line-height: 1.4;
  }
  .message ul, .message ol {
    margin: 6px 0 6px 16px;
    padding: 0;
    font-size: 0.95em;
  }
  .message li {
    margin: 2px 0;
    line-height: 1.4;
  }
  .message strong {
    font-weight: 600;
  }
`;

const SimpleChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      sender: "bot",
      text: "# 👋 Hello there!\nI'm your **WattsUp Energy Assistant**. How can I help you today?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQuestions = [
    "When is the best hour to use heavy appliances?",
    "Give me a short report of my usage last month.",
    "Why did Dec 1 usage spike?",
    "Forecast my usage for next week.",
  ];

  const generateBotResponse = (text) => {
    let botResponse =
      "I'm here to help! You can ask me about appliance usage, reports, or energy saving tips.";
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes("heavy appliances") ||
      lowerText.includes("best hour") ||
      lowerText.includes("best time")
    ) {
      botResponse =
        "# ⚡ Optimal Appliance Usage Times\n## 🌙 Off-Peak (Cheapest)\n⏰ **10 PM - 6 AM**\n💰 Save up to 30-40%\n## ⚠️ Peak (Most Expensive)\n⏰ **2 PM - 5 PM**\n🚫 Avoid heavy appliances\n## 💡 Pro Tip\nSet timers on your washer and dryer to run automatically during off-peak hours!";
    } else if (
      lowerText.includes("report") ||
      lowerText.includes("last month") ||
      lowerText.includes("summary")
    ) {
      botResponse =
        "# 📊 November 2025 Summary\n## ⚡ Total Usage\n450 kWh\n## 📅 Peak Day\nNov 15 (22 kWh)\n## 💰 Total Cost\nRM 207\n## 📈 vs October\n- ✅ -45 kWh (-9%)\n- 💵 Saved RM 45!\n🎯 **You're doing great! Keep it up!**";
    } else if (
      lowerText.includes("usage") ||
      lowerText.includes("Dec 1") ||
      lowerText.includes("Why") ||
      lowerText.includes("spike")
    ) {
      botResponse =
        "# 💰 Dec 1 usage\n## 🌡️ AC up 62% vs Nov\n- Set to 24°C (saves ~10%)\n- Time to clean filters\n## 🔌 Kitchen up 134% vs Nov\n- Unplug idle chargers\n- Check refrigerator door";
    } else if (
      lowerText.includes("forecast") ||
      lowerText.includes("next week") ||
      lowerText.includes("prediction")
    ) {
      botResponse =
        "# 🔮 7-Day Energy Forecast\n## 📅 Week Ahead\n- ⚡ 105-115 kWh projected\n- 💰 Est. cost: RM 38-42\n## 🌤️ Weather Impact\n- 🌡️ 28-32°C expected\n- 💨 Moderate humidity\n## 💡 Recommendation\nYou're on track! Usage looks stable. Thursday & Friday may be warmer—consider pre-cooling your home before peak hours.";
    } else if (
      lowerText.includes("hello") ||
      lowerText.includes("hi") ||
      lowerText.includes("hey")
    ) {
      botResponse =
        "# 👋 Hello there!\nI'm your **WattsUp Energy Assistant**, powered by smart analytics. I'm here to help you:\n- ✨ Optimize energy usage\n- 💰 Save on bills\n- 📊 Track consumption\n- 🌱 Meet sustainability goals\nWhat would you like to know?";
    } else if (lowerText.includes("thank")) {
      botResponse =
        "# 😊 You're very welcome!\nI'm always here to help you save energy and reduce costs. Feel free to ask me anything!\n💚 **Remember:** Every kWh saved helps the environment! 🌍";
    }

    setIsTyping(false);
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, sender: "bot", text: botResponse, animated: true },
    ]);
  };

  const handleSend = () => {
    if (inputText.trim() === "") return;

    const userMessage = { id: Date.now(), sender: "user", text: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      generateBotResponse(userMessage.text);
    }, 1000); // 1-second delay to simulate bot thinking
  };

  const handleSuggestedClick = (question) => {
    setInputText(question);
    // Optionally, you can automatically send the question
    // handleSend();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="chatbot-container">
        <div className="messages-container">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender} ${msg.animated ? "animated" : ""
                }`}
            >
              {msg.sender === "bot" ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
          ))}
          {isTyping && <div className="typing-indicator">Bot is typing...</div>}
        </div>
        <div className="suggested-questions">
          {suggestedQuestions.map((q, index) => (
            <button key={index} onClick={() => handleSuggestedClick(q)}>
              {q}
            </button>
          ))}
        </div>
        <div className="input-area">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </>
  );
};

export default SimpleChatbot;
