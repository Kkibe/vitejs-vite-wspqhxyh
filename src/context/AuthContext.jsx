import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { userService } from '../services/firestore.service';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const data = await userService.getUser(user.email);
          setUserData(data);
          setIsAdmin(data?.isAdmin || false);
          setIsPremium(data?.isPremium || false);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
        setIsAdmin(false);
        setIsPremium(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        const data = await userService.getUser(currentUser.email);
        setUserData(data);
        setIsAdmin(data?.isAdmin || false);
        setIsPremium(data?.isPremium || false);
        return data;
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
    return null;
  };

  const value = {
    currentUser,
    userData,
    loading,
    isAdmin,
    isPremium,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
