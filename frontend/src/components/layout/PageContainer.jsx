import React from 'react';

export const PageContainer = ({ children, className = '', style = {} }) => {
  return (
    <main className={`page-container ${className}`} style={style}>
      {children}
    </main>
  );
};

export default PageContainer;
