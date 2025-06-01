// src/components/ui/notification-system/NotificationProvider.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  // Méthodes de convenance
  notifySuccess: (title: string, message: string, options?: Partial<Notification>) => string;
  notifyError: (title: string, message: string, options?: Partial<Notification>) => string;
  notifyWarning: (title: string, message: string, options?: Partial<Notification>) => string;
  notifyInfo: (title: string, message: string, options?: Partial<Notification>) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  maxNotifications = 50 
}) => {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('app-notifications', []);
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);

  // Fonction pour ajouter une notification
  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
      duration: notification.duration ?? (notification.persistent ? undefined : getDefaultDuration(notification.type)),
    };

    // Ajouter à l'historique
    setNotifications(prev => [newNotification, ...prev.slice(0, maxNotifications - 1)]);
    
    // Ajouter aux notifications actives (affichées)
    setActiveNotifications(prev => [newNotification, ...prev]);

    // Auto-remove après le délai spécifié (si pas persistant)
    if (!notification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeActiveNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [maxNotifications, setNotifications]);

  // Fonction pour supprimer une notification de l'historique
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    removeActiveNotification(id);
  }, [setNotifications]);

  // Fonction pour supprimer une notification active
  const removeActiveNotification = useCallback((id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Fonction pour marquer comme lu
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  }, [setNotifications]);

  // Fonction pour marquer toutes comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, [setNotifications]);

  // Fonction pour vider toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setActiveNotifications([]);
  }, [setNotifications]);

  // Méthodes de convenance
  const notifySuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ title, message, type: 'success', ...options });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ title, message, type: 'error', ...options });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ title, message, type: 'warning', ...options });
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ title, message, type: 'info', ...options });
  }, [addNotification]);

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer 
        notifications={activeNotifications}
        onRemove={removeActiveNotification}
        onMarkAsRead={markAsRead}
      />
    </NotificationContext.Provider>
  );
};

// Fonction pour obtenir la durée par défaut selon le type
const getDefaultDuration = (type: Notification['type']): number => {
  switch (type) {
    case 'success': return 4000;
    case 'info': return 6000;
    case 'warning': return 8000;
    case 'error': return 10000;
    default: return 5000;
  }
};

// Composant pour afficher les notifications actives
interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
  onMarkAsRead,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
            onMarkAsRead={onMarkAsRead}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Composant pour une notification individuelle
interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRemove,
  onMarkAsRead,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleRemove = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onRemove(notification.id);
  };

  useEffect(() => {
    // Marquer comme lu après 2 secondes si affiché
    const timer = setTimeout(() => {
      if (!notification.read) {
        onMarkAsRead(notification.id);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [notification.id, notification.read, onMarkAsRead]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`p-4 rounded-lg border shadow-lg backdrop-blur-sm ${getBackgroundColor()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {notification.message}
              </p>
            </div>
            
            <button
              onClick={handleRemove}
              className={`ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors ${
                isHovered ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          
          {notification.action && (
            <div className="mt-3">
              <button
                onClick={() => {
                  notification.action!.onClick();
                  handleRemove();
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {notification.action.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Composant pour l'historique des notifications dans la toolbar
export const NotificationHistory: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 10);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "Maintenant";
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return "🟢";
      case "error": return "🔴";
      case "warning": return "🟡";
      case "info": return "🔵";
      default: return "ℹ️";
    }
  };

  return (
    <div className="w-80 max-h-96 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold">Notifications</h3>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Tout marquer comme lu
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Tout effacer
            </button>
          )}
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-2xl mb-2">🔔</div>
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-medium truncate ${
                        notification.read ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className={`text-xs line-clamp-2 ${
                      notification.read ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {notification.message}
                    </p>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {notifications.length > 10 && (
        <div className="p-3 border-t text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Voir toutes les notifications ({notifications.length})
          </button>
        </div>
      )}
    </div>
  );
};