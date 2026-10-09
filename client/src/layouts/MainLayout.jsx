import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import RestaurantSubNav from '../components/restaurant/RestaurantSubNav';

const MainLayout = () => {
  const location = useLocation();
  const isRestaurantRoute = location.pathname.startsWith('/restaurant');

  return (
    <div className="app-container">
      <Navbar />
      {isRestaurantRoute && <RestaurantSubNav />}
      <main className="main-content">
        <Outlet />
      </main>
      {!isRestaurantRoute && <Footer />}
    </div>
  );
};

export default MainLayout;
