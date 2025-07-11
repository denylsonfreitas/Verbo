import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Game from './pages/Game';
import Stats from './pages/Stats';
import Admin from './pages/Admin';
import { GameProvider } from './contexts/GameContext';
import { TutorialProvider } from './contexts/TutorialContext';

function App() {
  return (
    <GameProvider>
      <TutorialProvider>
        <Router 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <div className="min-h-screen bg-verbo-dark">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Game />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </main>
          </div>
        </Router>
      </TutorialProvider>
    </GameProvider>
  );
}

export default App;
