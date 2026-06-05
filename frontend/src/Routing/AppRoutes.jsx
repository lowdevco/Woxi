import React, { useState, useEffect, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
  Outlet,
} from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  FiMenu as MenuIcon,
  FiLayout as DashboardIcon,
  FiMessageSquare as ChatIcon,
  FiUsers as PeopleIcon,
  FiColumns as KanbanIcon,
  FiSettings as SettingsIcon,
  FiLogOut as LogoutIcon,
  FiUser as AccountCircle,
  FiVolume2 as CampaignIcon,
  FiZap as BoltIcon,
  FiGitBranch as AccountTreeIcon,
  FiX as CloseIcon,
  FiSun as SunIcon,
  FiMoon as MoonIcon,
} from "react-icons/fi";
import { ThemeContext } from "../App.jsx";

// Pages imports
import Login from "../pages/Login.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Inbox from "../pages/Inbox.jsx";
import Contacts from "../pages/Contacts.jsx";
import Pipelines from "../pages/Pipelines.jsx";
import Broadcasts from "../pages/Broadcasts.jsx";
import Automations from "../pages/Automations.jsx";
import Flows from "../pages/Flows.jsx";
import Settings from "../pages/Settings.jsx";

import api from "../lib/api.js";
import { wsManager } from "../lib/websocket.js";

const drawerWidth = 260;

function DashboardLayout() {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch profile on initial layout mount (only once!)
    api
      .get("/accounts/me/")
      .then((res) => setUser(res.data))
      .catch(() => handleLogout());

    // Connect WebSockets
    wsManager.connect();

    return () => {
      wsManager.disconnect();
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    wsManager.disconnect();
    navigate("/login");
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Inbox", icon: <ChatIcon />, path: "/inbox" },
    { text: "Contacts", icon: <PeopleIcon />, path: "/contacts" },
    { text: "Pipelines", icon: <KanbanIcon />, path: "/pipelines" },
    { text: "Broadcasts", icon: <CampaignIcon />, path: "/broadcasts" },
    { text: "Automations", icon: <BoltIcon />, path: "/automations" },
    { text: "Flows", icon: <AccountTreeIcon />, path: "/flows", beta: true },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar sx={{ px: 3, display: "flex", justifyContent: "center" }}>
        <Typography
          variant="h5"
          color="primary"
          sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
        >
          Woxi
        </Typography>
      </Toolbar>
      <Divider />

      {/* Scrollable Menu Items */}
      <List sx={{ px: 2, py: 2, flexGrow: 1, overflowY: "auto" }}>
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: 2,
                  bgcolor: active ? "rgba(16, 185, 129, 0.08)" : "transparent",
                  color: active ? "primary.main" : "text.primary",
                  "&:hover": {
                    bgcolor: active
                      ? "rgba(16, 185, 129, 0.12)"
                      : "action.hover",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? "primary.main" : "text.secondary",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {item.text}
                      {item.beta && (
                        <Box
                          sx={{
                            bgcolor: "warning.main",
                            color: "warning.contrastText",
                            px: 0.75,
                            py: 0.1,
                            borderRadius: "4px",
                            fontSize: "8px",
                            fontWeight: 800,
                          }}
                        >
                          BETA
                        </Box>
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{
                    fontWeight: active ? 700 : 500,
                    fontSize: "14px",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />

      {/* Logout Action */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ borderRadius: 2 }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "background.paper",
          color: "text.primary",
          boxShadow: "none",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: 3 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text ||
              "Woxi"}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              onClick={toggleTheme}
              color="inherit"
              title={
                mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
              sx={{ p: 1 }}
            >
              {mode === "dark" ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </IconButton>
            {user && (
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, display: { xs: "none", md: "block" } }}
              >
                {user.profile?.full_name || user.username}
              </Typography>
            )}
            <IconButton onClick={handleMenu} color="inherit" sx={{ p: 0.5 }}>
              <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                {user?.username?.substring(0, 2).toUpperCase() || (
                  <AccountCircle />
                )}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              <MenuItem onClick={handleClose}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: "64px",
          bgcolor: "background.default",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

function PrivateRoute() {
  const isAuthenticated = !!localStorage.getItem("accessToken");
  return isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />;
}

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected routes wrapped in Outlets */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/pipelines" element={<Pipelines />} />
          <Route path="/broadcasts" element={<Broadcasts />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/flows" element={<Flows />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}
