import { Outlet, Navigate } from 'react-router-dom';

export default function protectedRoute() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    return isLoggedIn === "true" ? <Outlet /> : <Navigate to = "/"/>
}