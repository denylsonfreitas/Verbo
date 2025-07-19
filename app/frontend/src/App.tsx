import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Game from './pages/Game';
import Stats from './pages/Stats';
import Admin from './pages/Admin';
import Account from './pages/Account';
import ResetPassword from './pages/ResetPassword';
import { GameProvider } from './contexts/GameContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <TutorialProvider>
          <Router 
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <div className="h-screen bg-verbo-dark flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 min-h-0 overflow-auto">
                <Routes>
                  <Route path="/" element={<Game />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Routes>
              </main>
            </div>
          </Router>
        </TutorialProvider>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
