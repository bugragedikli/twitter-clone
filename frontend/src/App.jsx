import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation} from 'react-router-dom';

import Home from './pages/Home';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import FollowList from './pages/FollowList';
import NotFound from './components/NotFound';
import { getMe } from './api/auth';
import { useQueryClient } from '@tanstack/react-query';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== '/') window.scrollTo(0, 0); // Feed kendi scroll'unu yönetiyor
  }, [pathname]);

  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const changeUser = (newUser) => {
    setUser(newUser);
    queryClient.clear(); // Clear the cache when the user changes (login/logout)
  };

  useEffect(() => {
    const fetchUser = async () => {
      try{
        const user = await getMe();
        setUser(user);
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
    <div>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login setUser={changeUser} />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register setUser={changeUser} />} />
          <Route element={ <Home user={user} setUser={changeUser} />}>
            <Route path="/" element={<Feed user={user} />} />
            <Route path="/:username" element={<Profile user={user} />} />
            <Route path="/:username/followers" element={<FollowList type="followers" user={user} />} />
            <Route path="/:username/followings" element={<FollowList type="followings" user={user} />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App
