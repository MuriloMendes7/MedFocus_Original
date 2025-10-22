// IndexedDB Storage Module for MedFocus Cards
// Provides persistent storage using IndexedDB with fallback to localStorage

class IndexedDBStorage {
    constructor() {
        this.dbName = 'MedFocusDB';
        this.version = 1;
        this.db = null;
        this.ready = false;
        this.fallback = false;
        this.init();
    }

    async init() {
        try {
            this.db = await this.openDB();
            this.ready = true;
            console.log('IndexedDB initialized successfully');
        } catch (error) {
            console.warn('IndexedDB failed, falling back to localStorage:', error);
            this.fallback = true;
            this.ready = true;
        }
    }

    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('decks')) {
                    db.createObjectStore('decks', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('quizzes')) {
                    db.createObjectStore('quizzes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('userStats')) {
                    db.createObjectStore('userStats', { keyPath: 'userId' });
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    async waitForReady() {
        if (this.ready) return;
        return new Promise(resolve => {
            const check = () => {
                if (this.ready) resolve();
                else setTimeout(check, 10);
            };
            check();
        });
    }

    async get(storeName, key = null) {
        await this.waitForReady();
        if (this.fallback) {
            return this.localStorageFallback('get', storeName, key);
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = key ? store.get(key) : store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        await this.waitForReady();
        if (this.fallback) {
            return this.localStorageFallback('put', storeName, data);
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        await this.waitForReady();
        if (this.fallback) {
            return this.localStorageFallback('delete', storeName, key);
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        await this.waitForReady();
        if (this.fallback) {
            return this.localStorageFallback('getAll', storeName);
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    localStorageFallback(operation, storeName, data = null) {
        const key = `medFocus_${storeName}`;
        try {
            switch (operation) {
                case 'get':
                    const stored = localStorage.getItem(key);
                    return stored ? JSON.parse(stored) : (data ? null : []);
                case 'getAll':
                    const all = localStorage.getItem(key);
                    return all ? JSON.parse(all) : [];
                case 'put':
                    const current = JSON.parse(localStorage.getItem(key) || '[]');
                    if (Array.isArray(current)) {
                        const index = current.findIndex(item => item.id === data.id);
                        if (index >= 0) {
                            current[index] = data;
                        } else {
                            current.push(data);
                        }
                        localStorage.setItem(key, JSON.stringify(current));
                    } else {
                        localStorage.setItem(key, JSON.stringify([data]));
                    }
                    return data.id;
                case 'delete':
                    const items = JSON.parse(localStorage.getItem(key) || '[]');
                    const filtered = items.filter(item => item.id !== data);
                    localStorage.setItem(key, JSON.stringify(filtered));
                    return true;
                default:
                    return null;
            }
        } catch (error) {
            console.error('localStorage fallback error:', error);
            return null;
        }
    }

    // User methods
    async getUsers() {
        return await this.getAll('users');
    }

    async getUserById(userId) {
        return await this.get('users', userId);
    }

    async saveUser(user) {
        return await this.put('users', user);
    }

    async deleteUser(userId) {
        return await this.delete('users', userId);
    }

    // Deck methods
    async getDecks() {
        return await this.getAll('decks');
    }

    async getDeckById(deckId) {
        return await this.get('decks', deckId);
    }

    async saveDeck(deck) {
        return await this.put('decks', deck);
    }

    async deleteDeck(deckId) {
        return await this.delete('decks', deckId);
    }

    // Quiz methods
    async getQuizzes() {
        return await this.getAll('quizzes');
    }

    async getQuizById(quizId) {
        return await this.get('quizzes', quizId);
    }

    async saveQuiz(quiz) {
        return await this.put('quizzes', quiz);
    }

    async deleteQuiz(quizId) {
        return await this.delete('quizzes', quizId);
    }

    // User stats methods
    async getUserStats(userId) {
        return await this.get('userStats', userId) || {};
    }

    async saveUserStats(userId, stats) {
        return await this.put('userStats', { userId, ...stats });
    }

    // Settings methods
    async getSettings(key) {
        return await this.get('settings', key);
    }

    async saveSettings(key, value) {
        return await this.put('settings', { key, value });
    }

    // Utility methods
    async clearAll() {
        if (this.fallback) {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('medFocus_'));
            keys.forEach(k => localStorage.removeItem(k));
            return true;
        }

        const stores = ['users', 'decks', 'quizzes', 'userStats', 'settings'];
        const promises = stores.map(store => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([store], 'readwrite');
                const request = transaction.objectStore(store).clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });

        try {
            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('Error clearing IndexedDB:', error);
            return false;
        }
    }

    async exportData() {
        const data = {};
        const stores = ['users', 'decks', 'quizzes', 'userStats', 'settings'];

        for (const store of stores) {
            data[store] = await this.getAll(store);
        }

        return data;
    }

    async importData(data) {
        const stores = ['users', 'decks', 'quizzes', 'userStats', 'settings'];

        for (const store of stores) {
            if (data[store] && Array.isArray(data[store])) {
                for (const item of data[store]) {
                    await this.put(store, item);
                }
            }
        }

        return true;
    }
}

// Create global instance
window.IDBStorage = new IndexedDBStorage();
