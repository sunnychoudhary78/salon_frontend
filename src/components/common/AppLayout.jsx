// src/components/common/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // adjust path if needed

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full">
      {/* Sidebar - Handles its own responsive visibility */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 min-w-0 w-full">
        <Outlet />
      </main>
    </div>
  );
}
