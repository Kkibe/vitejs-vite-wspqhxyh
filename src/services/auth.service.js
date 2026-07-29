import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { userService } from './firestore.service';

class AuthService {
  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userData = await userService.getUser(email);
      return { success: true, user: userCredential.user, userData };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  /**
   * Register a new user
   */
  async register(email, password, username) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, { displayName: username });
      await userService.createUser(email, username, false, false);
      await sendEmailVerification(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  /**
   * Send password reset email
   */
  async forgotPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + '/login',
        handleCodeInApp: false,
      });
      return {
        success: true,
        message: 'Password reset email sent. Check your inbox.',
      };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const existingUser = await userService.getUser(user.email);

      if (!existingUser) {
        await userService.createUser(
          user.email,
          user.displayName || user.email.split('@')[0],
          false,
          false
        );
      }

      return { success: true, user };
    } catch (error) {
      let errorMessage = this.getErrorMessage(error.code);

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site.';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    await signOut(auth);
    return true;
  }

  /**
   * Get error message from error code
   */
  getErrorMessage(code) {
    const errors = {
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account already exists with this email.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed':
        'Network error. Please check your connection.',
      'auth/requires-recent-login': 'Please log in again to continue.',
      'auth/account-exists-with-different-credential':
        'An account already exists with a different sign-in method.',
    };
    return errors[code] || 'An error occurred. Please try again.';
  }
}

export const authService = new AuthService();
