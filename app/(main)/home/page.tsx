import React from "react";
import Navbar from "@/components/layout/Navbar";
export default function page() {
  return (
    <div>
      <Navbar />
      <h1 className="text-2xl font-bold text-center mt-10">Welcome to the Home Page!</h1>
      <p className="text-center mt-4 text-gray-600">
        This is the landing page for students after login.
      </p>
    </div>
  );
}
