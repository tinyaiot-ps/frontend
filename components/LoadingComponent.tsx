import React from 'react';

interface LoadingComponentProps {
  text?: string;
}

const LoadingComponent: React.FC<LoadingComponentProps> = ({ text }) => {
  // Default to "Loading" if text is not provided
  const displayText = text || 'Loading...';

  return (
    <div className="flex justify-center items-center select-none text-lg">
      {displayText}
    </div>
  );
};

export default LoadingComponent;
