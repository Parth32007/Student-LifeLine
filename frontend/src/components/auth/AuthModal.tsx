import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { Login } from '../../pages/Login';
import { SignUp } from '../../pages/SignUp';

export type AuthTab = 'signin' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AuthTab;
  prefilledEmail?: string;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'signin',
  prefilledEmail,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [emailForVerification, setEmailForVerification] = useState<string>(prefilledEmail || '');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (prefilledEmail) {
      setEmailForVerification(prefilledEmail);
    }
  }, [prefilledEmail]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-lg z-10 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 p-2 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Tab Switcher */}
        <div className="flex items-center justify-center mb-3">
          <div className="flex items-center gap-1 p-1 bg-secondary/80 border border-border/60 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveTab('signin')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="max-h-[90vh] overflow-y-auto rounded-3xl">
          {activeTab === 'signin' && (
            <Login
              isModal
              onSuccess={() => {
                onClose();
                onSuccess?.();
              }}
            />
          )}

          {activeTab === 'signup' && (
            <SignUp
              isModal
              onSuccess={() => {
                onClose();
                onSuccess?.();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
