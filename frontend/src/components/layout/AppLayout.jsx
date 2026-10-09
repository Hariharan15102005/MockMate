import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';
import Topbar from './Topbar';
import PageContainer from './PageContainer';

export const AppLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <PageContainer>
          {children}
        </PageContainer>
      </div>
    </div>
  );
};

export default AppLayout;
