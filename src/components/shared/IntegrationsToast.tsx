import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const IntegrationsToast: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 10000); // 10-second delay

    return () => clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
      <span>Have you checked out our integrations?</span>
      <Link href="/integrations" className="text-blue-500 hover:underline">
        Learn more
      </Link>
      <button
        onClick={() => setVisible(false)}
        className="text-gray-500 hover:text-gray-700"
      >
        &times; {/* X icon */}
      </button>
    </div>
  );
};

export default IntegrationsToast;
