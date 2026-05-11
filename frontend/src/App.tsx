import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateJob from './pages/CreateJob';
import EditJob from './pages/EditJob';
import Registry from './pages/Registry';
import ApplyGate from './pages/ApplyGate';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-job" element={<CreateJob />} />
            <Route path="/edit-job/:id" element={<EditJob />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/apply/:token" element={<ApplyGate />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
