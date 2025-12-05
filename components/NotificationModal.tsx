
import React from 'react';


interface NotificationModalProps {
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = React.memo(({ onClose }) => (
  <div className="modal">
    {/* Render notification content */}
    <button onClick={onClose}>Close</button>
  </div>
));
