// MedFocus Cards - Storage Module
// Global storage wrapper for localStorage operations

// Prevent duplicate declaration
if (typeof StorageManager === 'undefined') {
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
                console.error('Error getting data:', error);
                return null;
            }
        }

        // Generic set method
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error setting data:', error);
                return false;
            }
        }

        // Generic remove method
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error removing data:', error);
                return false;
            }
        }

        // User stats methods
        getUserStats(userId) {
            const key = `${this.keys.userStats}_${userId}`;
            return this.get(key) || {};
        }

        setUserStats(userId, stats) {
            const key = `${this.keys.userStats}_${userId}`;
            return this.set(key, stats);
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

        // Users methods
        getUsers() {
            return this.get(this.keys.users) || [];
        }

        setUsers(users) {
            return this.set(this.keys.users, users);
        }

        // Decks methods
        getDecks() {
            return this.get(this.keys.decks) || [];
        }

        setDecks(decks) {
            return this.set(this.keys.decks, decks);
        }

        // Quizzes methods
        getQuizzes() {
            return this.get(this.keys.quizzes) || [];
        }

        setQuizzes(quizzes) {
            return this.set(this.keys.quizzes, quizzes);
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

        // Export/Import methods
        exportData() {
            const data = {};
            Object.values(this.keys).forEach(key => {
                data[key] = this.get(key);
            });
            return data;
        }

        importData(data) {
            try {
                Object.entries(data).forEach(([key, value]) => {
                    if (value !== null) {
                        this.set(key, value);
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
}