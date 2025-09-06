import React, { useState, useEffect, useMemo } from 'react';
import { styled, ThemeProvider } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import { Toolbar, Typography, Button, IconButton, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Collapse, Box, CircularProgress, Divider, Drawer } from '@mui/material';
import { ShoppingCart, People, Inventory, Assessment, AdminPanelSettings, ExpandLess, ExpandMore, Brightness4 as Brightness4Icon, Brightness7 as Brightness7Icon, Assignment, Dashboard as DashboardIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes, Link, useNavigate } from 'react-router-dom';
import apiClient from './api';
import getAppTheme from './theme';

import Clientes from './components/Clientes';
import Productos from './components/Productos';
import Ventas from './components/Ventas';
import Reportes from './components/Reportes';
import ResumenVentas from './components/ResumenVentas';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import RoleManagement from './components/RoleManagement';
import ModuleManagement from './components/ModuleManagement';
import OrdenesTrabajo from './components/OrdenesTrabajo';
import Notifications from './components/Notifications';
import PanelOperador from './components/PanelOperador';
import { SpeedInsights } from "@vercel/speed-insights/react";



const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar)(({ theme }) => ({
    zIndex: theme.zIndex.drawer + 1,
}));

const Home = () => {
  const theme = useTheme();

  return (
    <Box sx={{ textAlign: 'center', mt: 5 }}>
      <Box
        component="img"
        sx={{
          height: 'auto',
          width: '100%',
          maxWidth: 250,
          borderRadius: '15px',
          mb: 3,
        }}
        alt="Peleteria Jeylor Logo"
        src={process.env.PUBLIC_URL + '/Logo1.jpg'}
      />
      <Typography variant="h4" component="h2" sx={{ color: theme.palette.text.primary }}>
        Bienvenido al Sistema de Ventas de Peleteria Jeylor
      </Typography>
    </Box>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const navigate = useNavigate();

  const [mode, setMode] = useState(() => {
    const storedMode = localStorage.getItem('themeMode');
    return storedMode === 'dark' ? 'dark' : 'light';
  });

  const appTheme = useMemo(() => getAppTheme(mode), [mode]);
  const theme = useTheme();

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const handleThemeToggle = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await apiClient.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsAuthenticated(true);
        setUser(response.data);
        localStorage.setItem('userModules', JSON.stringify(response.data.role.modules.map(m => m.frontend_path)));
      } catch (error) {
        console.error('Error al verificar la autenticación:', error);
        handleLogout(false);
        toast.error('Sesión expirada o inválida. Por favor, inicia sesión nuevamente.');
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('userModules');
    }
    setLoading(false);
  };

  const hasAccess = (path) => {
    if (!user || !user.role || !user.role.modules) return false;
    return user.role.modules.some(module => module.frontend_path === path);
  };

  const handleLogin = () => {
    checkAuth();
  };

  const handleLogout = (showToast = true) => {
    localStorage.removeItem('token');
    localStorage.removeItem('userModules');
    setIsAuthenticated(false);
    setUser(null);
    if (showToast) {
      toast.info('Sesión cerrada.');
    }
    navigate('/login');
  };

  const handleAdminClick = () => {
    setAdminOpen(!adminOpen);
  };

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const menuItems = [
    { path: '/panel-operador', text: 'Panel del Operador', icon: <DashboardIcon />, color: 'purple' },
    { path: '/ventas', text: 'Ventas', icon: <ShoppingCart />, color: 'orange' },
    { path: '/ordenes-trabajo', text: 'Órdenes de Trabajo', icon: <Assignment />, color: 'teal' },
    { path: '/clientes', text: 'Clientes', icon: <People />, color: 'blue' },
    { path: '/productos', text: 'Productos', icon: <Inventory />, color: 'green' },
    { path: '/reportes', text: 'Reportes', icon: <Assessment />, color: 'red' },
  ];

  const adminMenuItems = [
    { path: '/admin/users', text: 'Gestionar Usuarios' },
    { path: '/admin/roles', text: 'Gestionar Roles' },
    { path: '/admin/modules', text: 'Gestionar Módulos' },
  ];

  const collapsedDrawerWidth = `calc(${theme.spacing(7)} + 1px)`;

  return (
    <ThemeProvider theme={appTheme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: appTheme.palette.background.default }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isAuthenticated ? (
              <>
                <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                  <Toolbar>
                    <Box sx={{ flexGrow: 1, ml: 2, display: 'flex', alignItems: 'center' }}>
                      <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                        <Box
                          component="img"
                          sx={{
                            height: 40,
                            mr: 1,
                          }}
                          alt="Logo"
                          src="/Logo2.png"
                        />
                        <Typography variant="h6" noWrap component="div">
                          Peleteria Jeylor
                        </Typography>
                      </Link>
                    </Box>
                    <IconButton sx={{ ml: 1 }} onClick={handleThemeToggle} color="inherit">
                      {mode === 'dark' ? <Brightness4Icon /> : <Brightness7Icon />}
                    </IconButton>
                    <Notifications />
                    <Typography variant="body1" sx={{ mr: 2, ml: 2 }}>
                      Bienvenido, {user?.username} ({user?.role?.name})
                    </Typography>
                    <Button color="inherit" onClick={() => handleLogout()}>Cerrar Sesión</Button>
                  </Toolbar>
                </AppBar>
                
                <Drawer
                    variant="permanent"
                    sx={{
                        width: collapsedDrawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: collapsedDrawerWidth,
                            boxSizing: 'border-box',
                            overflowX: 'hidden',
                        },
                    }}
                    onMouseEnter={handleDrawerOpen}
                >
                    <DrawerHeader />
                    <Divider />
                    <List>
                        {menuItems.map((item) => (
                            hasAccess(item.path) && (
                                <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                                    <ListItemButton component={Link} to={item.path} sx={{ minHeight: 48, justifyContent: 'center', px: 2.5 }}>
                                        <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', color: item.color }}>
                                            {item.icon}
                                        </ListItemIcon>
                                    </ListItemButton>
                                </ListItem>
                            )
                        ))}
                        {user?.role?.name === 'Admin' && (
                             <ListItem disablePadding sx={{ display: 'block' }}>
                                <ListItemButton sx={{ minHeight: 48, justifyContent: 'center', px: 2.5 }}>
                                    <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center', color: 'purple' }}>
                                        <AdminPanelSettings />
                                    </ListItemIcon>
                                </ListItemButton>
                            </ListItem>
                        )}
                    </List>
                </Drawer>

                <Drawer
                    anchor="left"
                    open={drawerOpen}
                    onClose={handleDrawerClose}
                    variant="temporary"
                    PaperProps={{
                        onMouseLeave: handleDrawerClose,
                        sx: { 
                            width: drawerWidth,
                            overflowX: 'hidden',
                         }
                    }}
                >
                    <DrawerHeader />
                    <Divider />
                    <List>
                        {menuItems.map((item) => (
                        hasAccess(item.path) && (
                            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                                <ListItemButton component={Link} to={item.path} onClick={handleDrawerClose} sx={{ minHeight: 48, justifyContent: 'initial', px: 2.5 }}>
                                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: 'center', color: item.color }}>
                                    {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} sx={{ color: appTheme.palette.text.primary }} />
                                </ListItemButton>
                            </ListItem>
                        )
                        ))}
                        {user?.role?.name === 'Admin' && (
                        <>
                            <ListItem disablePadding sx={{ display: 'block' }}>
                                <ListItemButton onClick={handleAdminClick} sx={{ minHeight: 48, justifyContent: 'initial', px: 2.5 }}>
                                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: 'center', color: 'purple' }}>
                                        <AdminPanelSettings />
                                    </ListItemIcon>
                                    <ListItemText primary="Administración" />
                                    {adminOpen ? <ExpandLess /> : <ExpandMore />}
                                </ListItemButton>
                            </ListItem>
                            <Collapse in={adminOpen} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {adminMenuItems.map((item) => (
                                    <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                                        <ListItemButton component={Link} to={item.path} onClick={handleDrawerClose} sx={{ pl: 4, minHeight: 48, justifyContent: 'initial', px: 2.5 }}>
                                            <ListItemText primary={item.text} sx={{ color: appTheme.palette.text.primary }} />
                                        </ListItemButton>
                                    </ListItem>
                                    ))}
                                </List>
                            </Collapse>
                        </>
                        )}
                    </List>
                </Drawer>

                <Box component="main" sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                    <DrawerHeader />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/ventas" element={<Ventas />} />
                        <Route path="/clientes" element={<Clientes />} />
                        <Route path="/productos" element={<Productos />} />
                        <Route path="/reportes" element={<Reportes />} />
                        <Route path="/ordenes-trabajo" element={<OrdenesTrabajo user={user} />} />
                        {hasAccess('/panel-operador') && <Route path="/panel-operador" element={<PanelOperador />} />}
                        {user?.role?.name === 'Admin' && (
                          <>
                            <Route path="/admin/users" element={<UserManagement />} />
                            <Route path="/admin/roles" element={<RoleManagement />} />
                            <Route path="/admin/modules" element={<ModuleManagement />} />
                          </>
                        )}
                    </Routes>
                    <Box component="footer" sx={{ p: 2, mt: 'auto', textAlign: 'center', borderTop: `1px solid ${appTheme.palette.divider}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Sistema de información de Peletería Jeylor 2025
                            </Typography>
                            <Box
                                component="img"
                                sx={{
                                    height: 24,
                                    ml: 1,
                                }}
                                alt="Logo"
                                src="/Logo2.png"
                            />
                        </Box>
                    </Box>
                </Box>
              </>
            ) : (
                <Routes>
                    <Route path="*" element={<Login onLogin={handleLogin} />} />
                </Routes>
            )}
          </>
        )}
      </Box>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    <SpeedInsights />
    </ThemeProvider>
    
  );
}

export default App;