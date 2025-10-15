import React from 'react';
import { UserButton } from '@clerk/nextjs';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center px-8">
      <h1 className="font-[var(--font-crimson-text)] text-sm">Made by Satwik Baramal</h1>
      <p className=" text-2xl font-bold">Vivaranam</p>
      <div className="flex items-center">
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-10 h-10"
            }
          }}
          afterSignOutUrl="/sign-in"
        />
      </div>
    </header>
  );
};

export default Header;