// Lets plain JS files (like axiosInstance) trigger React Router navigation,
// which normal hooks can't do outside a component. Set once from App.jsx.
let navigateRef = null;

export const setNavigate = (navigate) => {
  navigateRef = navigate;
};

export const navigateTo = (path) => {
  if (navigateRef) {
    navigateRef(path);
  } else {
    // fallback, in case this is ever called before App.jsx has mounted
    window.location.href = path;
  }
};