import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';

const ChatScreen = ({ route, onNavigate }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef();

  // Extract preloaded message from navigation params
  const preloadedMessage = route?.params?.preloadedMessage;

  useEffect(() => {
    // Add welcome message
    const welcomeMessage = {
      id: Date.now().toString(),
      text: "Hi! I'm your football companion. Ask me about games, scores, stats, or anything football-related!",
      isBot: true,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);

    // Add preloaded message if provided
    if (preloadedMessage) {
      setTimeout(() => {
        sendMessage(preloadedMessage, false); // Don't show user message immediately
      }, 1000);
    }
  }, [preloadedMessage]);

  const sendMessage = async (messageText = inputText, showUserMessage = true) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    // Add user message if we should show it
    if (showUserMessage) {
      setMessages(prev => [...prev, userMessage]);
    }
    setInputText('');
    setIsTyping(true);

    // Simulate API response delay
    setTimeout(() => {
      const botResponse = generateBotResponse(messageText);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => {
        const newMessages = showUserMessage ? [...prev, botMessage] : [...prev, userMessage, botMessage];
        return newMessages;
      });
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('exciting games') || message.includes('top games')) {
      return "🏈 Here are the most exciting games happening right now:\n\n• Georgia vs Alabama - 4th Quarter, 21-17\n• Ohio State vs Michigan - 3rd Quarter, 14-10\n• Texas vs Oklahoma - 2nd Quarter, 7-3\n• Notre Dame vs USC - 1st Quarter, 0-0\n\nThe Georgia vs Alabama game is particularly thrilling with a close score in the final quarter!";
    }
    
    if (message.includes('live scores') || message.includes('current scores')) {
      return "⚡ Current Live Scores:\n\n🏈 College Football:\n• Georgia 21 - Alabama 17 (Q4 8:45)\n• Ohio State 14 - Michigan 10 (Q3 2:13)\n• Texas 7 - Oklahoma 3 (Q2 11:22)\n• Notre Dame 0 - USC 0 (Q1 14:56)\n\n🏈 NFL:\n• Chiefs 28 - Bills 21 (Q4 5:30)\n• Cowboys 14 - Eagles 10 (Q3 9:15)\n• 49ers 17 - Rams 14 (Q2 3:45)";
    }
    
    if (message.includes('stats') || message.includes('statistics')) {
      return "📊 Here are some key stats from today's games:\n\n🔥 Top Performers:\n• QB: Lamar Jackson - 285 yards, 3 TDs\n• RB: Derrick Henry - 156 yards, 2 TDs\n• WR: Tyreek Hill - 8 catches, 142 yards\n\n⚡ Game Highlights:\n• Longest TD: 67-yard pass\n• Most yards: 445 (Chiefs)\n• Biggest upset: Underdog won by 14";
    }
    
    if (message.includes('hello') || message.includes('hi')) {
      return "Hello! 👋 I'm here to help with all your football needs. You can ask me about:\n\n• Live scores and games\n• Player stats and highlights\n• Game analysis and predictions\n• Team information\n• Historical data\n\nWhat would you like to know?";
    }
    
    if (message.includes('help')) {
      return "🤖 I can help you with:\n\n📊 **Live Data:**\n• Current game scores\n• Player statistics\n• Team standings\n\n🏈 **Game Info:**\n• Schedule and matchups\n• Game highlights\n• Analysis and insights\n\n📱 **App Features:**\n• Play analysis from photos\n• Saved play history\n• Real-time updates\n\nJust ask me anything football-related!";
    }
    
    // Default responses
    const defaultResponses = [
      "That's a great question! While I don't have specific data on that right now, I can help you with live scores, game stats, and play analysis. What specific information are you looking for?",
      "Interesting! I'd love to help you with that. Could you be more specific about what football information you're looking for?",
      "I'm constantly learning about football! Right now I can provide live scores, game highlights, and player stats. What would you like to know more about?",
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isBot ? styles.botMessageContainer : styles.userMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        item.isBot ? styles.botBubble : styles.userBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isBot ? styles.botText : styles.userText
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.timestamp,
          item.isBot ? styles.botTimestamp : styles.userTimestamp
        ]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <ActivityIndicator size="small" color="#6b7280" />
        <Text style={styles.typingText}>Bot is typing...</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('home')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Football Chat</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isTyping ? renderTypingIndicator : null}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about games, scores, stats..."
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonDisabled
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isTyping}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerRight: {
    width: 60, // Balance the header
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  botBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#1f2937',
  },
  userText: {
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  botTimestamp: {
    color: '#9ca3af',
  },
  userTimestamp: {
    color: '#e5e7eb',
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  typingText: {
    color: '#6b7280',
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f9fafb',
    marginRight: 8,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonActive: {
    backgroundColor: '#3b82f6',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatScreen;
