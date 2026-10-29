// Path: src/components/Navbar.tsx
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

import { getNavbarSites } from "../services/siteService";
import type { SiteDropdownDto } from "../services/siteService";

import { useEffect, useState } from "react";
import { useAuth } from "../context/Authcontext";
import { useSite } from "../context/Sitecontext";

function Navbar() {
  const { user, logout } = useAuth();
  const { selectedSite, setSelectedSite } = useSite();
  const navigate = useNavigate();

  const [sites, setSites] = useState<SiteDropdownDto[]>([]);
  const [pendingSiteId, setPendingSiteId] = useState<string>(
    selectedSite ? String(selectedSite.id) : ""
  );

  // Mobile menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => { loadSites(); }, []);

  useEffect(() => {
    setPendingSiteId(selectedSite ? String(selectedSite.id) : "");
  }, [selectedSite]);

  const loadSites = async () => {
    try {
      const data = await getNavbarSites();
      setSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate("/login");
  };

  const handleGo = () => {
    if (!pendingSiteId) {
      alert("Please select site");
      return;
    }
    const site = sites.find((s) => String(s.id) === pendingSiteId);
    if (!site) {
      alert("Selected site not found");
      return;
    }
    setSelectedSite(site);
    closeMenu();
    navigate("/home");
  };

  return (
    <nav className="ce-navbar">
      <div className="ce-container">

        {/* Logo */}
        <Link to="/home" className="ce-brand" onClick={closeMenu}>
          <img src="/UploadedImage/WebSiteLogo.jpg" alt="Builder Ledger" />
        </Link>

        {/* Hamburger (visible only on small screens) */}
        <button
          type="button"
          className="ce-toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Collapsible area: menu + site selector + user */}
        <div className={`ce-collapse ${menuOpen ? "open" : ""}`}>

          {/* Menu */}
          <ul className="ce-nav-links">
            <li><Link to="/home" onClick={closeMenu}>Home</Link></li>
            <li><Link to="/cost-master" onClick={closeMenu}>Cost Master</Link></li>
            <li><Link to="/attendance" onClick={closeMenu}>Attendance</Link></li>
            <li><Link to="/material" onClick={closeMenu}>Material</Link></li>
            <li><Link to="/service-provider" onClick={closeMenu}>Contractors</Link></li>
            <li><Link to="/sites" onClick={closeMenu}>Site</Link></li>
          </ul>

          {/* Right */}
          <div className="ce-right">
            <span className="ce-site-label">SITE</span>

            <select
              className="ce-select"
              value={pendingSiteId}
              onChange={(e) => setPendingSiteId(e.target.value)}
            >
              <option value="">-- Select Site --</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>

            <button className="ce-go" onClick={handleGo}>
              Go
            </button>

            <div className="ce-divider" />

            <span className="ce-user">
              Welcome, {user?.fullName || "User"}
            </span>

            <button className="ce-logout" onClick={handleLogout}>
              Log Out
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;