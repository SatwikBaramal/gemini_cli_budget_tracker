import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Budget Tracking App</h1>
      <p className="font-[var(--font-crimson-text)] text-sm">Made by Satwik Baramal</p>
    </header>
  );
};

export default Header;