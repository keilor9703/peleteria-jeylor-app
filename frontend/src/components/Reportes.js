import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material'; // Added Tabs and Tab
import ResumenVentas from './ResumenVentas'; // Keep this for the first tab
import ProductSales from './ProductSales'; // New import
import CustomerBuyers from './CustomerBuyers'; // New import
import CustomerDebtors from './CustomerDebtors'; // New import
import RentabilidadReporte from './RentabilidadReporte'; // <-- Importar nuevo componente
import ReporteProductividad from './ReporteProductividad';

// Helper component for TabPanel
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Helper function for a11y props
function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const Reportes = () => {
    const [value, setValue] = useState(0); // State for tab selection

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" gutterBottom color="text.primary">Reportes Detallados</Typography> {/* Updated title */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={value} onChange={handleChange} aria-label="report tabs" variant="scrollable" scrollButtons="auto">
                    <Tab label="Resumen General" {...a11yProps(0)} />
                    <Tab label="Ventas por Producto" {...a11yProps(1)} />
                    <Tab label="Rentabilidad" {...a11yProps(2)} />
                    <Tab label="Ventas por Cliente" {...a11yProps(3)} />
                    <Tab label="Cuentas por Cliente" {...a11yProps(4)} />
                    <Tab label="Productividad" {...a11yProps(5)} />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <ResumenVentas />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <ProductSales />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <RentabilidadReporte />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <CustomerBuyers />
            </TabPanel>
            <TabPanel value={value} index={4}>
                <CustomerDebtors />
            </TabPanel>
            <TabPanel value={value} index={5}>
                <ReporteProductividad />
            </TabPanel>
        </Box>
    );
};

export default Reportes;