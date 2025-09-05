
import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'react-toastify';
import ConfirmationDialog from './ConfirmationDialog';
import RechazoDialog from './RechazoDialog';
import OrdenTrabajoDetailDialog from './OrdenTrabajoDetailDialog';
import { useLocation } from 'react-router-dom';
import {
    Box, Paper, Typography, Grid, TextField, Button, IconButton, Autocomplete,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Tabs, Tab, Tooltip, List, ListItem, ListItemText
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline, Edit, Delete, Visibility, Send, CheckCircle, Cancel } from '@mui/icons-material';
import CloseOrderPaymentDialog from './CloseOrderPaymentDialog';

// Helper component for TabPanel
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}


const OrdenesTrabajo = ({ user }) => {
    const [ordenes, setOrdenes] = useState([]);
    const [ordenesParaAprobar, setOrdenesParaAprobar] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]); // Todos los productos y servicios
    const [operators, setOperators] = useState([]); // New state for operators
    
    const [cliente, setCliente] = useState(null);
    const [selectedOperatorForForm, setSelectedOperatorForForm] = useState(null); // New state for operator in form
    const [addedProductos, setAddedProductos] = useState([]);
    const [addedServicios, setAddedServicios] = useState([]);
    const [evidenceFile, setEvidenceFile] = useState(null);
    
    const [editingOrden, setEditingOrden] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [ordenAction, setOrdenAction] = useState({ action: null, id: null, message: '' });
    const [showRechazoDialog, setShowRechazoDialog] = useState(false);
    const [ordenToProcess, setOrdenToProcess] = useState(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [selectedOrden, setSelectedOrden] = useState(null);
    const [showCloseOrderPaymentDialog, setShowCloseOrderPaymentDialog] = useState(false); // New state
    const [ordenToClose, setOrdenToClose] = useState(null); // New state

    const [tabValue, setTabValue] = useState(0);
    const location = useLocation();

    const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')); // Default to current day
    const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'));     // Default to current day
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedOperator, setSelectedOperator] = useState(null); // New state for selected operator
    const [accumulatedTotal, setAccumulatedTotal] = useState(0);

    useEffect(() => {
        fetchClientes();
        fetchProductos();
        if (user?.role?.name === 'Admin') { // Only fetch operators if user is Admin
            fetchOperators();
        }
    }, []); // Fetch clients and products only once

    const fetchOrdenes = (filters = {}) => {
        const params = {
            skip: 0,
            limit: 100,
            estado: filters.estado || null,
            start_date: filters.startDate || null,
            end_date: filters.endDate || null,
            cliente_id: filters.clienteId || null,
            operador_id: filters.operadorId || null, // Pass selected operator ID
        };
        apiClient.get('/ordenes-trabajo/', { params })
            .then(res => setOrdenes(res.data))
            .catch(err => toast.error("Error al cargar órdenes de trabajo."));
    };

    const fetchAccumulatedTotal = (filters = {}) => {
        const params = {
            estado: filters.estado || null,
            start_date: filters.startDate || null,
            end_date: filters.endDate || null,
            cliente_id: filters.clienteId || null,
        };
        apiClient.get('/ordenes-trabajo/total', { params })
            .then(res => setAccumulatedTotal(res.data))
            .catch(err => toast.error("Error al cargar el total acumulado."));
    };

    const fetchOrdenesParaAprobar = () => apiClient.get('/ordenes-trabajo/?estado=En revisión').then(res => setOrdenesParaAprobar(res.data)).catch(err => toast.error("Error al cargar órdenes para aprobar."));
    const fetchClientes = () => apiClient.get('/clientes/').then(res => setClientes(res.data)).catch(err => toast.error("Error al cargar clientes."));
    const fetchProductos = () => apiClient.get('/productos/').then(res => setProductos(res.data)).catch(err => toast.error("Error al cargar productos."));
    const fetchOperators = () => apiClient.get('/users/').then(res => setOperators(res.data)).catch(err => toast.error("Error al cargar operadores.")); // Added this line

    useEffect(() => {
        const filters = {
            startDate,
            endDate,
            clienteId: selectedClient?.id,
            operadorId: selectedOperator?.id, // Pass selected operator ID
        };
        fetchOrdenes(filters);
        fetchAccumulatedTotal(filters);
        if (user?.role?.name === 'Admin') {
            fetchOrdenesParaAprobar();
        }
    }, [user, startDate, endDate, selectedClient, selectedOperator]); // Add selectedOperator to dependency array

    useEffect(() => {
        if (editingOrden) {
            const clienteSeleccionado = clientes.find(c => c.id === editingOrden.cliente.id);
            setCliente(clienteSeleccionado);
            setSelectedOperatorForForm(operators.find(op => op.id === editingOrden.operador.id)); // Initialize operator for form
            setAddedProductos(editingOrden.productos.map(p => ({
                id: Date.now() + Math.random(), // Unique ID for React list
                producto: p.producto,
                cantidad: p.cantidad,
                precioUnitario: p.precio_unitario,
            })));
            setAddedServicios(editingOrden.servicios.map(s => ({
                id: Date.now() + Math.random(), // Unique ID for React list
                servicio: s.servicio,
                cantidad: s.cantidad, // Now services have quantity
                precioUnitario: s.precio_servicio, // Now services have unit price
            })));
            setTabValue(0); // Switch to form tab
        } else {
            resetForm();
        }
    }, [editingOrden, clientes, productos, operators]); // Add operators to dependency array

    // Effect to handle navigation from notifications
    useEffect(() => {
        if (location.state?.ordenId) {
            const ordenId = location.state.ordenId;
            apiClient.get(`/ordenes-trabajo/${ordenId}`)
                .then(res => {
                    setSelectedOrden(res.data);
                    setShowDetailDialog(true);
                    // Clear the state so it doesn't re-trigger on subsequent renders
                    window.history.replaceState({}, document.title, location.pathname);
                })
                .catch(err => toast.error(err.response?.data?.detail || "Error al cargar la orden de trabajo."));
        }
    }, [location.state?.ordenId]);

    const resetForm = () => {
        setCliente(null);
        setSelectedOperatorForForm(null); // Clear selected operator for form
        setAddedProductos([]);
        setAddedServicios([]);
        setEditingOrden(null);
        setEvidenceFile(null);
    };

    const handleAddProducto = () => setAddedProductos([...addedProductos, { id: Date.now(), producto: null, cantidad: 1, precioUnitario: 0 }]);
    const handleRemoveProducto = (id) => setAddedProductos(addedProductos.filter(p => p.id !== id));
    const handleProductoChange = (id, field, value) => {
        setAddedProductos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleAddServicio = () => setAddedServicios([...addedServicios, { id: Date.now(), servicio: null, cantidad: 1, precioUnitario: 0 }]);
    const handleRemoveServicio = (id) => setAddedServicios(addedServicios.filter(s => s.id !== id));
    const handleServicioChange = (id, field, value) => {
        setAddedServicios(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const calculateTotal = () => {
        const totalProductos = addedProductos.reduce((total, p) => total + (p.cantidad * p.precioUnitario), 0);
        const totalServicios = addedServicios.reduce((total, s) => total + (s.cantidad * s.precioUnitario), 0);
        return totalProductos + totalServicios;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!cliente || (addedProductos.length === 0 && addedServicios.length === 0)) {
            toast.error('Debe seleccionar un cliente y añadir al menos un producto o servicio.');
            return;
        }

        const ordenData = {
            cliente_id: cliente.id,
            total: calculateTotal(),
            productos: addedProductos.map(p => ({ producto_id: p.producto.id, cantidad: p.cantidad, precio_unitario: p.precioUnitario })),
            servicios: addedServicios.map(s => ({ servicio_id: s.servicio.id, cantidad: s.cantidad, precio_servicio: s.precioUnitario })),
            ...(user?.role?.name === 'Admin' && selectedOperatorForForm && { operador_id: selectedOperatorForForm.id }),
        };

        const request = editingOrden
            ? apiClient.put(`/ordenes-trabajo/${editingOrden.id}`, ordenData)
            : apiClient.post('/ordenes-trabajo/', ordenData);

        request.then((response) => {
            const newOrdenId = response.data.id;
            toast.success(`Orden ${editingOrden ? 'actualizada' : 'registrada'} con éxito.`);
            
            // Si hay un archivo de evidencia, subirlo ahora
            if (evidenceFile && newOrdenId) {
                const formData = new FormData();
                formData.append("file", evidenceFile);

                return apiClient.post(`/ordenes-trabajo/${newOrdenId}/evidencia`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }
            return Promise.resolve(); // Continuar la cadena de promesas
        })
        .then(() => {
            // Este .then se ejecuta después de que la orden se guarda y el archivo (si lo hay) se sube.
            const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
            
            // Establecer los estados de los filtros para que la UI se actualice correctamente
            setStartDate(today);
            setEndDate(today);
            setSelectedClient(null);
            setSelectedOperator(null);

            // Obtener explícitamente con los filtros correctos para asegurar que la nueva orden esté incluida
            const filters = {
                startDate: today,
                endDate: today,
                clienteId: null,
                operadorId: null,
            };
            fetchOrdenes(filters);
            fetchAccumulatedTotal(filters);
            
            resetForm();
            setTabValue(1); // Cambiar a la pestaña de la lista
        })
        .catch(err => {
            // Error en la creación de la orden o en la subida del archivo
            const errorMessage = err.response?.data?.detail || `Error al procesar la orden.`;
            toast.error(errorMessage);
        });
    };
    
    const handleEnviarRevision = (id) => {
        setOrdenAction({ action: 'enviar', id, message: '¿Estás seguro de que quieres enviar esta orden a revisión? Una vez enviada, no podrás editarla.' });
        setShowConfirmDialog(true);
    };

    const handleApprove = (id) => {
        setOrdenAction({ action: 'aprobar', id, message: '¿Estás seguro de que quieres APROBAR esta orden de trabajo? Esta acción registrará la venta y no se puede deshacer.' });
        setShowConfirmDialog(true);
    };

    const handleOpenRejectDialog = (orden) => {
        setOrdenToProcess(orden);
        setShowRechazoDialog(true);
    };

    const handleConfirmCloseOrderWithPayment = (paymentData) => {
        const { ordenId, wasPaid, paymentType, paidAmount } = paymentData;
        const data = {
            was_paid: wasPaid,
            payment_type: paymentType,
            paid_amount: paidAmount,
        };

        apiClient.put(`/ordenes-trabajo/${ordenId}/cerrar`, data)
            .then(() => {
                toast.success('Orden CERRADA con éxito.');
                fetchOrdenes();
                if (user?.role?.name === 'Admin') fetchOrdenesParaAprobar();
            })
            .catch(err => toast.error(err.response?.data?.detail || 'Error al cerrar la orden.'))
            .finally(() => {
                setShowCloseOrderPaymentDialog(false);
                setOrdenToClose(null);
            });
    };

    const confirmAction = () => {
        if (ordenAction.action === 'enviar') {
            apiClient.put(`/ordenes-trabajo/${ordenAction.id}/enviar-revision`)
                .then(() => {
                    toast.success('Orden enviada a revisión.');
                    fetchOrdenes();
                    if (user?.role?.name === 'Admin') fetchOrdenesParaAprobar();
                })
                .catch(err => toast.error(err.response?.data?.detail || 'Error al enviar a revisión.'))
                .finally(() => setShowConfirmDialog(false));
        } else if (ordenAction.action === 'aprobar') {
            apiClient.post(`/ordenes-trabajo/${ordenAction.id}/aprobar`)
                .then(() => {
                    toast.success('Orden APROBADA con éxito.');
                    fetchOrdenes();
                    fetchOrdenesParaAprobar();
                })
                .catch(err => toast.error(err.response?.data?.detail || 'Error al aprobar la orden.'))
                .finally(() => setShowConfirmDialog(false));
        }
        // The 'cerrar' action is now handled by handleConfirmCloseOrderWithPayment
    };

    const handleConfirmReject = (observaciones) => {
        if (!ordenToProcess) return;
        apiClient.post(`/ordenes-trabajo/${ordenToProcess.id}/rechazar?observaciones=${encodeURIComponent(observaciones)}`)
            .then(() => {
                toast.warn('Orden de trabajo rechazada.');
                fetchOrdenes();
                fetchOrdenesParaAprobar();
            })
            .catch(err => toast.error(err.response?.data?.detail || 'Error al rechazar la orden.'))
            .finally(() => {
                setShowRechazoDialog(false);
                setOrdenToProcess(null);
            });
    };

    const handleOpenDetails = (orden) => {
        setSelectedOrden(orden);
        setShowDetailDialog(true);
    };

    const handleCloseOrder = (orden) => {
        if (user?.role?.name === 'Admin') {
            setOrdenToClose(orden);
            setShowCloseOrderPaymentDialog(true);
        } else {
            setOrdenAction({ action: 'cerrar', id: orden.id, message: '¿Estás seguro de que quieres CERRAR esta orden de trabajo?' });
            setShowConfirmDialog(true);
        }
    };

    const handleCloseDetails = () => {
        setSelectedOrden(null);
        setShowDetailDialog(false);
    };

    const getEstadoChip = (estado) => {
        const chipProps = {
            'Borrador': { label: 'Borrador', color: 'default' },
            'En revisión': { label: 'En Revisión', color: 'warning' },
            'Aprobada': { label: 'Aprobada', color: 'success' },
            'Rechazada': { label: 'Rechazada', color: 'error' },
            'Cerrada': { label: 'Cerrada', color: 'info' },
        };
        const props = chipProps[estado] || { label: 'Desconocido', color: 'default' };
        return <Chip label={props.label} color={props.color} size="small" />;
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="Registrar Orden" />
                    <Tab label="Mis Órdenes" />
                    {user?.role?.name === 'Admin' && <Tab label={`Aprobaciones (${ordenesParaAprobar.length})`} />}
                </Tabs>
            </Box>

            {/* Tab para el Formulario */}
            <TabPanel value={tabValue} index={0}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" mb={2}>{editingOrden ? 'Editar' : 'Registrar'} Orden de Trabajo</Typography>
                    <Box component="form" onSubmit={handleSubmit}>
                        <Autocomplete
                            options={clientes}
                            getOptionLabel={(option) => option.nombre}
                            value={cliente}
                            onChange={(e, newValue) => setCliente(newValue)}
                            renderInput={(params) => <TextField {...params} label="Cliente" required fullWidth />}
                            sx={{ mb: 3 }}
                        />

                        {user?.role?.name === 'Admin' && (
                            <Autocomplete
                                options={operators}
                                getOptionLabel={(option) => option.username}
                                value={selectedOperatorForForm}
                                onChange={(e, newValue) => setSelectedOperatorForForm(newValue)}
                                renderInput={(params) => <TextField {...params} label="Operador" fullWidth />}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                sx={{ mb: 3 }}
                            />
                        )}

                        {/* Productos */}
                        <Typography variant="subtitle1" gutterBottom>Productos a Utilizar</Typography>
                        {addedProductos.map(p => (
                            <Grid container spacing={2} key={p.id} alignItems="center" sx={{ mb: 1 }}>
                                <Grid item xs={6}>
                                    <Autocomplete
                                        options={productos.filter(prod => !prod.es_servicio)}
                                        getOptionLabel={(option) => option.nombre}
                                        value={p.producto}
                                        onChange={(e, newValue) => {
                                            handleProductoChange(p.id, 'producto', newValue);
                                            handleProductoChange(p.id, 'precioUnitario', newValue ? newValue.precio : 0);
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Producto" />}
                                        sx={{ minWidth: 250 }}
                                    />
                                </Grid>
                                <Grid item xs={1}><TextField type="number" label="Cantidad" value={p.cantidad} onChange={e => handleProductoChange(p.id, 'cantidad', parseFloat(e.target.value))} /></Grid>
                                <Grid item xs={2}><TextField type="number" label="Precio Unit." value={p.precioUnitario} onChange={e => handleProductoChange(p.id, 'precioUnitario', parseFloat(e.target.value))} /></Grid>
                                <Grid item xs={2}><Typography>{formatCurrency(p.cantidad * p.precioUnitario)}</Typography></Grid>
                                <Grid item xs={1}><Tooltip title="Eliminar producto"><IconButton onClick={() => handleRemoveProducto(p.id)} color="error"><RemoveCircleOutline /></IconButton></Tooltip></Grid>
                            </Grid>
                        ))}
                        <Tooltip title="Añadir un nuevo producto a la orden"><Button startIcon={<AddCircleOutline />} onClick={handleAddProducto}>Añadir Producto</Button></Tooltip>

                        {/* Servicios */}
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>Servicios a Realizar</Typography>
                        {addedServicios.map(s => (
                             <Grid container spacing={2} key={s.id} alignItems="center" sx={{ mb: 1 }}>
                                <Grid item xs={6}>
                                     <Autocomplete
                                        options={productos.filter(prod => prod.es_servicio)}
                                        getOptionLabel={(option) => option.nombre}
                                        value={s.servicio}
                                        onChange={(e, newValue) => {
                                            handleServicioChange(s.id, 'servicio', newValue);
                                            handleServicioChange(s.id, 'precioUnitario', newValue ? newValue.precio : 0);
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Servicio" />}
                                        sx={{ minWidth: 250 }}
                                    />
                                </Grid>
                                <Grid item xs={1}><TextField type="number" label="Cantidad" value={s.cantidad} onChange={e => handleServicioChange(s.id, 'cantidad', parseFloat(e.target.value))} /></Grid>
                                <Grid item xs={2}><TextField type="number" label="Precio Unit." value={s.precioUnitario} onChange={e => handleServicioChange(s.id, 'precioUnitario', parseFloat(e.target.value))} /></Grid>
                                <Grid item xs={2}><Typography>{formatCurrency(s.cantidad * s.precioUnitario)}</Typography></Grid>
                                <Grid item xs={1}><Tooltip title="Eliminar servicio"><IconButton onClick={() => handleRemoveServicio(s.id)} color="error"><RemoveCircleOutline /></IconButton></Tooltip></Grid>
                            </Grid>
                        ))}
                        <Tooltip title="Añadir un nuevo servicio a la orden"><Button startIcon={<AddCircleOutline />} onClick={handleAddServicio}>Añadir Servicio</Button></Tooltip>

                        {/* Evidence Upload */}
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>Adjuntar Evidencia</Typography>
                            <Tooltip title="Adjuntar archivo de evidencia">
                            <Button variant="contained" component="label">
                                Seleccionar Archivo
                                <input type="file" hidden onChange={(e) => setEvidenceFile(e.target.files[0])} />
                            </Button>
                        </Tooltip>
                            {evidenceFile && <Typography sx={{ display: 'inline', ml: 2 }}>{evidenceFile.name}</Typography>}
                        </Box>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ mr: 3 }}>Total: {formatCurrency(calculateTotal())}</Typography>
                            <Tooltip title={editingOrden ? 'Actualizar orden de trabajo' : 'Guardar orden como borrador'}><Button type="submit" variant="contained">{editingOrden ? 'Actualizar' : 'Guardar Borrador'}</Button></Tooltip>
                            {editingOrden && <Tooltip title="Cancelar edición"><Button onClick={resetForm} sx={{ ml: 1 }}>Cancelar</Button></Tooltip>}
                        </Box>
                    </Box>
                </Paper>
            </TabPanel>

            {/* Tab para el Historial */}
            <TabPanel value={tabValue} index={1}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" mb={2}>Mis Órdenes de Trabajo</Typography>
                    {/* Filter Section */}
                    <Grid container spacing={2} alignItems="center" mb={3}>
                        <Grid item xs={12} sm={3}> {/* Adjusted width for date fields */}
                            <TextField
                                type="date"
                                label="Fecha Inicio"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}> {/* Adjusted width for date fields */}
                            <TextField
                                type="date"
                                label="Fecha Fin"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}> {/* Increased width for Autocomplete on small/medium screens */}
                            <Autocomplete
                                options={clientes}
                                getOptionLabel={(option) => option.nombre}
                                value={selectedClient}
                                onChange={(event, newValue) => setSelectedClient(newValue)}
                                renderInput={(params) => <TextField {...params} label="Filtrar por Cliente" fullWidth />}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                sx={{ minWidth: 250 }} // Ensure a minimum width
                            />
                        </Grid>
                        {user?.role?.name === 'Admin' && ( // Conditionally render for Admin
                            <Grid item xs={12} sm={6}>
                                <Autocomplete
                                    options={operators}
                                    getOptionLabel={(option) => option.username}
                                    value={selectedOperator}
                                    onChange={(event, newValue) => setSelectedOperator(newValue)}
                                    renderInput={(params) => <TextField {...params} label="Filtrar por Operador" fullWidth />}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    sx={{ minWidth: 250 }}
                                />
                            </Grid>
                        )}
                    </Grid>
                    {/* Accumulated Total */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Typography variant="h6">Total Acumulado: {formatCurrency(accumulatedTotal)}</Typography>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Operador</TableCell>
                                    <TableCell>Productos</TableCell>
                                    <TableCell>Servicios</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ordenes.map(orden => (
                                    <TableRow key={orden.id}>
                                        <TableCell>{orden.id}</TableCell>
                                        <TableCell>{orden.cliente?.nombre}</TableCell>
                                        <TableCell>{orden.operador?.username}</TableCell>
                                        <TableCell>
                                            <List dense disablePadding>
                                                {orden.productos && orden.productos.length > 0 ? orden.productos.map(item => (
                                                    <ListItem key={item.id} sx={{ pl: 0 }}>
                                                        <ListItemText
                                                            primary={`${item.producto.nombre} (x${item.cantidad})`}
                                                        />
                                                    </ListItem>
                                                )) : <ListItemText primary="N/A" />}
                                            </List>
                                        </TableCell>
                                        <TableCell>
                                            <List dense disablePadding>
                                                {orden.servicios && orden.servicios.length > 0 ? orden.servicios.map(item => (
                                                    <ListItem key={item.id} sx={{ pl: 0 }}>
                                                        <ListItemText
                                                            primary={`${item.servicio.nombre} (x${item.cantidad})`}
                                                        />
                                                    </ListItem>
                                                )) : <ListItemText primary="N/A" />}
                                            </List>
                                        </TableCell>
                                        <TableCell>{formatCurrency(orden.total)}</TableCell>
                                        <TableCell>{getEstadoChip(orden.estado)}</TableCell>
                                        <TableCell>{new Date(orden.fecha_creacion + 'Z').toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Ver detalles de la orden"><IconButton color="info" onClick={() => handleOpenDetails(orden)}><Visibility /></IconButton></Tooltip>
                                            {(orden.estado === 'Borrador' || orden.estado === 'Rechazada' || orden.estado === 'En revisión') && (
                                                <>
                                                    <Tooltip title="Editar orden"><IconButton color="primary" onClick={() => { setEditingOrden(orden); }}><Edit /></IconButton></Tooltip>
                                                    {orden.estado !== 'En revisión' && <Tooltip title="Enviar a revisión"><IconButton color="secondary" onClick={() => handleEnviarRevision(orden.id)}><Send /></IconButton></Tooltip>}
                                                </>
                                            )}
                                            {user?.role?.name === 'Admin' && (orden.estado === 'Aprobada' || orden.estado === 'Rechazada') && (
                                                <Tooltip title="Cerrar orden"><IconButton color="primary" onClick={() => handleCloseOrder(orden)}><CheckCircle /></IconButton></Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" mb={2}>Órdenes Pendientes de Aprobación</Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Operador</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ordenesParaAprobar.map(orden => (
                                    <TableRow key={orden.id}>
                                        <TableCell>{orden.id}</TableCell>
                                        <TableCell>{orden.cliente?.nombre}</TableCell>
                                        <TableCell>{orden.operador?.username}</TableCell>
                                        <TableCell>{formatCurrency(orden.total)}</TableCell>
                                        <TableCell>{new Date(orden.fecha_creacion + 'Z').toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Ver detalles de la orden"><IconButton color="info" onClick={() => handleOpenDetails(orden)}><Visibility /></IconButton></Tooltip>
                                            <Tooltip title="Aprobar orden"><IconButton color="success" onClick={() => handleApprove(orden.id)}><CheckCircle /></IconButton></Tooltip>
                                            <Tooltip title="Rechazar orden"><IconButton color="error" onClick={() => handleOpenRejectDialog(orden)}><Cancel /></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </TabPanel>

            <ConfirmationDialog
                open={showConfirmDialog}
                handleClose={() => setShowConfirmDialog(false)}
                handleConfirm={confirmAction}
                title="Confirmar Acción"
                message={ordenAction.message}
            />

            <RechazoDialog 
                open={showRechazoDialog}
                handleClose={() => setShowRechazoDialog(false)}
                handleConfirm={handleConfirmReject}
            />

            <OrdenTrabajoDetailDialog
                open={showDetailDialog}
                handleClose={handleCloseDetails}
                orden={selectedOrden}
            />

            <CloseOrderPaymentDialog
                open={showCloseOrderPaymentDialog}
                handleClose={() => setShowCloseOrderPaymentDialog(false)}
                orden={ordenToClose}
                onConfirmClose={handleConfirmCloseOrderWithPayment}
            />
        </Box>
    );
};

export default OrdenesTrabajo;
