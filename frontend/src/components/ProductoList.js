import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'react-toastify';
import ConfirmationDialog from './ConfirmationDialog';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Typography, useMediaQuery, useTheme, Card, CardContent, CardActions, Box, TextField
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const ProductoCard = ({ producto, onEditProducto, handleDelete }) => (
    <Card sx={{ mb: 2 }}>
        <CardContent>
            <Typography variant="h6" color="text.primary">{producto.nombre}</Typography>
            <Typography color="textSecondary">ID: {producto.id}</Typography>
            <Typography color="text.primary">Unidad de Medida: {producto.unidad_medida}</Typography>
            <Typography color="text.primary">Precio: {formatCurrency(producto.precio)}</Typography>
            <Typography color="text.primary">Tipo: {producto.es_servicio ? 'Servicio' : 'Producto'}</Typography>
        </CardContent>
        <CardActions>
            <IconButton onClick={() => onEditProducto(producto)} color="primary">
                <Edit />
            </IconButton>
            <IconButton onClick={() => handleDelete(producto.id)} color="error">
                <Delete />
            </IconButton>
        </CardActions>
    </Card>
);

const ProductoList = ({ onEditProducto, onProductoDeleted }) => {
    const [productos, setProductos] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [productoToDelete, setProductoToDelete] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        fetchProductos();
    }, []);

    const fetchProductos = () => {
        apiClient.get('/productos/')
            .then(response => {
                setProductos(response.data);
            })
            .catch(error => console.error('Error fetching productos:', error));
    };

    const handleDelete = (id) => {
        setProductoToDelete(id);
        setShowConfirmDialog(true);
    };

    const confirmDelete = () => {
        apiClient.delete(`/productos/${productoToDelete}`)
            .then(() => {
                toast.success('Producto/Servicio eliminado!');
                fetchProductos(); // Refresh the list
                if (onProductoDeleted) {
                    onProductoDeleted();
                }
            })
            .catch(error => {
                console.error('Error deleting producto:', error);
                toast.error('Error al eliminar el producto/servicio.');
            })
            .finally(() => {
                setShowConfirmDialog(false);
                setProductoToDelete(null);
            });
    };

    const filteredProductos = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Paper sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom component="div" sx={{ p: 2 }}>
                Lista de Productos
            </Typography>
            <TextField
                label="Buscar Producto"
                variant="outlined"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2, mx: 2, width: 'auto' }} // Add margin and auto width for better spacing
            />
            {isMobile ? (
                <Box sx={{ p: 2 }}>
                    {filteredProductos.map(producto => (
                        <ProductoCard 
                            key={producto.id}
                            producto={producto}
                            onEditProducto={onEditProducto}
                            handleDelete={handleDelete}
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
                                <TableCell>Unidad de Medida</TableCell>
                                <TableCell>Precio</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProductos.map(producto => (
                                <TableRow key={producto.id}>
                                    <TableCell>{producto.id}</TableCell>
                                    <TableCell>{producto.nombre}</TableCell>
                                    <TableCell>{producto.unidad_medida}</TableCell>
                                    <TableCell>{formatCurrency(producto.precio)}</TableCell>
                                    <TableCell>{producto.es_servicio ? 'Servicio' : 'Producto'}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => onEditProducto(producto)} color="primary">
                                            <Edit />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(producto.id)} color="error">
                                            <Delete />
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
                message="¿Estás seguro de que quieres eliminar este producto/servicio? Esta acción no se puede deshacer."
            />
        </Paper>
    );
};

export default ProductoList;