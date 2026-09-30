import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = ({user, setUser}) => {
    return (
        <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)_400px]">
        <div className="border-r border-(--accent-color) px-4">
          <Navbar user={user} setUser={setUser} />
        </div>

        <main className="min-w-0">
          <Outlet />
        </main>

        <div className="hidden border-l border-(--accent-color) p-4 lg:block">
          <div className="sticky top-4">
            <input
              type="search"
              placeholder="Ara"
              aria-label="Ara"
              className="w-full rounded-2xl bg-(--accent-color) px-4 py-2"
            />
            <h2 className="mt-6 text-xl font-bold">Trends</h2>
          </div>
        </div>
      </div>
    )
};

export default Home;