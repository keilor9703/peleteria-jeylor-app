import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatCurrency } from '../utils/formatters';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import {
    Box, Paper, Typography, Grid, TextField, Button, Card, CardContent, CircularProgress
} from '@mui/material';
import {
    AttachMoney, Today, AccountBalanceWallet, CheckCircleOutline
} from '@mui/icons-material';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
        <Box sx={{ mr: 2, color: color }}>
            {icon}
        </Box>
        <Box>
            <Typography color="text.secondary" gutterBottom>{title}</Typography>
            <Typography variant="h5" component="div">{value}</Typography>
        </Box>
    </Card>
);

const ResumenVentas = () => {
    const [ventasSummary, setVentasSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchVentasSummary();
    }, []);

    const fetchVentasSummary = async () => {
        setLoading(true);
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        try {
            const res = await apiClient.get('/reportes/ventas_summary', { params });
            setVentasSummary(res.data);
        } catch (error) {
            console.error('Error fetching sales summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        // Re-fetch data with cleared filters
        fetchVentasSummary();
    };

    const chartData = ventasSummary ? {
        labels: ['Total Pagado', 'Total Pendiente'],
        datasets: [
            {
                data: [ventasSummary.total_pagado, ventasSummary.total_pendiente],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)', // Green for Paid
                    'rgba(255, 99, 132, 0.6)',  // Red for Pending
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                ],
                borderWidth: 1,
            },
        ],
    } : {};

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += formatCurrency(context.parsed);
                        }
                        return label;
                    }
                }
            }
        }
    };

    return (
        <Box>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Filtrar por Fecha</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                        <TextField
                            label="Fecha Inicio"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                        <TextField
                            label="Fecha Fin"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button variant="contained" onClick={fetchVentasSummary} fullWidth>Filtrar</Button>
                        <Button variant="outlined" onClick={handleClearFilters} fullWidth sx={{ mt: 1 }}>Limpiar</Button>
                    </Grid>
                </Grid>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
            ) : ventasSummary ? (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Métricas Clave</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <StatCard title="Total General" value={formatCurrency(ventasSummary.total_general)} icon={<AttachMoney fontSize="large" />} color="#fbc02d" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <StatCard title="Ventas de Hoy" value={formatCurrency(ventasSummary.total_ventas_hoy)} icon={<Today fontSize="large" />} color="#66bb6a" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <StatCard title="Total Pagado" value={formatCurrency(ventasSummary.total_pagado)} icon={<CheckCircleOutline fontSize="large" />} color="#42a5f5" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <StatCard title="Total Pendiente" value={formatCurrency(ventasSummary.total_pendiente)} icon={<AccountBalanceWallet fontSize="large" />} color="#ef5350" />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Distribución de Pagos</Typography>
                            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Doughnut data={chartData} options={chartOptions} />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            ) : (
                <Typography color="text.primary">No se pudo cargar el resumen.</Typography>
            )}
        </Box>
    );
};

export default ResumenVentas;
