
import { toast } from 'react-toastify';

export const showSuccessToast = (message) => {
  toast.success(message || 'Data Submitted Successfully', {
    position: "top-right",
    autoClose: 1000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};

export const showErrorToast = (message) => {
  toast.error(message || 'An error occurred', {
    position: "top-right",
    autoClose: 1000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
};

export const showLoadingToast = (message) =>
  toast.loading(message || "Please wait...", {
    position: "top-right",
  });

export const dismissToast = (id) => {
  if (id) toast.dismiss(id);
  else toast.dismiss();
};
