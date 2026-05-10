import React, { createContext, useContext, useState, useEffect } from 'react';

interface MailContextType {
  mailOpen: boolean;
  mailUnread: boolean;
  setMailOpen: (open: boolean) => void;
  setMailUnread: (unread: boolean) => void;
}

const MailContext = createContext<MailContextType | undefined>(undefined);

export const MailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mailOpen, setMailOpen] = useState(false);
  const [mailUnread, setMailUnread] = useState(
    localStorage.getItem('m87_mail_opened') !== 'true'
  );

  useEffect(() => {
    if (mailOpen && mailUnread) {
      setMailUnread(false);
      localStorage.setItem('m87_mail_opened', 'true');
    }
  }, [mailOpen, mailUnread]);

  return (
    <MailContext.Provider value={{ mailOpen, mailUnread, setMailOpen, setMailUnread }}>
      {children}
    </MailContext.Provider>
  );
};

export const useMail = () => {
  const context = useContext(MailContext);
  if (context === undefined) {
    throw new Error('useMail must be used within a MailProvider');
  }
  return context;
};
