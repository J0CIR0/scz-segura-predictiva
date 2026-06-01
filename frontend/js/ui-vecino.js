function showMessage(text, type) {
    const msgDiv = document.getElementById('message');
    if (!msgDiv) return;
    msgDiv.textContent = text;
    msgDiv.className = 'message ' + type;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 5000);
}

function mostrarPagina(paginaId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`pagina-${paginaId}`).classList.add('active');
    
    if (paginaId === 'mapa') {
        setTimeout(() => {
            if (mapaLeaflet) {
                mapaLeaflet.invalidateSize();
                cargarHeatMap();
            } else {
                inicializarMapa();
            }
            cargarIncidentesPreview();
        }, 100);
    }
    
    if (paginaId === 'incidentes') {
        cargarTodosIncidentes();
    }
    
    if (paginaId === 'mis-reportes') {
        cargarMisIncidentes();
    }

    if (paginaId === 'reportar') {
        const btnReportar = document.getElementById('btn-reportar');
        if (btnReportar) btnReportar.disabled = true;
        fotosSeleccionadas = [];
        const previewDiv = document.getElementById('preview_imagenes');
        if (previewDiv) previewDiv.innerHTML = '';
        setTimeout(() => {
            if (typeof obtenerUbicacionManual === 'function') {
                obtenerUbicacionManual();
            }
        }, 100);
    }
    
    if (paginaId === 'perfil') {
        cargarPerfil();
    }
    
    if (paginaId === 'alertas') {
        cargarAlertas();
    }
}

async function cargarMisIncidentes() {
    const token = localStorage.getItem('token');
    if (!token) {
        mostrarPagina('reportar');
        return;
    }
    
    try {
        const response = await fetch('/api/mis-incidentes', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const incidentes = await response.json();
        
        const lista = document.getElementById('mis-incidentes-lista');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (incidentes.length === 0) {
            lista.innerHTML = '<p>No has reportado incidentes</p>';
            return;
        }
        
        incidentes.forEach(function(inc) {
            const imagenesHtml = renderizarMiniaturasImagenes(inc.imagenes, 3);
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = function() { mostrarDetalleIncidente(inc); };
            card.innerHTML = imagenesHtml + `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion}</div>
                <div class="incidente-fecha">${new Date(inc.creado_en).toLocaleString()}</div>
                <div class="incidente-fecha">Estado: ${inc.estado}</div>
            `;
            lista.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando mis incidentes:', error);
    }
}

async function cargarPerfil() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/perfil', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        const usuario = data.usuario;
        
        const perfilInfo = document.getElementById('perfil-info');
        if (perfilInfo) {
            perfilInfo.innerHTML = `
                <div class="perfil-card" style="background:#f5f5f5;padding:20px;border-radius:10px;margin-bottom:20px;">
                    <p><strong>Nombre:</strong> ${usuario.nombre} ${usuario.apellido}</p>
                    <p><strong>CI:</strong> ${usuario.ci}</p>
                    <p><strong>Email:</strong> ${usuario.email}</p>
                    <p><strong>Teléfono:</strong> ${usuario.telefono || 'No registrado'}</p>
                    <p><strong>Teléfono Emergencia:</strong> ${usuario.telefono_emergencia || 'No registrado'}</p>
                    <p><strong>Rol:</strong> ${usuario.rol}</p>
                </div>
            `;
        }
        
        const perfilTelefono = document.getElementById('perfil_telefono');
        const perfilTelefonoEmergencia = document.getElementById('perfil_telefono_emergencia');
        if (perfilTelefono) perfilTelefono.value = usuario.telefono || '';
        if (perfilTelefonoEmergencia) perfilTelefonoEmergencia.value = usuario.telefono_emergencia || '';
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

async function actualizarPerfilUsuario(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('No has iniciado sesion', 'error');
        return;
    }

    const data = {};
    const telefono = document.getElementById('perfil_telefono');
    const telefonoEmergencia = document.getElementById('perfil_telefono_emergencia');

    if (telefono && telefono.value) data.telefono = telefono.value;
    if (telefonoEmergencia && telefonoEmergencia.value) data.telefono_emergencia = telefonoEmergencia.value;

    try {
        const response = await fetch('/api/perfil', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cargarPerfil();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al actualizar perfil', 'error');
    }
}

async function cargarAlertas() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/vecino/alertas', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const alertas = await response.json();
        
        const lista = document.getElementById('alertas-lista');
        if (lista) {
            lista.innerHTML = '';
            if (alertas.length === 0) {
                lista.innerHTML = '<p>No tienes alertas pendientes</p>';
            } else {
                alertas.forEach(function(alerta) {
                    const card = document.createElement('div');
                    card.className = 'incidente-card';
                    card.innerHTML = `
                        <div class="incidente-titulo">${alerta.nivel}</div>
                        <div class="incidente-descripcion">${alerta.mensaje}</div>
                        <div class="incidente-fecha">Barrio: ${alerta.barrio}</div>
                        <div class="incidente-fecha">${new Date(alerta.creado_en).toLocaleString()}</div>
                    `;
                    lista.appendChild(card);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando alertas:', error);
    }
}

async function guardarPreferenciasAlertas() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const barriosSelect = document.getElementById('alertas_barrio');
    const barrios = Array.from(barriosSelect.selectedOptions).map(opt => opt.value);
    const horariosSelect = document.getElementById('alertas_horario');
    const horarios = Array.from(horariosSelect.selectedOptions).map(opt => opt.value);
    const delitosSelect = document.getElementById('alertas_delito');
    const delitos = Array.from(delitosSelect.selectedOptions).map(opt => opt.value);
    
    try {
        const response = await fetch('/api/vecino/preferencias-alertas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ barrios, horarios, delitos })
        });
        const result = await response.json();
        if (response.ok) {
            showMessage('Preferencias guardadas', 'success');
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al guardar preferencias', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('user-name').textContent = userName;
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
    
    if (document.getElementById('mapa')) {
        setTimeout(function() {
            inicializarMapa();
            cargarIncidentesPreview();
        }, 500);
    }
    
    mostrarPagina('reportar');
    connectWebSocket();
});