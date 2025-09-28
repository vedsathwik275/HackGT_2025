/**
 * NextGen Live Football Stats - Frontend Application
 * Modern JavaScript application for real-time football statistics
 */

class NextGenFootballApp {
    constructor() {
        // Use deployed API URL
        this.apiBaseUrl = 'https://nextgen-live-data-api.onrender.com/api';
        this.isLoading = false;
        this.messageHistory = [];
        this.selectedSport = null; // null = both, 'college', 'nfl'
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkApiHealth();
        this.loadStats();
        
        console.log('🏈 NextGen Live Football Stats initialized');
    }

    bindEvents() {
        // Message input handling
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Quick action buttons
        document.getElementById('refreshDataBtn').addEventListener('click', () => {
            this.sendQuickMessage('refresh');
        });
        
        document.getElementById('topGamesBtn').addEventListener('click', () => {
            const sportContext = this.selectedSport === 'nfl' ? 'NFL' : 
                                this.selectedSport === 'college' ? 'college football' : '';
            this.sendQuickMessage(`What are the most exciting ${sportContext} games happening right now?`);
        });
        
        document.getElementById('liveScoresBtn').addEventListener('click', () => {
            const sportContext = this.selectedSport === 'nfl' ? 'NFL' : 
                                this.selectedSport === 'college' ? 'college football' : '';
            this.sendQuickMessage(`Show me all the current ${sportContext} live scores`);
        });
        
        // Clear chat button
        document.getElementById('clearChatBtn').addEventListener('click', () => {
            this.clearChat();
        });
        
        // Sport selector buttons
        document.getElementById('sportBoth').addEventListener('click', () => {
            this.selectSport(null);
        });
        
        document.getElementById('sportCollege').addEventListener('click', () => {
            this.selectSport('college');
        });
        
        document.getElementById('sportNFL').addEventListener('click', () => {
            this.selectSport('nfl');
        });
    }

    async checkApiHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();
            
            if (data.status === 'healthy') {
                this.updateConnectionStatus(true);
            } else {
                this.updateConnectionStatus(false);
            }
        } catch (error) {
            console.error('API health check failed:', error);
            this.updateConnectionStatus(false);
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/stats`);
            const data = await response.json();
            
            if (data.cache) {
                this.updateStatsDisplay(data.cache);
            } else {
                // Initialize with zeros if no data
                this.updateStatsDisplay({
                    individual_games_cached: 0,
                    fresh_games: 0,
                    total_players_tracked: 0,
                    total_teams_tracked: 0
                });
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
            // Initialize with zeros on error
            this.updateStatsDisplay({
                individual_games_cached: 0,
                fresh_games: 0,
                total_players_tracked: 0,
                total_teams_tracked: 0
            });
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        const statusDot = statusElement.querySelector('.w-2');
        const statusText = statusElement.querySelector('span');
        
        if (connected) {
            statusDot.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
            statusText.textContent = 'Connected';
            statusText.className = 'text-sm text-gray-300';
        } else {
            statusDot.className = 'w-2 h-2 bg-red-500 rounded-full';
            statusText.textContent = 'Disconnected';
            statusText.className = 'text-sm text-red-400';
        }
    }

    updateStatsDisplay(stats) {
        const elements = {
            totalGames: document.getElementById('totalGames'),
            freshGames: document.getElementById('freshGames'),
            totalPlayers: document.getElementById('totalPlayers'),
            totalTeams: document.getElementById('totalTeams'),
            gamesCount: document.getElementById('gamesCount')
        };

        // Animate counter updates
        this.animateCounter(elements.totalGames, stats.individual_games_cached || 0);
        this.animateCounter(elements.freshGames, stats.fresh_games || 0);
        this.animateCounter(elements.totalPlayers, stats.total_players_tracked || 0);
        this.animateCounter(elements.totalTeams, stats.total_teams_tracked || 0);
        this.animateCounter(elements.gamesCount, stats.individual_games_cached || 0);
    }

    selectSport(sport) {
        this.selectedSport = sport;
        
        // Update button states
        document.querySelectorAll('.sport-selector').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.add('bg-white/10', 'hover:bg-white/20', 'text-gray-300', 'hover:text-white', 'border', 'border-white/20');
            btn.classList.remove('bg-gradient-to-r', 'from-nextgen-blue', 'to-nextgen-green', 'text-white');
        });
        
        // Set active button
        let activeBtn;
        if (sport === null) {
            activeBtn = document.getElementById('sportBoth');
        } else if (sport === 'college') {
            activeBtn = document.getElementById('sportCollege');
        } else if (sport === 'nfl') {
            activeBtn = document.getElementById('sportNFL');
        }
        
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-gradient-to-r', 'from-nextgen-blue', 'to-nextgen-green', 'text-white');
            activeBtn.classList.remove('bg-white/10', 'hover:bg-white/20', 'text-gray-300', 'hover:text-white', 'border', 'border-white/20');
        }
        
        // Update placeholder text based on selection
        const messageInput = document.getElementById('messageInput');
        if (sport === 'nfl') {
            messageInput.placeholder = 'Ask about NFL teams, players, or games...';
        } else if (sport === 'college') {
            messageInput.placeholder = 'Ask about college football teams, players, or games...';
        } else {
            messageInput.placeholder = 'Ask about any team, player, or game...';
        }
    }

    animateCounter(element, targetValue) {
        if (!element) return;
        
        // Ensure targetValue is a valid number
        targetValue = Math.max(0, parseInt(targetValue) || 0);
        
        const currentValue = parseInt(element.textContent) || 0;
        
        // If values are the same, no animation needed
        if (currentValue === targetValue) return;
        
        const increment = targetValue > currentValue ? 1 : -1;
        const steps = Math.abs(targetValue - currentValue);
        const stepDuration = Math.max(Math.min(50, 1000 / steps), 10); // Limit animation speed
        
        element.classList.add('stat-counter', 'updating');
        
        let current = currentValue;
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            // Stop when we reach the target
            if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
                current = targetValue; // Ensure we end exactly at target
                element.textContent = current;
                clearInterval(timer);
                element.classList.remove('updating');
            }
        }, stepDuration);
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message || this.isLoading) return;
        
        messageInput.value = '';
        this.addMessage(message, true);
        this.setLoading(true);
        
        try {
            const requestBody = { message };
            if (this.selectedSport) {
                requestBody.sport = this.selectedSport;
            }
            
            const response = await fetch(`${this.apiBaseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addMessage(data.response, false, data.stats);
                
                // Update stats if provided
                if (data.stats) {
                    this.updateStatsFromResponse(data.stats);
                }
            } else {
                this.addMessage(`❌ Error: ${data.error}`, false);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            this.addMessage('❌ Connection error. Please check if the API server is running.', false);
        } finally {
            this.setLoading(false);
        }
    }

    sendQuickMessage(message) {
        const messageInput = document.getElementById('messageInput');
        messageInput.value = message;
        this.sendMessage();
    }

    addMessage(content, isUser, stats = null) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start space-x-3 message-enter';
        
        if (isUser) {
            messageDiv.innerHTML = `
                <div class="bg-gradient-to-r from-nextgen-blue to-nextgen-green p-2 rounded-lg">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                </div>
                <div class="flex-1 bg-nextgen-blue/20 border border-nextgen-blue/30 rounded-lg p-4">
                    <p class="text-white">${this.escapeHtml(content)}</p>
                </div>
            `;
        } else {
            const statsHtml = stats ? `
                <div class="mt-3 flex flex-wrap gap-2">
                    <span class="bg-nextgen-green/20 text-nextgen-green px-2 py-1 rounded text-xs">
                        ${stats.games_tracked} games
                    </span>
                    <span class="bg-nextgen-blue/20 text-nextgen-blue px-2 py-1 rounded text-xs">
                        ${stats.fresh_games} fresh
                    </span>
                    <span class="bg-nextgen-orange/20 text-nextgen-orange px-2 py-1 rounded text-xs">
                        ${stats.total_players} players
                    </span>
                </div>
            ` : '';
            
            messageDiv.innerHTML = `
                <div class="bg-gradient-to-r from-nextgen-green to-nextgen-blue p-2 rounded-lg">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                </div>
                <div class="flex-1 bg-white/5 border border-white/10 rounded-lg p-4">
                    <div class="text-gray-200 prose prose-sm max-w-none">
                        ${this.formatMessage(content)}
                    </div>
                    ${statsHtml}
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Store message in history
        this.messageHistory.push({ content, isUser, timestamp: new Date() });
    }

    addTypingIndicator() {
        const messagesContainer = document.getElementById('messagesContainer');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'flex items-start space-x-3 message-enter';
        typingDiv.innerHTML = `
            <div class="bg-gradient-to-r from-nextgen-green to-nextgen-blue p-2 rounded-lg">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
            </div>
            <div class="flex-1 bg-white/5 border border-white/10 rounded-lg p-4">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        
        if (loading) {
            sendBtn.disabled = true;
            sendBtn.innerHTML = `
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Thinking...</span>
            `;
            messageInput.disabled = true;
            this.addTypingIndicator();
        } else {
            sendBtn.disabled = false;
            sendBtn.innerHTML = `
                <span>Send</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
            `;
            messageInput.disabled = false;
            messageInput.focus();
            this.removeTypingIndicator();
        }
    }

    updateStatsFromResponse(stats) {
        // Update the stats display with data from the response
        this.updateStatsDisplay({
            individual_games_cached: stats.games_tracked,
            fresh_games: stats.fresh_games,
            total_players_tracked: stats.total_players,
            total_teams_tracked: stats.total_teams
        });
    }

    formatMessage(content) {
        // Convert markdown-style formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded">$1</code>')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearChat() {
        const messagesContainer = document.getElementById('messagesContainer');
        // Keep only the welcome message (first child)
        const welcomeMessage = messagesContainer.firstElementChild;
        messagesContainer.innerHTML = '';
        messagesContainer.appendChild(welcomeMessage);
        
        this.messageHistory = [];
        console.log('Chat cleared');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NextGenFootballApp();
});

// Service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
