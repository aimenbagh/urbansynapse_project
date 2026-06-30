import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

export default function ProtectedRoute() {
  const isAuth = useAuthStore((s) => !!s.token);
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}
