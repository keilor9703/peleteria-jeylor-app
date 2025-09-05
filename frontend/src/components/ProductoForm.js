import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { toast } from 'react-toastify';
import { Button, TextField, Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, InputAdornment } from '@mui/material';

const ProductoForm = ({ onProductoAdded, productoToEdit, onProductoUpdated }) => {
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [costo, setCosto] = useState(''); // <-- Estado para costo
    const [esServicio, setEsServicio] = useState(false);
    const [unidadMedida, setUnidadMedida] = useState('UND');

    useEffect(() => {
        if (productoToEdit) {
            setNombre(productoToEdit.nombre);
            setPrecio(productoToEdit.precio);
            setCosto(productoToEdit.costo || ''); // <-- Asignar costo
            setEsServicio(productoToEdit.es_servicio);
            setUnidadMedida(productoToEdit.unidad_medida || 'UND');
        } else {
            setNombre('');
            setPrecio('');
            setCosto(''); // <-- Limpiar costo
            setEsServicio(false);
            setUnidadMedida('UND');
        }
    }, [productoToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const productoData = {
            nombre,
            precio: parseFloat(precio),
            costo: parseFloat(costo) || 0.0, // <-- Incluir costo
            es_servicio: esServicio,
            unidad_medida: unidadMedida
        };

        const request = productoToEdit
            ? apiClient.put(`/productos/${productoToEdit.id}`, productoData)
            : apiClient.post('/productos/', productoData);

        request.then(response => {
            toast.success(`Producto ${productoToEdit ? 'actualizado' : 'agregado'}!`);
            if (productoToEdit) {
                onProductoUpdated(response.data);
            } else {
                setNombre('');
                setPrecio('');
                setCosto(''); // <-- Limpiar costo
                setEsServicio(false);
                setUnidadMedida('UND');
                onProductoAdded(response.data);
            }
        }).catch(error => {
            console.error(`Error ${productoToEdit ? 'updating' : 'creating'} producto:`, error);
            toast.error(`Error al ${productoToEdit ? 'actualizar' : 'agregar'} el producto.`);
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom color="text.primary">
                {productoToEdit ? 'Editar Producto/Servicio' : 'Agregar Nuevo Producto/Servicio'}
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Nombre"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        fullWidth
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Precio de Venta"
                        value={precio}
                        onChange={e => setPrecio(e.target.value.replace(/[^0-9.]/g, ''))}
                        fullWidth
                        required
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Costo"
                        value={costo}
                        onChange={e => setCosto(e.target.value.replace(/[^0-9.]/g, ''))}
                        fullWidth
                        required
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Unidad de Medida</InputLabel>
                        <Select
                            value={unidadMedida}
                            label="Unidad de Medida"
                            onChange={e => setUnidadMedida(e.target.value)}
                        >
                            <MenuItem value="UND">Unidad (UND)</MenuItem>
                            <MenuItem value="MTS">Metros (Mts)</MenuItem>
                            <MenuItem value="KGS">Kilos (Kgs)</MenuItem>
                            <MenuItem value="PAR">Pares</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControlLabel
                        control={<Checkbox checked={esServicio} onChange={e => setEsServicio(e.target.checked)} />}
                        label={<Typography color="text.primary">Es un Servicio</Typography>}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button type="submit" variant="contained">
                        {productoToEdit ? 'Actualizar Producto' : 'Agregar Producto'}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProductoForm;
