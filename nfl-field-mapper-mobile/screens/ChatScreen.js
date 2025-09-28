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
  Alert,
} from 'react-native';
import liveDataApiClient from '../services/LiveDataApiClient';

const ChatScreen = ({ route, onNavigate }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSport, setSelectedSport] = useState(null); // null = both, 'college', 'nfl'
  const flatListRef = useRef();
  const [isLive, setIsLive] = useState(false);

  // Extract preloaded message from navigation params
  const preloadedMessage = route?.params?.preloadedMessage;

  useEffect(() => {
    console.log(`🚀 ChatScreen: Initializing with preloadedMessage:`, preloadedMessage ? `"${preloadedMessage.substring(0, 50)}..."` : 'none');
    
    // Add welcome message
    const welcomeMessage = {
      id: Date.now().toString(),
      text: "Hi! I'm your football companion powered by real-time data. Ask me about games, scores, stats, or anything football-related!",
      isBot: true,
      timestamp: new Date(),
    };
    
    // If there's a preloaded message, add it immediately as a user message
    if (preloadedMessage) {
      console.log(`📝 ChatScreen: Processing preloaded message: "${preloadedMessage}"`);
      
      const userMessage = {
        id: (Date.now() + 1).toString(),
        text: preloadedMessage.trim(),
        isBot: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage, userMessage]);
      
      // Then trigger bot response after a short delay
      setTimeout(() => {
        console.log(`⏱️ ChatScreen: Triggering delayed response for preloaded message`);
        handleApiMessage(preloadedMessage.trim(), false);
      }, 500);
    } else {
      console.log(`💬 ChatScreen: No preloaded message, showing welcome message only`);
      setMessages([welcomeMessage]);
    }
  }, [preloadedMessage]);

  // Health check/poll to control LIVE indicator
  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const healthy = await liveDataApiClient.testConnectivity();
        if (isMounted) setIsLive(healthy);
      } catch (e) {
        if (isMounted) setIsLive(false);
      }
    };

    checkHealth();
    const intervalId = setInterval(checkHealth, 60000); // poll every 60s

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleApiMessage = async (messageText, addUserMessage = true) => {
    if (!messageText.trim()) return;

    console.log(`🎬 ChatScreen: Starting message handling for: "${messageText.substring(0, 50)}..."`);
    setIsTyping(true);

    try {
      // Use the service to send the chat message
      const data = await liveDataApiClient.sendChatMessage(messageText.trim(), selectedSport);

      if (data.success) {
        console.log(`✅ ChatScreen: Received successful response from service`);
        
        const botMessage = {
          id: Date.now().toString(),
          text: data.response,
          isBot: true,
          timestamp: new Date(),
          sportContext: data.sport_context,
          dataFreshness: data.data_freshness,
        };

        setMessages(prev => {
          if (addUserMessage) {
            const userMessage = {
              id: (Date.now() - 1).toString(),
              text: messageText.trim(),
              isBot: false,
              timestamp: new Date(),
            };
            console.log(`📱 ChatScreen: Adding user message and bot response to UI`);
            return [...prev, userMessage, botMessage];
          } else {
            console.log(`📱 ChatScreen: Adding bot response to UI (no user message)`);
            return [...prev, botMessage];
          }
        });
      } else {
        console.error(`❌ ChatScreen: Service returned error response:`, data.error);
        
        // Handle API error response
        const errorMessage = {
          id: Date.now().toString(),
          text: `❌ Sorry, I encountered an error: ${data.error || 'Unknown error'}`,
          isBot: true,
          timestamp: new Date(),
          isError: true,
        };

        setMessages(prev => {
          if (addUserMessage) {
            const userMessage = {
              id: (Date.now() - 1).toString(),
              text: messageText.trim(),
              isBot: false,
              timestamp: new Date(),
            };
            return [...prev, userMessage, errorMessage];
          } else {
            return [...prev, errorMessage];
          }
        });
      }
    } catch (error) {
      console.error(`❌ ChatScreen: Service call failed:`, error.message);
      
      // Handle network/connection errors
      const errorMessage = {
        id: Date.now().toString(),
        text: `🔌 Connection error: ${error.message}. Please check your internet connection and try again.`,
        isBot: true,
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => {
        if (addUserMessage) {
          const userMessage = {
            id: (Date.now() - 1).toString(),
            text: messageText.trim(),
            isBot: false,
            timestamp: new Date(),
          };
          return [...prev, userMessage, errorMessage];
        } else {
          return [...prev, errorMessage];
        }
      });
    } finally {
      console.log(`🏁 ChatScreen: Message handling completed`);
      setIsTyping(false);
    }
  };

  const sendMessage = async (messageText = inputText, showUserMessage = true) => {
    if (!messageText.trim() || isTyping) {
      console.log(`⏹️ ChatScreen: sendMessage blocked - empty message or typing in progress`);
      return;
    }

    console.log(`📤 ChatScreen: sendMessage called with:`, {
      message: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
      showUserMessage,
      selectedSport,
      timestamp: new Date().toISOString()
    });

    const userMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    // Add user message if we should show it
    if (showUserMessage) {
      console.log(`📱 ChatScreen: Adding user message to UI immediately`);
      setMessages(prev => [...prev, userMessage]);
    }
    setInputText('');
    
    // Call the API
    await handleApiMessage(messageText, !showUserMessage);
  };

  // Sport selection methods
  const selectSport = (sport) => {
    console.log(`🏈 ChatScreen: Sport selection changed from "${selectedSport}" to "${sport}"`);
    setSelectedSport(sport);
    
    // Show feedback to user
    let sportText = 'all sports';
    if (sport === 'nfl') sportText = 'NFL';
    else if (sport === 'college') sportText = 'College Football';
    
    console.log(`📢 ChatScreen: Showing sport selection feedback to user: ${sportText}`);
    const systemMessage = {
      id: Date.now().toString(),
      text: `🏈 Now focusing on ${sportText}. Your next questions will be answered with this context.`,
      isBot: true,
      timestamp: new Date(),
      isSystem: true,
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };

  

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isBot ? styles.botMessageContainer : styles.userMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        item.isBot ? styles.botBubble : styles.userBubble,
        item.isError && styles.errorBubble,
        item.isSystem && styles.systemBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isBot ? styles.botText : styles.userText,
          item.isError && styles.errorText,
          item.isSystem && styles.systemText
        ]}>
          {item.text}
        </Text>
        {item.dataFreshness && (
          <Text style={styles.dataFreshness}>
            📊 {item.dataFreshness}
          </Text>
        )}
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
        <View style={styles.headerRight}>
          {isLive && (
            <Text style={styles.liveText}>LIVE</Text>
          )}
        </View>
      </View>

      {/* Sport Selection */}
      <View style={styles.sportSelector}>
        <Text style={styles.sportLabel}>Focus on:</Text>
        <View style={styles.sportButtons}>
          <TouchableOpacity 
            style={[
              styles.sportButton, 
              selectedSport === null && styles.sportButtonActive
            ]}
            onPress={() => selectSport(null)}
          >
            <Text style={[
              styles.sportButtonText,
              selectedSport === null && styles.sportButtonTextActive
            ]}>Both</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.sportButton, 
              selectedSport === 'college' && styles.sportButtonActive
            ]}
            onPress={() => selectSport('college')}
          >
            <Text style={[
              styles.sportButtonText,
              selectedSport === 'college' && styles.sportButtonTextActive
            ]}>College</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.sportButton, 
              selectedSport === 'nfl' && styles.sportButtonActive
            ]}
            onPress={() => selectSport('nfl')}
          >
            <Text style={[
              styles.sportButtonText,
              selectedSport === 'nfl' && styles.sportButtonTextActive
            ]}>NFL</Text>
          </TouchableOpacity>
        </View>
      </View>



      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.messagesContent}
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
    alignItems: 'flex-end',
  },
  liveText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '700',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 8,
    paddingBottom: 16,
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
    paddingVertical: 8,
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
  sportSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sportLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 12,
    fontWeight: '500',
  },
  sportButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  sportButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sportButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  sportButtonTextActive: {
    color: '#ffffff',
  },
  errorBubble: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  errorText: {
    color: '#dc2626',
  },
  systemBubble: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1,
  },
  systemText: {
    color: '#0369a1',
    fontStyle: 'italic',
  },
  dataFreshness: {
    fontSize: 10,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default ChatScreen;
