import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Temporary demo credentials. Replace with backend authentication before production.
const DEMO_ADMIN = {
  email: 'nikhilpalyal6@gmail.com',
  password: 'Nikhil@123',
  user: {
    name: 'Nikhil Palyal',
    email: 'nikhilpalyal6@gmail.com',
    role: 'admin',
    avatar: 'NP',
  },
};

const DEMO_STUDENT = {
  email: 'student@example.com',
  password: 'Student@123',
  user: {
    name: 'Demo Student',
    email: 'student@example.com',
    role: 'student',
    institution: 'Tufts University',
    avatar: 'DS',
  },
};

const STORAGE_KEY = 'labshare_user';
const REGISTERED_USERS_KEY = 'labshare_registered_users';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Backward compatibility state for teammate's existing landing/dashboard components
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('landing');

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // 1. Check fixed Admin credentials
    if (cleanEmail === DEMO_ADMIN.email.toLowerCase() && cleanPassword === DEMO_ADMIN.password) {
      const adminUser = DEMO_ADMIN.user;
      setUser(adminUser);
      return adminUser;
    }

    // 2. Check fixed Student credentials
    if (cleanEmail === DEMO_STUDENT.email.toLowerCase() && cleanPassword === DEMO_STUDENT.password) {
      const studentUser = DEMO_STUDENT.user;
      setUser(studentUser);
      return studentUser;
    }

    // 3. Check locally registered demo accounts
    try {
      const registered = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]');
      const found = registered.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
      );
      if (found) {
        // Do NOT store the password in the active session user object
        const authenticatedUser = {
          name: found.name,
          email: found.email,
          institution: found.institution || 'Partner University',
          role: 'student', // All signup accounts are strictly students
          avatar: found.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        };
        setUser(authenticatedUser);
        return authenticatedUser;
      }
    } catch {
      // ignore parse errors
    }

    throw new Error('Invalid email or password. Please check your credentials and try again.');
  };

  const signup = async ({ name, institution, email, password }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanInstitution = (institution || '').trim();

    if (!cleanName || !cleanEmail || !password) {
      throw new Error('Please fill in all required fields.');
    }

    // Cannot register demo admin email as student
    if (cleanEmail === DEMO_ADMIN.email.toLowerCase()) {
      throw new Error('An account with this email already exists.');
    }

    let registered = [];
    try {
      registered = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]');
    } catch {
      registered = [];
    }

    if (registered.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email already exists.');
    }

    // Save student to local demo store
    registered.push({
      name: cleanName,
      institution: cleanInstitution,
      email: cleanEmail,
      password,
    });
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));

    // Active session user object — NEVER contains password
    const newUser = {
      name: cleanName,
      email: cleanEmail,
      institution: cleanInstitution || 'Partner University',
      role: 'student', // Signup creates ONLY a normal student/user
      avatar: cleanName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    };

    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setCurrentView('landing');
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);
  const navigateTo = (view) => setCurrentView(view);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        role: user?.role || null,
        login,
        signup,
        logout,
        // Backward compatibility
        activeTab,
        setActiveTab,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        currentView,
        navigateTo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;