import React, { lazy } from "react";
const ModernMenuPage = lazy(() => import("../components/ModernMenuGrid.jsx"));
const ModernCart = lazy(() => import("../components/ModernCart.jsx"));
const ModernCheckout = lazy(() => import("../components/ModernCheckoutStepper.jsx"));

export const modernFoodRoutes = [
  { path: "/food-modern/menu", element: <ModernMenuPage /> },
  { path: "/food-modern/cart", element: <ModernCart /> },
  { path: "/food-modern/checkout", element: <ModernCheckout /> },
];
