import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { userService } from '../services/userService';
import firebaseConfig from '../../firebase-applet-config.json';

// When the bundled Firebase config still has the AI Studio placeholder values,
// real Google sign-in cannot work. In that case we fall back to a local mock
// session so the platform is fully usable. As soon as a real config is dropped
// into firebase-applet-config.json, real authentication takes over automatically.
const IS_MOCK_AUTH = firebaseConfig.apiKey === 'remixed-api-key' || !firebaseConfig.apiKey;

const MOCK_USER = {
  uid: 'dev-mbagayoko',
  email: 'mbagayoko@unfpa.org',
  displayName: 'Moussa BAGAYOKO',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
} as unknown as User;

const MOCK_PROFILE: UserProfile = {
  uid: 'dev-mbagayoko',
  email: 'mbagayoko@unfpa.org',
  displayName: 'Moussa BAGAYOKO',
  role: UserRole.ADMIN,
  title: 'Strategic Information Analyst',
  department: 'WCARO — Strategic Information Unit',
  location: 'Dakar, Senegal',
  bio: 'Geospatial intelligence lead for the West and Central Africa Regional Office.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === UserRole.ADMIN;
  const isEditor = profile?.role === UserRole.EDITOR || isAdmin;

  const refreshProfile = async () => {
    if (IS_MOCK_AUTH) {
      if (user) setProfile(MOCK_PROFILE);
      return;
    }
    if (user) {
      const userProfile = await userService.getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
      } else {
        // Create a default profile if it doesn't exist
        const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Guest User',
          photoURL: user.photoURL || undefined,
          role: user.email === 'mbagayoko@unfpa.org' ? UserRole.ADMIN : UserRole.VIEWER,
        };
        await userService.createUserProfile(newProfile);
        const createdProfile = await userService.getUserProfile(user.uid);
        setProfile(createdProfile);
      }
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    if (IS_MOCK_AUTH) {
      // No real backend — start logged out, login() will hydrate the mock session.
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        let userProfile = await userService.getUserProfile(currentUser.uid);
        
        // Ensure mbagayoko@unfpa.org always has ADMIN role
        if (currentUser.email === 'mbagayoko@unfpa.org') {
          if (!userProfile) {
            const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Guest User',
              photoURL: currentUser.photoURL || undefined,
              role: UserRole.ADMIN,
            };
            await userService.createUserProfile(newProfile);
            userProfile = await userService.getUserProfile(currentUser.uid);
          } else if (userProfile.role !== UserRole.ADMIN) {
            await userService.updateUserProfile(currentUser.uid, { role: UserRole.ADMIN });
            userProfile = { ...userProfile, role: UserRole.ADMIN };
          }
        }

        if (userProfile) {
          setProfile(userProfile);
        } else {
          // Fallback for other new users
          const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Guest User',
            photoURL: currentUser.photoURL || undefined,
            role: UserRole.VIEWER,
          };
          await userService.createUserProfile(newProfile);
          const createdProfile = await userService.getUserProfile(currentUser.uid);
          setProfile(createdProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (IS_MOCK_AUTH) {
      setUser(MOCK_USER);
      setProfile(MOCK_PROFILE);
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (IS_MOCK_AUTH) {
      setUser(null);
      setProfile(null);
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin, 
      isEditor, 
      login, 
      logout,
      refreshProfile
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
