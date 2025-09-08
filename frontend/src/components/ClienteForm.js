import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { toast } from 'react-toastify';
import { Button, TextField, Box, Typography, Grid, InputAdornment,Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Edit, Delete, ExpandMore } from '@mui/icons-material';
import BulkUpload from './BulkUpload'; // ✅ importamos el cargue masivo


const ClienteForm = ({ onClienteAdded, clienteToEdit, onClienteUpdated }) => {
    const [nombre, setNombre] = useState('');
    const [cedula, setCedula] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [cupoCredito, setCupoCredito] = useState('');
     const [clientes, setClientes] = useState([]);
    

     useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = () => {
        apiClient.get('/clientes/')
            .then(response => setClientes(response.data))
            .catch(error => console.error('Error fetching clientes:', error));
    };

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
    
    const accordionStyles = {
    mt: 3,
    borderRadius: 2,
    boxShadow: 2,
    '&:before': { display: 'none' } // 🔹 quita la línea fea por defecto
    };


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

            <Accordion sx={accordionStyles}>
            <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #ddd',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                minHeight: 48,
                '& .MuiAccordionSummary-content': { margin: 0 }
                }}
            >
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                Carga Masiva de Clientes
                </Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ backgroundColor: '#fff', borderRadius: 2 }}>
                <BulkUpload uploadType="clientes" onUploadSuccess={fetchClientes} />
            </AccordionDetails>
            </Accordion>

        </Box>
    );
};

export default ClienteForm;
