document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('registroForm')) {
        document.getElementById('registroForm').addEventListener('submit', registrarUsuario);
    }
    
    if (document.getElementById('verificarForm')) {
        document.getElementById('verificarForm').addEventListener('submit', verificarCodigo);
    }
    
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', loginUsuario);
    }
    
    if (document.getElementById('solicitarRecuperacionForm')) {
        document.getElementById('solicitarRecuperacionForm').addEventListener('submit', solicitarRecuperacion);
    }
    
    if (document.getElementById('cambiarContrasenaForm')) {
        document.getElementById('cambiarContrasenaForm').addEventListener('submit', cambiarContrasena);
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
            if (typeof manejarSeleccionFotos === 'function') {
                manejarSeleccionFotos(e);
            }
        });

        inputFotos.addEventListener('input', function(e) {
            if (typeof manejarSeleccionFotos === 'function') {
                manejarSeleccionFotos(e);
            }
        });
    }
    
    if (document.getElementById('btn-obtener-ubicacion')) {
        document.getElementById('btn-obtener-ubicacion').addEventListener('click', function() {
            obtenerUbicacionManual();
        });
    }
    
    actualizarUIporSesion();
    
    if (document.getElementById('mapa')) {
        setTimeout(function() {
            inicializarMapa();
            cargarIncidentesPreview();
        }, 500);
    }
});