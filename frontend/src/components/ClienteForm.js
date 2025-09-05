import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { toast } from 'react-toastify';
import { Button, TextField, Box, Typography, Grid, InputAdornment } from '@mui/material';

const ClienteForm = ({ onClienteAdded, clienteToEdit, onClienteUpdated }) => {
    const [nombre, setNombre] = useState('');
    const [cedula, setCedula] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [cupoCredito, setCupoCredito] = useState('');

    useEffect(() => {
        if (clienteToEdit) {
            setNombre(clienteToEdit.nombre);
            setCedula(clienteToEdit.cedula || '');
            setTelefono(clienteToEdit.telefono || '');
            setDireccion(clienteToEdit.direccion || '');
            setCupoCredito(clienteToEdit.cupo_credito || '');
        } else {
            setNombre('');
            setCedula('');
            setTelefono('');
            setDireccion('');
            setCupoCredito('');
        }
    }, [clienteToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const clienteData = {
            nombre,
            cedula,
            telefono,
            direccion,
            cupo_credito: parseFloat(cupoCredito) || 0
        };

        const request = clienteToEdit
            ? apiClient.put(`/clientes/${clienteToEdit.id}`, clienteData)
            : apiClient.post('/clientes/', clienteData);

        request.then(response => {
            toast.success(`Cliente ${clienteToEdit ? 'actualizado' : 'agregado'}!`);
            if (clienteToEdit) {
                onClienteUpdated(response.data);
            } else {
                setNombre('');
                setCedula('');
                setTelefono('');
                setDireccion('');
                setCupoCredito('');
                onClienteAdded(response.data);
            }
        }).catch(error => {
            console.error(`Error ${clienteToEdit ? 'updating' : 'creating'} cliente:`, error);
            toast.error(`Error al ${clienteToEdit ? 'actualizar' : 'agregar'} el cliente.`);
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom color="text.primary">
                {clienteToEdit ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Nombre"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        fullWidth
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Cédula"
                        value={cedula}
                        onChange={e => setCedula(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Teléfono"
                        value={telefono}
                        onChange={e => setTelefono(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Dirección"
                        value={direccion}
                        onChange={e => setDireccion(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Cupo de Crédito"
                        value={cupoCredito}
                        onChange={e => setCupoCredito(e.target.value.replace(/[^0-9.]/g, ''))}
                        fullWidth
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button type="submit" variant="contained">
                        {clienteToEdit ? 'Actualizar Cliente' : 'Agregar Cliente'}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ClienteForm;
