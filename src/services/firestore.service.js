import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// User Service
export const userService = {
  async getUser(email) {
    const userDoc = await getDoc(doc(db, 'users', email));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
  },

  async updateUser(email, data) {
    const userRef = doc(db, 'users', email);
    await updateDoc(userRef, { ...data, updatedAt: Timestamp.now() });
    return true;
  },

  async createUser(email, username, isPremium = false, isAdmin = false) {
    const userRef = doc(db, 'users', email);
    await setDoc(userRef, {
      email,
      username,
      isPremium,
      isAdmin,
      subscription: null,
      subDate: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      transactions: [],
    });
    return true;
  },

  async getAllUsers(
    page = 1,
    pageSize = 50,
    filters = {},
    lastDoc = null,
    searchTerm = ''
  ) {
    try {
      let q = query(collection(db, 'users'));

      if (filters.isPremium !== undefined) {
        q = query(q, where('isPremium', '==', filters.isPremium));
      }

      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        q = query(
          q,
          where('email', '>=', searchLower),
          where('email', '<=', searchLower + '\uf8ff')
        );
      }

      if (!searchTerm) {
        if (lastDoc) {
          q = query(q, startAfter(lastDoc), limit(pageSize));
        } else {
          q = query(q, limit(pageSize));
        }
      }

      const snapshot = await getDocs(q);
      const users = [];
      let lastVisible = null;

      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
        lastVisible = doc;
      });

      return {
        users,
        hasMore: users.length === pageSize,
        lastDoc: lastVisible,
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { users: [], hasMore: false, lastDoc: null };
    }
  },

  async getAllUsersSimple(pageSize = 50, filters = {}) {
    try {
      let q = query(collection(db, 'users'));

      if (filters.isPremium !== undefined) {
        q = query(q, where('isPremium', '==', filters.isPremium));
      }

      q = query(q, limit(pageSize));

      const snapshot = await getDocs(q);
      const users = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Add this to the userService object in firestore.service.js

  /**
   * Set a user as admin by email
   * @param {string} email - The email of the user to make admin
   * @param {boolean} isAdmin - Whether to set as admin (true) or remove admin (false)
   * @returns {Promise<boolean>} - Returns true if successful
   */
  async setUserAsAdmin(email, isAdmin = true) {
    try {
      // Check if user exists first
      const userDoc = await getDoc(doc(db, 'users', email));

      if (!userDoc.exists()) {
        console.error(`User with email ${email} does not exist`);
        return false;
      }

      // Update the user's admin status
      const userRef = doc(db, 'users', email);
      await updateDoc(userRef, {
        isAdmin: isAdmin,
        updatedAt: Timestamp.now(),
      });

      console.log(
        `✅ User ${email} has been ${
          isAdmin ? 'granted' : 'revoked'
        } admin privileges`
      );
      return true;
    } catch (error) {
      console.error('Error setting user as admin:', error);
      return false;
    }
  },

  /**
   * Quick function to set kkibetkkoir@gmail.com as admin
   * @returns {Promise<boolean>} - Returns true if successful
   */
  async setKkibetkkoirAsAdmin() {
    return this.setUserAsAdmin('kkibetkkoir@gmail.com', true);
  },
};

// Tips Service
export const tipsService = {
  async getTipsByDate(date, limit_count = 50, isPremium = false) {
    try {
      let q = query(
        collection(db, 'tips'),
        where('date', '==', date),
        where('premium', '==', isPremium),
        limit(limit_count)
      );

      const snapshot = await getDocs(q);
      const tips = [];
      snapshot.forEach((doc) => tips.push({ id: doc.id, ...doc.data() }));
      return tips;
    } catch (error) {
      console.error('Error fetching tips:', error);
      return [];
    }
  },

  async getAllTips(limit_count = 100) {
    try {
      const q = query(
        collection(db, 'tips'),
        orderBy('date', 'desc'),
        limit(limit_count)
      );
      const snapshot = await getDocs(q);
      const tips = [];
      snapshot.forEach((doc) => tips.push({ id: doc.id, ...doc.data() }));
      return tips;
    } catch (error) {
      console.error('Error fetching tips:', error);
      return [];
    }
  },

  async addTip(tipData) {
    const timestamp = Date.now();
    const customId =
      `${tipData.home}_${tipData.away}_${tipData.date}_${timestamp}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
    const tipRef = doc(db, 'tips', customId);
    await setDoc(tipRef, { ...tipData, createdAt: Timestamp.now() });
    return customId;
  },

  async updateTip(id, data) {
    const tipRef = doc(db, 'tips', id);
    await updateDoc(tipRef, { ...data, updatedAt: Timestamp.now() });
    return true;
  },
};
