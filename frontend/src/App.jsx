import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';

import Home from './pages/Home';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './components/NotFound';
import axios from 'axios';

axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try{
        const res = await axios.get('http://localhost:3000/auth/me');
        setUser(res.data);
      }
      catch (err) {
        console.error(err);
        setUser(null);
      }
      finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register setUser={setUser} />} />
        <Route element={ <Home user={user} setUser={setUser} />}>
          <Route path="/" element={<Feed />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
