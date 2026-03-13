import React, { useState, useEffect } from 'react';

const Popup = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'alert', // 'alert', 'confirm', 'prompt'
  onConfirm,
  inputValue = '',
  placeholder = 'Type here...',
  confirmText = 'OK',
  cancelText = 'Cancel'
}) => {
  const [inputVal, setInputVal] = useState(inputValue);

  useEffect(() => {
    if (isOpen) {
      setInputVal(inputValue);
    }
  }, [isOpen, inputValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputVal);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal-content glass-effect" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '15px' }}>{title || (type === 'alert' ? 'Message' : type === 'confirm' ? 'Confirm' : 'Input Required')}</h3>
        {message && <p style={{ marginBottom: '20px', color: '#ccc' }}>{message}</p>}
        
        {type === 'prompt' && (
          <input 
            type="text" 
            value={inputVal} 
            onChange={(e) => setInputVal(e.target.value)} 
            placeholder={placeholder}
            style={{ 
              width: '100%', 
              padding: '10px', 
              marginBottom: '20px', 
              borderRadius: '5px',
              border: '1px solid #444',
              background: '#222',
              color: 'white'
            }}
            autoFocus
          />
        )}
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {(type === 'confirm' || type === 'prompt') && (
            <button 
              onClick={onClose}
              style={{ padding: '8px 16px', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={handleConfirm}
            style={{ 
              padding: '8px 16px', 
              background: type === 'alert' ? '#4CAF50' : '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
