import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/Profile';
import NewTrip from './pages/NewTrip';
import TripEditor from './pages/TripEditor';
import JoinTrip from './pages/JoinTrip';

const LoadingScreen = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Route pour les utilisateurs connectés (indépendamment du profil)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// Route pour le Dashboard (nécessite session + profil complet)
const DashboardRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  // On attend seulement la session au niveau critique
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;

  // Ici, on attend le profil de manière spécifique pour le Dashboard
  if (profile === undefined) return <LoadingScreen />;

  // Redirection vers setup si profil manquant ou incomplet
  if (profile === null || !profile.completed) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <>{children}</>;
}

const App: React.FC = () => {
  const { user, loading } = useAuth();

  // On ne bloque PLUS l'App entière. Les routes publiques (Home) seront toujours accessibles.
  // Le 'loading' initial de la session est très court (millisecondes).
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Si déjà connecté, on n'affiche pas le login */}
      <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/dashboard" replace />} />
      <Route path="/join/:token" element={<JoinTrip />} />

      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/new-trip"
        element={
          <ProtectedRoute>
            <NewTrip />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trips/:tripId/day/:dayIndex"
        element={
          <ProtectedRoute>
            <TripEditor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <DashboardRoute>
            <Dashboard />
          </DashboardRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;