// MedFocus Cards - Storage Module
// Global storage wrapper for localStorage operations

class StorageManager {
    constructor() {
        this.keys = {
            users: 'medFocusUsers',
            decks: 'medFocusDecks',
            quizzes: 'medFocusQuizzes',
            userStats: 'medFocusUserStats',
            currentUser: 'medFocusCurrentUser',
            settings: 'medFocusSettings'
        };
    }

    // Generic get method
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    // Generic set method
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    // Users methods
    getUsers() {
        return this.get(this.keys.users) || [];
    }

    setUsers(users) {
        return this.set(this.keys.users, users);
    }

    getUserById(userId) {
        const users = this.getUsers();
        return users.find(user => user.id === userId) || null;
    }

    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === userId);
        if (index >= 0) {
            users[index] = { ...users[index], ...updates };
            return this.setUsers(users);
        }
        return false;
    }

    deleteUser(userId) {
        const users = this.getUsers();
        const filteredUsers = users.filter(user => user.id !== userId);
        return this.setUsers(filteredUsers);
    }

    // Decks methods
    getDecks() {
        return this.get(this.keys.decks) || [];
    }

    setDecks(decks) {
        return this.set(this.keys.decks, decks);
    }

    getUserDecks(userId) {
        const decks = this.getDecks();
        return decks.filter(deck => deck.userId === userId);
    }

    getDeckById(deckId) {
        const decks = this.getDecks();
        return decks.find(deck => deck.id === deckId) || null;
    }

    // Quizzes methods
    getQuizzes() {
        return this.get(this.keys.quizzes) || [];
    }

    setQuizzes(quizzes) {
        return this.set(this.keys.quizzes, quizzes);
    }

    getUserQuizzes(userId) {
        const quizzes = this.getQuizzes();
        return quizzes.filter(quiz => quiz.userId === userId);
    }

    getQuizById(quizId) {
        const quizzes = this.getQuizzes();
        return quizzes.find(quiz => quiz.id === quizId) || null;
    }

    // User stats methods
    getUserStats(userId) {
        const allStats = this.get(this.keys.userStats) || {};
        return allStats[userId] || {};
    }

    setUserStats(userId, stats) {
        const allStats = this.get(this.keys.userStats) || {};
        allStats[userId] = stats;
        return this.set(this.keys.userStats, allStats);
    }

    updateUserStats(userId, date, stats) {
        const userStats = this.getUserStats(userId);
        userStats[date] = stats;
        return this.setUserStats(userId, userStats);
    }

    // Current user methods
    getCurrentUser() {
        return this.get(this.keys.currentUser);
    }

    setCurrentUser(user) {
        return this.set(this.keys.currentUser, user);
    }

    clearCurrentUser() {
        try {
            localStorage.removeItem(this.keys.currentUser);
            return true;
        } catch (error) {
            console.error('Error clearing current user:', error);
            return false;
        }
    }

    // Settings methods
    getSettings(userId = null) {
        const key = userId ? `${this.keys.settings}_${userId}` : this.keys.settings;
        return this.get(key) || {};
    }

    setSettings(settings, userId = null) {
        const key = userId ? `${this.keys.settings}_${userId}` : this.keys.settings;
        return this.set(key, settings);
    }

    // Utility methods
    clearAll() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    }

    exportData() {
        const data = {};
        Object.values(this.keys).forEach(key => {
            data[key] = this.get(key);
        });
        return data;
    }

    importData(data) {
        try {
            Object.keys(data).forEach(key => {
                if (data[key] !== null) {
                    this.set(key, data[key]);
                }
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Create global instance
window.Storage = new StorageManager();
