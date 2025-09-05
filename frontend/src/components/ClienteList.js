import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'react-toastify';
import ConfirmationDialog from './ConfirmationDialog';
import ClienteFinancialHistoryDialog from './ClienteFinancialHistoryDialog'; // New import
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    IconButton, Typography, useMediaQuery, useTheme, Card, CardContent, CardActions, Box
} from '@mui/material';
import { Edit, Delete, History } from '@mui/icons-material'; // Added History import back

const ClienteCard = ({ cliente, onEditCliente, handleDelete, handleViewHistory }) => (
    <Card sx={{ mb: 2 }}>
        <CardContent>
            <Typography variant="h6" color="text.primary">{cliente.nombre}</Typography>
            <Typography color="textSecondary">ID: {cliente.id}</Typography>
            <Typography color="text.primary">Cédula: {cliente.cedula || 'N/A'}</Typography>
            <Typography color="text.primary">Teléfono: {cliente.telefono || 'N/A'}</Typography>
            <Typography color="text.primary">Dirección: {cliente.direccion || 'N/A'}</Typography>
            <Typography color="text.primary">Cupo de Crédito: {formatCurrency(cliente.cupo_credito)}</Typography>
        </CardContent>
        <CardActions>
            <IconButton onClick={() => onEditCliente(cliente)} color="primary">
                <Edit />
            </IconButton>
            <IconButton onClick={() => handleDelete(cliente.id)} color="error">
                <Delete />
            </IconButton>
            <IconButton onClick={() => handleViewHistory(cliente)} color="info"> {/* Added History button */}
                <History />
            </IconButton>
        </CardActions>
    </Card>
);


const ClienteList = ({ onEditCliente, onClienteDeleted }) => {
    const [clientes, setClientes] = useState([]);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [clienteToDelete, setClienteToDelete] = useState(null);

    const [showHistoryDialog, setShowHistoryDialog] = useState(false); // New state
    const [selectedClienteForHistory, setSelectedClienteForHistory] = useState(null); // New state

    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = () => {
        apiClient.get('/clientes/')
            .then(response => {
                setClientes(response.data);
            })
            .catch(error => console.error('Error fetching clientes:', error));
    };

    const handleDelete = (id) => {
        setClienteToDelete(id);
        setShowConfirmDialog(true);
    };

    const confirmDelete = () => {
        apiClient.delete(`/clientes/${clienteToDelete}`)
            .then(() => {
                toast.success('Cliente eliminado!');
                fetchClientes(); // Refresh the list
                if (onClienteDeleted) {
                    onClienteDeleted();
                }
            })
            .catch(error => {
                console.error('Error deleting cliente:', error);
                toast.error('Error al eliminar el cliente.');
            })
            .finally(() => {
                setShowConfirmDialog(false);
                setClienteToDelete(null);
            });
    };

    const handleViewHistory = (cliente) => { // New function
        setSelectedClienteForHistory(cliente);
        setShowHistoryDialog(true);
    };

    const handleCloseHistoryDialog = () => { // New function
        setShowHistoryDialog(false);
        setSelectedClienteForHistory(null);
    };

    return (
        <Paper sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom component="div" sx={{ p: 2 }}>
                Lista de Clientes
            </Typography>
            {isMobile ? (
                <Box sx={{ p: 2 }}>
                    {clientes.map(cliente => (
                        <ClienteCard
                            key={cliente.id}
                            cliente={cliente}
                            onEditCliente={onEditCliente}
                            handleDelete={handleDelete}
                            handleViewHistory={handleViewHistory} // Pass new prop
                        />
                    ))}
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Cédula</TableCell>
                                <TableCell>Teléfono</TableCell>
                                <TableCell>Dirección</TableCell>
                                <TableCell>Cupo Crédito</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {clientes.map(cliente => (
                                <TableRow key={cliente.id}>
                                    <TableCell>{cliente.id}</TableCell>
                                    <TableCell>{cliente.nombre}</TableCell>
                                    <TableCell>{cliente.cedula || 'N/A'}</TableCell>
                                    <TableCell>{cliente.telefono || 'N/A'}</TableCell>
                                    <TableCell>{cliente.direccion || 'N/A'}</TableCell>
                                    <TableCell>{formatCurrency(cliente.cupo_credito)}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => onEditCliente(cliente)} color="primary">
                                            <Edit />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(cliente.id)} color="error">
                                            <Delete />
                                        </IconButton>
                                        <IconButton onClick={() => handleViewHistory(cliente)} color="info"> {/* Added History button */}
                                            <History />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ConfirmationDialog
                open={showConfirmDialog}
                handleClose={() => setShowConfirmDialog(false)}
                handleConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer."
            />

            {selectedClienteForHistory && ( // Render dialog conditionally
                <ClienteFinancialHistoryDialog
                    open={showHistoryDialog}
                    handleClose={handleCloseHistoryDialog}
                    clienteId={selectedClienteForHistory.id}
                    clienteNombre={selectedClienteForHistory.nombre}
                />
            )}
        </Paper>
    );
};

export default ClienteList;