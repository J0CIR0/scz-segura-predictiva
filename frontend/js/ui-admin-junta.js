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
    
    if (paginaId === 'estadisticas') {
        cargarEstadisticasAdmin();
    }
    
    if (paginaId === 'validar') {
        cargarIncidentesPorValidar();
    }
    
    if (paginaId === 'incidentes-validados') {
        cargarIncidentesValidados();
    }
    
    if (paginaId === 'alertas-comunitarias') {
        cargarHistorialAlertas();
    }
    
    if (paginaId === 'perfil') {
        cargarPerfilAdmin();
    }
}

async function cargarEstadisticasAdmin() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/admin/estadisticas-barrio', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const statsDiv = document.getElementById('admin-stats');
        if (statsDiv && data.totales) {
            statsDiv.innerHTML = `
                <div class="admin-stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:30px;">
                    <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;border:1px solid #004d00;">
                        <h3>Total Incidentes</h3>
                        <p style="font-size:36px;color:#004d00;">${data.totales.total_incidentes}</p>
                    </div>
                    <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;border:1px solid #ff8c00;">
                        <h3>Pendientes</h3>
                        <p style="font-size:36px;color:#ff8c00;">${data.totales.pendientes}</p>
                    </div>
                    <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;border:1px solid #28a745;">
                        <h3>Validados</h3>
                        <p style="font-size:36px;color:#28a745;">${data.totales.validados}</p>
                    </div>
                    <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;border:1px solid #dc3545;">
                        <h3>Rechazados</h3>
                        <p style="font-size:36px;color:#dc3545;">${data.totales.rechazados}</p>
                    </div>
                    <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;border:1px solid #004d00;">
                        <h3>En Proceso</h3>
                        <p style="font-size:36px;color:#004d00;">${data.totales.en_proceso}</p>
                    </div>
                    <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;border:1px solid #28a745;">
                        <h3>Resueltos</h3>
                        <p style="font-size:36px;color:#28a745;">${data.totales.resueltos}</p>
                    </div>
                </div>
            `;
        }
        
        const tiposDiv = document.getElementById('admin-tipos-lista');
        if (tiposDiv && data.por_tipo) {
            tiposDiv.innerHTML = '<div class="incidentes-lista">';
            data.por_tipo.forEach(function(tipo) {
                tiposDiv.innerHTML += `
                    <div class="incidente-card">
                        <div class="incidente-titulo">${tipo.tipo_delito}</div>
                        <div class="incidente-descripcion">Cantidad: ${tipo.cantidad}</div>
                    </div>
                `;
            });
            tiposDiv.innerHTML += '</div>';
        }
        
    } catch (error) {
        console.error('Error cargando estadisticas:', error);
        showMessage('Error al cargar estadisticas', 'error');
    }
}

async function cargarIncidentesPorValidar() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/admin/incidentes-por-validar', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const lista = document.getElementById('admin-incidentes-pendientes');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (data.incidentes.length === 0) {
            lista.innerHTML = '<p>No hay incidentes pendientes de validacion</p>';
            return;
        }
        
        data.incidentes.forEach(function(inc) {
            const imagenesHtml = renderizarMiniaturasImagenes(inc.imagenes, 3);
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.innerHTML = imagenesHtml + `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion}</div>
                <div class="incidente-fecha">Direccion: ${inc.direccion}</div>
                <div class="incidente-fecha">Reportado por: ${inc.vecino_nombre} ${inc.vecino_apellido}</div>
                <div class="incidente-fecha">Telefono: ${inc.vecino_telefono}</div>
                <div class="incidente-fecha">${new Date(inc.creado_en).toLocaleString()}</div>
                <div style="margin-top:15px;display:flex;gap:10px;">
                    <button onclick="event.stopPropagation();mostrarModalValidar(${inc.id}, true)" style="background-color:#28a745;width:auto;">Validar</button>
                    <button onclick="event.stopPropagation();mostrarModalValidar(${inc.id}, false)" style="background-color:#dc3545;width:auto;">Rechazar</button>
                </div>
            `;
            lista.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando incidentes:', error);
    }
}

async function cargarIncidentesValidados() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/admin/incidentes-validados', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const lista = document.getElementById('admin-incidentes-validados-lista');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (data.incidentes.length === 0) {
            lista.innerHTML = '<p>No hay incidentes validados</p>';
            return;
        }
        
        data.incidentes.forEach(function(inc) {
            const imagenesHtml = renderizarMiniaturasImagenes(inc.imagenes, 3);
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = function() { mostrarDetalleIncidente(inc); };
            card.innerHTML = imagenesHtml + `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion}</div>
                <div class="incidente-fecha">Estado: ${inc.estado}</div>
                <div class="incidente-fecha">${new Date(inc.creado_en).toLocaleString()}</div>
            `;
            lista.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando incidentes validados:', error);
    }
}

function mostrarModalValidar(incidenteId, esValido) {
    const modal = document.getElementById('modal-validar');
    const contenido = document.getElementById('modal-validar-contenido');
    
    contenido.innerHTML = `
        <h3>${esValido ? 'Validar Incidente' : 'Rechazar Incidente'}</h3>
        <div class="form-group">
            <label>Comentario:</label>
            <textarea id="comentario_validacion" rows="3" placeholder="${esValido ? 'Opcional: Agregar comentario' : 'Obligatorio: Motivo del rechazo'}"></textarea>
        </div>
        <div style="display:flex;gap:10px;margin-top:15px;">
            <button onclick="confirmarValidacion(${incidenteId}, ${esValido})" style="background-color:#004d00;">Confirmar</button>
            <button onclick="cerrarModalValidar()" style="background-color:#6c757d;">Cancelar</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function confirmarValidacion(incidenteId, esValido) {
    const token = localStorage.getItem('token');
    const comentario = document.getElementById('comentario_validacion')?.value || '';
    
    if (!esValido && !comentario) {
        showMessage('Debe ingresar un motivo de rechazo', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/validar-incidente/${incidenteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ es_valido: esValido, comentario: comentario })
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cerrarModalValidar();
            cargarIncidentesPorValidar();
            cargarEstadisticasAdmin();
            cargarHeatMap();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al validar incidente', 'error');
    }
}

function cerrarModalValidar() {
    document.getElementById('modal-validar').style.display = 'none';
}

async function generarReportePDF() {
    const token = localStorage.getItem('token');
    const fechaInicio = document.getElementById('reporte_fecha_inicio')?.value || '';
    const fechaFin = document.getElementById('reporte_fecha_fin')?.value || '';
    const barrio = document.getElementById('reporte_barrio')?.value || '';
    const tipo = document.getElementById('reporte_tipo')?.value || 'incidentes';
    
    try {
        const response = await fetch(`/api/admin/generar-reporte?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&barrio=${barrio}&tipo=${tipo}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${tipo}_${new Date().toISOString().slice(0,19)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showMessage('Reporte generado exitosamente', 'success');
    } catch (error) {
        showMessage('Error al generar reporte', 'error');
    }
}

async function enviarAlertaComunitaria() {
    const token = localStorage.getItem('token');
    const mensaje = document.getElementById('alerta_mensaje')?.value;
    const barrio = document.getElementById('alerta_barrio')?.value;
    const nivel = document.getElementById('alerta_nivel')?.value;
    
    if (!mensaje) {
        showMessage('Ingrese un mensaje de alerta', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/enviar-alerta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ mensaje, barrio, nivel })
        });
        const result = await response.json();
        if (response.ok) {
            showMessage('Alerta enviada a la comunidad', 'success');
            document.getElementById('alerta_mensaje').value = '';
            cargarHistorialAlertas();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al enviar alerta', 'error');
    }
}

async function cargarHistorialAlertas() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/admin/alertas-enviadas', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const lista = document.getElementById('alertas-historial');
        if (lista) {
            lista.innerHTML = '';
            if (data.alertas.length === 0) {
                lista.innerHTML = '<p>No hay alertas enviadas</p>';
            } else {
                data.alertas.forEach(function(alerta) {
                    const card = document.createElement('div');
                    card.className = 'incidente-card';
                    card.innerHTML = `
                        <div class="incidente-titulo">${alerta.nivel}</div>
                        <div class="incidente-descripcion">${alerta.mensaje}</div>
                        <div class="incidente-fecha">Barrio: ${alerta.barrio || 'Todos'}</div>
                        <div class="incidente-fecha">${new Date(alerta.creado_en).toLocaleString()}</div>
                    `;
                    lista.appendChild(card);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

async function cargarPerfilAdmin() {
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
                    <p><strong>Ubicación Vivienda:</strong> ${usuario.ubicacion_vivienda || 'No registrada'}</p>
                    <p><strong>Rol:</strong> ${usuario.rol}</p>
                </div>
            `;
        }
        
        const perfilTelefono = document.getElementById('perfil_telefono');
        const perfilTelefonoEmergencia = document.getElementById('perfil_telefono_emergencia');
        const perfilUbicacion = document.getElementById('perfil_ubicacion_vivienda');
        if (perfilTelefono) perfilTelefono.value = usuario.telefono || '';
        if (perfilTelefonoEmergencia) perfilTelefonoEmergencia.value = usuario.telefono_emergencia || '';
        if (perfilUbicacion) perfilUbicacion.value = usuario.ubicacion_vivienda || '';
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

async function actualizarPerfilAdmin(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    const data = {};
    const telefono = document.getElementById('perfil_telefono')?.value;
    const telefonoEmergencia = document.getElementById('perfil_telefono_emergencia')?.value;
    const ubicacion = document.getElementById('perfil_ubicacion_vivienda')?.value;
    const nuevaPassword = document.getElementById('perfil_nueva_password')?.value;
    
    if (telefono) data.telefono = telefono;
    if (telefonoEmergencia) data.telefono_emergencia = telefonoEmergencia;
    if (ubicacion) data.ubicacion_vivienda = ubicacion;
    if (nuevaPassword) data.nueva_password = nuevaPassword;
    
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
            cargarPerfilAdmin();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al actualizar perfil', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('user-name').textContent = userName;
    }
    
    if (document.getElementById('actualizarPerfilForm')) {
        document.getElementById('actualizarPerfilForm').addEventListener('submit', actualizarPerfilAdmin);
    }
    
    if (document.getElementById('mapa')) {
        setTimeout(function() {
            inicializarMapa();
            cargarIncidentesPreview();
        }, 500);
    }
    
    mostrarPagina('estadisticas');
    connectWebSocket();
});