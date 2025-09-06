
import React, { useState } from 'react';
import { Button, Input, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { uploadFile } from '../api'; // Assuming you have an uploadFile function in your api.js

const BulkUpload = ({ uploadType, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [validationError, setValidationError] = useState(null);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        setError(null);
        setSuccess(null);
        setValidationError(null);

        if (!selectedFile) {
            return;
        }

        const fileName = selectedFile.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        // 1. Validate file type
        if (!['xls', 'xlsx', 'csv'].includes(fileExtension)) {
            setValidationError('Tipo de archivo no soportado. Por favor, suba un archivo .xls, .xlsx o .csv.');
            return;
        }

        // 2. Validate content (headers) for CSV
        if (fileExtension === 'csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const headers = content.split('\n')[0].split(',').map(h => h.trim());

                let requiredHeaders = [];
                if (uploadType === 'clientes') {
                    requiredHeaders = ['nombre', 'cedula', 'telefono', 'direccion', 'cupo_credito'];
                } else if (uploadType === 'productos') {
                    requiredHeaders = ['nombre', 'precio', 'costo', 'es_servicio', 'unidad_medida'];
                }

                const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
                if (missingHeaders.length > 0) {
                    setValidationError(`Faltan columnas requeridas en el archivo: ${missingHeaders.join(', ')}`);
                    return;
                }
            };

            reader.onerror = () => {
                setValidationError('Error al leer el archivo.');
            };

            reader.readAsText(selectedFile);
        }
        // For Excel files, we rely on backend validation for content and data types
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Por favor, seleccione un archivo.');
            return;
        }
        if (validationError) { // Prevent upload if there's a validation error
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await uploadFile(uploadType, file);
            setSuccess(response.message);
            if (onUploadSuccess) {
                onUploadSuccess();
            }
        } catch (err) {
            setError(err.message || `Error al subir el archivo de ${uploadType}.`);
        } finally {
            setLoading(false);
        }
    };


    const handleDownloadTemplate = () => {
        let templateFileName = '';
        if (uploadType === 'clientes') {
            templateFileName = 'clientes_template.csv';
        } else if (uploadType === 'productos') {
            templateFileName = 'productos_template.csv';
        }

        if (templateFileName) {
            window.location.href = `/${templateFileName}`;
        }
    };

    return (
        <Box sx={{ mt: 4, p: 2, border: '1px dashed grey', borderRadius: '4px' }}>
            <Typography variant="h6" gutterBottom color="text.primary">
                Carga Masiva de {uploadType === 'clientes' ? 'Clientes' : 'Productos'}
            </Typography>
            <Input
                type="file"
                onChange={handleFileChange}
                sx={{ mb: 2 }}
                inputProps={{ accept: ".xlsx, .xls, .csv" }}
            />
            <Button
                variant="contained"
                onClick={handleUpload}
                disabled={loading || !file || validationError}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                sx={{ mr: 2 }}
            >
                {loading ? 'Subiendo...' : 'Subir Archivo'}
            </Button>
            <Button
                variant="outlined"
                onClick={handleDownloadTemplate}
                disabled={loading || validationError}
            >
                Descargar Plantilla
            </Button>
            {validationError && <Alert severity="error" sx={{ mt: 2 }}>{validationError}</Alert>}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        </Box>
    );
};

export default BulkUpload;
