import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAccount } from "../context/AccountContext";

const hasToken = () => Boolean(window.localStorage.getItem("token"));

export function RedirectIfAuthenticated() {
  if (hasToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function RequireAuth() {
  const location = useLocation();

  if (!hasToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RequireSelectedAccount() {
  const location = useLocation();
  const { hasActiveAccount, isLoading } = useAccount();

  if (isLoading) {
    return null;
  }

  if (!hasActiveAccount) {
    return (
      <Navigate
        to="/accounts"
        replace
        state={{ redirectTo: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
