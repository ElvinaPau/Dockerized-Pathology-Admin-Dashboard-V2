import { useNavigate } from "react-router-dom";
import { IoIosMenu } from "react-icons/io";
import { useState, useEffect, useRef } from "react";
import HtaaQLogo from "../assets/HtaaQ-logo.png";
import SideNav from "./SideNav";
import "../css/HomePageHeader.css";
import { useNavigation } from "../context/NavigationContext";
import { useAuth } from "../context/AuthContext";

function HomePageHeader() {
  const navigate = useNavigate();
  const { isNavExpanded, setIsNavExpanded } = useNavigation();
  const { admin, logout } = useAuth();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogoClick = () => {
    navigate("/home");
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      //Remove token from storage
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");

      //Redirect to login
      navigate("/");
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLogoutMenu(false);
      }
    };

    if (showLogoutMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLogoutMenu]);

  return (
    <>
      <div className="header">
        <div>
          <IoIosMenu
            className="menu"
            onClick={() => setIsNavExpanded((prev) => !prev)}
          />
          <img
            onClick={handleLogoClick}
            src={HtaaQLogo}
            className="htaaq-logo"
            alt="Logo"
          />
        </div>

        <div className="username-container" ref={menuRef}>
          <h3
            className="username"
            onClick={() => setShowLogoutMenu((prev) => !prev)}
          >
            {admin ? admin.full_name : "Loading..."}
          </h3>

          {showLogoutMenu && (
            <div className="logout-menu">
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <SideNav isExpanded={isNavExpanded} />
    </>
  );
}

export default HomePageHeader;
