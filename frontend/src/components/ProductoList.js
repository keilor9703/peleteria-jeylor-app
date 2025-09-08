import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'react-toastify';
import ConfirmationDialog from './ConfirmationDialog';
import {
    Table, TableBody, TableCell, TableContainer,TablePagination, TableHead, TableRow, Paper, Button, IconButton, Typography, useMediaQuery, useTheme, Card, CardContent, CardActions, Box, TextField
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
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
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

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedProductos = React.useMemo(() => {
        return filteredProductos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredProductos, page, rowsPerPage]);

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
                    {paginatedProductos.map(producto => (
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
                            {paginatedProductos.map(producto => (
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
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredProductos.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
            />
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