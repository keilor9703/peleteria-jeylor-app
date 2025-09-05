import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import apiClient from '../api';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'react-toastify';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, CircularProgress, TextField, Button, Grid
} from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const RentabilidadReporte = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const response = await apiClient.get('/reportes/rentabilidad_productos', { params });
            setReportData(response.data);
        } catch (err) {
            console.error('Error fetching profitability report:', err);
            setError('No se pudo cargar el reporte de rentabilidad.');
            toast.error('Error al cargar el reporte.');
        } finally {
            setLoading(false);
        }
    };

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        fetchReportData();
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom color="text.primary">Reporte de Rentabilidad por Producto</Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Fecha Inicio"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Fecha Fin"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button variant="contained" onClick={fetchReportData} sx={{ mr: 1 }}>Filtrar</Button>
                        <Button variant="outlined" onClick={handleClearFilters}>Limpiar</Button>
                    </Grid>
                </Grid>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : reportData.length === 0 ? (
                <Typography color="text.primary">No hay datos de rentabilidad para el período seleccionado.</Typography>
            ) : (
                <Box>
                    <Box sx={{ maxWidth: '800px', margin: 'auto', mb: 3 }}>
                        <Bar
                            data={{
                                labels: reportData.map(item => item.product_name),
                                datasets: [
                                    {
                                        label: 'Ganancia Neta',
                                        data: reportData.map(item => item.net_profit),
                                        backgroundColor: reportData.map(item => item.net_profit > 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
                                        borderColor: reportData.map(item => item.net_profit > 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'),
                                        borderWidth: 1,
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: 'top' },
                                    title: { display: true, text: 'Ganancia Neta por Producto' },
                                },
                                scales: {
                                    y: { beginAtZero: true },
                                },
                            }}
                        />
                    </Box>
                    <Box sx={{ overflowX: 'auto' }}>
                        <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Producto</TableCell>
                                        <TableCell align="right">Cantidad Vendida</TableCell>
                                        <TableCell align="right">Ingresos Totales</TableCell>
                                        <TableCell align="right">Costo Total</TableCell>
                                        <TableCell align="right">Ganancia Neta</TableCell>
                                        <TableCell align="right">Margen</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.map((item) => (
                                        <TableRow key={item.product_id}>
                                            <TableCell><Typography color="text.primary">{item.product_name}</Typography></TableCell>
                                            <TableCell align="right"><Typography color="text.primary">{item.total_quantity_sold}</Typography></TableCell>
                                            <TableCell align="right"><Typography color="text.primary">{formatCurrency(item.total_revenue)}</Typography></TableCell>
                                            <TableCell align="right"><Typography color="text.primary">{formatCurrency(item.total_cost)}</Typography></TableCell>
                                            <TableCell align="right"><Typography color="text.primary" sx={{ fontWeight: 'bold', color: item.net_profit > 0 ? 'success.main' : 'error.main' }}>{formatCurrency(item.net_profit)}</Typography></TableCell>
                                            <TableCell align="right"><Typography color="text.primary">{item.profit_margin.toFixed(2)}%</Typography></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default RentabilidadReporte;