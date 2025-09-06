import React, { useState, useMemo } from 'react';
import apiClient from '../api';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'react-toastify';
import {
    Box, Paper, Typography, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse, Card, CardContent, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { KeyboardArrowDown, KeyboardArrowUp, AttachMoney, TrendingUp, People } from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// New component: ProductividadCard
const ProductividadCard = ({ row, formatCurrency, handleOpenDetails, isMobile }) => {
    const [open, setOpen] = useState(false); // Mover useState aquí
    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" color="text.primary">{row.operador_username}</Typography>
                <Typography color="textSecondary">Total Ganado: {formatCurrency(row.total_ganado)}</Typography>
                {isMobile && (
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                )}
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 1 }}>
                        <Typography variant="h6" gutterBottom component="div">Desglose</Typography>
                        {row.desglose.map((item, index) => (
                            <ProductividadDetailCard key={index} item={item} formatCurrency={formatCurrency} />
                        ))}
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
};

// New component: ProductividadDetailCard
const ProductividadDetailCard = ({ item, formatCurrency }) => (
    <Card variant="outlined" sx={{ mb: 1, p: 1 }}>
        <Typography variant="body2" color="text.primary">Orden ID: {item.orden_id}</Typography>
        <Typography variant="body2" color="text.primary">Servicio: {item.servicio_nombre}</Typography>
        <Typography variant="body2" color="text.primary">Valor Ganado: {formatCurrency(item.valor_ganado)}</Typography>
    </Card>
);

const ReporteProductividad = () => {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleGenerateReport = () => {
        setLoading(true);
        apiClient.get('/reportes/productividad', { params: { start_date: startDate, end_date: endDate } })
            .then(res => {
                setReportData(res.data);
                if (res.data.reporte.length === 0) {
                    toast.info("No se encontraron datos de productividad para el rango de fechas seleccionado.");
                }
            })
            .catch(err => toast.error(err.response?.data?.detail || "Error al generar el reporte."))
            .finally(() => setLoading(false));
    };

    const chartData = useMemo(() => {
        if (!reportData || reportData.reporte.length === 0) {
            return { labels: [], datasets: [] };
        }
        const labels = reportData.reporte.map(row => row.operador_username);
        const data = reportData.reporte.map(row => row.total_ganado);

        return {
            labels,
            datasets: [
                {
                    label: 'Productividad Total Ganada',
                    data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [reportData]);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Productividad por Operador',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += formatCurrency(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Valor Ganado',
                },
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value);
                    }
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Operador',
                },
            },
        },
    };

    const Row = ({ row }) => {
        const [open, setOpen] = useState(false);
        return (
            <>
                <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                    <TableCell>
                        <IconButton size="small" onClick={() => setOpen(!open)}>
                            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                    </TableCell>
                    <TableCell component="th" scope="row">{row.operador_username}</TableCell>
                    <TableCell align="right">{formatCurrency(row.total_ganado)}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1 }}>
                                <Typography variant="h6" gutterBottom component="div">Desglose</Typography>
                                {isMobile ? ( // Conditional rendering for nested table
                                    <Box>
                                        {row.desglose.map((item, index) => (
                                            <ProductividadDetailCard key={index} item={item} formatCurrency={formatCurrency} />
                                        ))}
                                    </Box>
                                ) : (
                                    <TableContainer sx={{
                                        backgroundColor: theme.palette.background.paper, // Asegurar el color de fondo del TableContainer
                                        '&::-webkit-scrollbar': {
                                            height: '8px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: theme.palette.grey[700], // Color del scrollbar en modo oscuro
                                            borderRadius: '4px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            backgroundColor: theme.palette.background.default, // Color del track del scrollbar
                                        },
                                    }}>
                                        <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Orden ID</TableCell>
                                                <TableCell>Servicio</TableCell>
                                                <TableCell align="right">Valor Ganado</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {row.desglose.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.orden_id}</TableCell>
                                                    <TableCell>{item.servicio_nombre}</TableCell>
                                                    <TableCell align="right">{formatCurrency(item.valor_ganado)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    </TableContainer> // <-- AÑADIDO
                                )}
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </>
        );
    };

    const totalProductivity = useMemo(() => {
        if (!reportData || reportData.reporte.length === 0) return 0;
        return reportData.reporte.reduce((sum, row) => sum + row.total_ganado, 0);
    }, [reportData]);

    const totalOperators = useMemo(() => {
        if (!reportData || reportData.reporte.length === 0) return 0;
        return reportData.reporte.length;
    }, [reportData]);

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" mb={3} color="text.primary">Reporte de Productividad</Typography>

            <Grid container spacing={2} alignItems="center" mb={3}>
                <Grid item><TextField type="date" label="Fecha de Inicio" value={startDate} onChange={e => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item><TextField type="date" label="Fecha de Fin" value={endDate} onChange={e => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item><Button variant="contained" onClick={handleGenerateReport} disabled={loading}>{loading ? 'Generando...' : 'Generar Reporte'}</Button></Grid>
            </Grid>

            {reportData && reportData.reporte.length > 0 && (
                <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} md={4}>
                        <Card elevation={3}>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <AttachMoney color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6" color="text.secondary">Productividad Total</Typography>
                                </Box>
                                <Typography variant="h4" color="text.primary">{formatCurrency(totalProductivity)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={3}>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <People color="secondary" sx={{ mr: 1 }} />
                                    <Typography variant="h6" color="text.secondary">Operadores Evaluados</Typography>
                                </Box>
                                <Typography variant="h4" color="text.primary">{totalOperators}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={3}>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <TrendingUp color="success" sx={{ mr: 1 }} />
                                    <Typography variant="h6" color="text.secondary">Productividad Promedio</Typography>
                                </Box>
                                <Typography variant="h4" color="text.primary">{formatCurrency(totalProductivity / totalOperators)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {reportData && reportData.reporte.length > 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Bar data={chartData} options={chartOptions} />
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Typography variant="h6" mb={2} color="text.primary">Detalle por Operador</Typography>
                            {isMobile ? (
                                <Box>
                                    {reportData.reporte.map(row => (
                                        <ProductividadCard
                                            key={row.operador_id}
                                            row={row}
                                            formatCurrency={formatCurrency}
                                            isMobile={isMobile}
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <TableContainer sx={{
                                    backgroundColor: theme.palette.background.paper, // Asegurar el color de fondo del TableContainer
                                    '&::-webkit-scrollbar': {
                                        height: '8px',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        backgroundColor: theme.palette.grey[700], // Color del scrollbar en modo oscuro
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        backgroundColor: theme.palette.background.default, // Color del track del scrollbar
                                    },
                                }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell />
                                                <TableCell>Operador</TableCell>
                                                <TableCell align="right">Total Ganado</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reportData.reporte.map(row => <Row key={row.operador_id} row={row} />)}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {reportData && reportData.reporte.length === 0 && (
                <Typography variant="body1" color="text.secondary">No hay datos de productividad para el rango de fechas seleccionado.</Typography>
            )}
        </Paper>
    );
};

export default ReporteProductividad;