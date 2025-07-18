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
          <div className="h-screen bg-verbo-dark flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 min-h-0 overflow-auto">
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
