import { useState } from "react";
import Sidebar from "./Sidebar";
import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="admin-layout-overlay"
          onClick={handleCloseSidebar}
        />
      )}

      {/* MOBILE MENU BUTTON */}
      <button
        type="button"
        className="admin-mobile-menu"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="Toggle navigation menu"
        aria-expanded={sidebarOpen}
      >
        ☰
      </button>

      {/* MAIN PAGE CONTENT */}
      <main className="admin-main-content">
        {children}
      </main>

    </div>
  );
};

export default AdminLayout;

