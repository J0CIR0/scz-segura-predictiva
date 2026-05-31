document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    if (document.getElementById('reporteForm')) {
        document.getElementById('reporteForm').addEventListener('submit', reportarIncidente);
    }
    
    if (document.getElementById('btn-tomar-foto')) {
        const inputFotos = document.getElementById('btn-tomar-foto');
        inputFotos.addEventListener('click', function() {
            this.value = '';
            this.dataset.lastSelectionKey = '';
        });
        inputFotos.addEventListener('change', function(e) {
            manejarSeleccionFotos(e);
        });
    }
    
    if (document.getElementById('btn-obtener-ubicacion')) {
        document.getElementById('btn-obtener-ubicacion').addEventListener('click', function() {
            obtenerUbicacionManual();
        });
    }
    
    if (document.getElementById('actualizarPerfilForm')) {
        document.getElementById('actualizarPerfilForm').addEventListener('submit', actualizarPerfilUsuario);
    }
    
    mostrarPagina('reportar');
});