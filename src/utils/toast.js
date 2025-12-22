/**
 * Simple toast notification utility
 */
let toastContainer = null;

const createToastContainer = () => {
  if (toastContainer) return toastContainer;
  
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed top-4 right-4 z-50 space-y-2';
  document.body.appendChild(container);
  toastContainer = container;
  return container;
};

const showToast = (message, type = 'info') => {
  const container = createToastContainer();
  
  const toast = document.createElement('div');
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }[type] || 'bg-blue-500';
  
  toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right`;
  toast.innerHTML = `<span>${message}</span>`;
  
  container.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'fade-out 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

export const toast = {
  success: (message) => showToast(message, 'success'),
  error: (message) => showToast(message, 'error'),
  info: (message) => showToast(message, 'info'),
  warning: (message) => showToast(message, 'warning')
};

