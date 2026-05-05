import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAccount } from "../context/AccountContext";

export function RedirectIfAuthenticated() {
  const { isAuthenticated } = useAccount();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function RequireAuth() {
  const location = useLocation();
  const { isAuthenticated } = useAccount();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RequireSelectedAccount() {
  return <Outlet />;
}
