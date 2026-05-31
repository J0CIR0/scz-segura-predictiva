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
    
    if (paginaId === 'asignados') {
        cargarIncidentesAsignados();
    }
    
    if (paginaId === 'pendientes') {
        cargarIncidentesPendientes();
    }
    
    if (paginaId === 'historial') {
        cargarHistorialResueltos();
    }
    
    if (paginaId === 'patrullajes') {
        cargarPatrullajes();
    }
    
    if (paginaId === 'perfil') {
        cargarPerfilPolicia();
    }
}

async function cargarIncidentesAsignados() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/policia/incidentes-asignados', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const lista = document.getElementById('policia-incidentes-asignados');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (data.incidentes.length === 0) {
            lista.innerHTML = '<p>No tienes incidentes asignados</p>';
            return;
        }
        
        data.incidentes.forEach(function(inc) {
            const imagenesHtml = renderizarMiniaturasImagenes(inc.imagenes, 3);
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = function() { mostrarDetalleIncidentePolicia(inc); };
            card.innerHTML = imagenesHtml + `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion.substring(0, 100)}...</div>
                <div class="incidente-fecha">Dirección: ${inc.direccion}</div>
                <div class="incidente-fecha">Reportado por: ${inc.vecino_nombre}</div>
                <div class="incidente-fecha">Teléfono vecino: ${inc.vecino_telefono}</div>
                <div class="incidente-fecha">Asignado: ${new Date(inc.fecha_asignacion).toLocaleString()}</div>
                <div class="incidente-fecha">Estado: ${inc.estado}</div>
            `;
            lista.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando incidentes asignados:', error);
    }
}

async function cargarIncidentesPendientes() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/policia/incidentes-pendientes', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const lista = document.getElementById('policia-incidentes-pendientes');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (data.incidentes.length === 0) {
            lista.innerHTML = '<p>No hay incidentes pendientes por asignar</p>';
            return;
        }
        
        data.incidentes.forEach(function(inc) {
            const imagenesHtml = renderizarMiniaturasImagenes(inc.imagenes, 3);
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.innerHTML = imagenesHtml + `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion.substring(0, 100)}...</div>
                <div class="incidente-fecha">Dirección: ${inc.direccion}</div>
                <div class="incidente-fecha">Reportado por: ${inc.vecino_nombre}</div>
                <div class="incidente-fecha">Teléfono vecino: ${inc.vecino_telefono}</div>
                <div class="incidente-fecha">${new Date(inc.creado_en).toLocaleString()}</div>
                <button class="btn-ubicacion" onclick="event.stopPropagation();mostrarModalAsignar(${inc.id})" style="background-color:#004d00;width:auto;margin-top:10px;">Asignarme este incidente</button>
            `;
            lista.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando incidentes pendientes:', error);
    }
}

function mostrarModalAsignar(incidenteId) {
    const modal = document.getElementById('modal-asignar');
    const contenido = document.getElementById('modal-asignar-contenido');
    
    contenido.innerHTML = `
        <h3>Asignar Incidente</h3>
        <p>¿Deseas asignarte este incidente?</p>
        <div style="display:flex;gap:10px;margin-top:15px;">
            <button onclick="confirmarAsignacion(${incidenteId})" style="background-color:#004d00;">Confirmar</button>
            <button onclick="cerrarModalAsignar()" style="background-color:#6c757d;">Cancelar</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function confirmarAsignacion(incidenteId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/policia/asignar-incidente/${incidenteId}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cerrarModalAsignar();
            cargarIncidentesPendientes();
            cargarIncidentesAsignados();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al asignar incidente', 'error');
    }
}

function cerrarModalAsignar() {
    document.getElementById('modal-asignar').style.display = 'none';
}

function mostrarDetalleIncidentePolicia(incidente) {
    const modal = document.getElementById('modal-detalle');
    const contenido = document.getElementById('modal-contenido');
    
    const imagenesHtml = renderizarImagenesIncidente(incidente.imagenes);
    
    contenido.innerHTML = `
        <h3>${incidente.tipo_delito.toUpperCase()}</h3>
        <p><strong>Descripción:</strong> ${incidente.descripcion}</p>
        <p><strong>Dirección:</strong> ${incidente.direccion}</p>
        <p><strong>Coordenadas:</strong> ${incidente.latitud}, ${incidente.longitud}</p>
        <p><strong>Reportado por:</strong> ${incidente.vecino_nombre} ${incidente.vecino_apellido || ''}</p>
        <p><strong>Teléfono vecino:</strong> ${incidente.vecino_telefono || 'No disponible'}</p>
        <p><strong>Estado:</strong> ${incidente.estado}</p>
        <p><strong>Fecha:</strong> ${new Date(incidente.creado_en).toLocaleString()}</p>
        ${imagenesHtml}
        <div style="margin-top:15px;display:flex;gap:10px;">
            <button onclick="resolverIncidente(${incidente.id})" style="background-color:#28a745;">Marcar como Resuelto</button>
            <button onclick="rechazarIncidente(${incidente.id})" style="background-color:#dc3545;">Rechazar Incidente</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function renderizarImagenesIncidente(imagenes) {
    const urls = normalizarImagenesIncidente(imagenes);
    if (urls.length === 0) {
        return '';
    }
    let html = '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:15px;">';
    urls.forEach(function(img) {
        html += '<img src="' + img + '" style="width:100%;border-radius:5px;border:1px solid #004d00;">';
    });
    html += '</div>';
    return html;
}

async function resolverIncidente(incidenteId) {
    const token = localStorage.getItem('token');
    const observaciones = prompt('Ingrese observaciones sobre la resolucion:');
    
    try {
        const response = await fetch(`/api/policia/resolver-incidente/${incidenteId}?observaciones=${encodeURIComponent(observaciones || '')}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cerrarModal();
            cargarIncidentesAsignados();
            cargarHistorialResueltos();
            cargarHeatMap();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al resolver incidente', 'error');
    }
}

async function rechazarIncidente(incidenteId) {
    const token = localStorage.getItem('token');
    const motivo = prompt('Ingrese el motivo del rechazo:');
    
    if (!motivo) {
        showMessage('Debe ingresar un motivo', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/policia/rechazar-incidente/${incidenteId}?motivo=${encodeURIComponent(motivo)}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cerrarModal();
            cargarIncidentesAsignados();
            cargarHeatMap();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al rechazar incidente', 'error');
    }
}

function cerrarModal() {
    document.getElementById('modal-detalle').style.display = 'none';
}

async function cargarHistorialResueltos() {
    const token = localStorage.getItem('token');
    const fechaDesde = document.getElementById('historial_fecha_desde')?.value || '';
    const fechaHasta = document.getElementById('historial_fecha_hasta')?.value || '';
    const tipo = document.getElementById('historial_tipo')?.value || '';
    
    let url = '/api/policia/incidentes-resueltos';
    const params = [];
    if (fechaDesde) params.push(`fecha_desde=${fechaDesde}`);
    if (fechaHasta) params.push(`fecha_hasta=${fechaHasta}`);
    if (tipo) params.push(`tipo=${tipo}`);
    if (params.length) url += '?' + params.join('&');
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const lista = document.getElementById('policia-incidentes-resueltos');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (data.incidentes.length === 0) {
            lista.innerHTML = '<p>No hay incidentes resueltos</p>';
            return;
        }
        
        data.incidentes.forEach(function(inc) {
            const imagenesHtml = renderizarMiniaturasImagenes(inc.imagenes, 3);
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.innerHTML = imagenesHtml + `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion.substring(0, 100)}...</div>
                <div class="incidente-fecha">Dirección: ${inc.direccion}</div>
                <div class="incidente-fecha">Resuelto: ${new Date(inc.fecha_resolucion).toLocaleString()}</div>
                <div class="incidente-fecha">Observaciones: ${inc.observaciones || 'Sin observaciones'}</div>
            `;
            lista.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

async function generarRecomendacionPatrullaje() {
    const token = localStorage.getItem('token');
    const fecha = document.getElementById('patrullaje_fecha')?.value;
    const horaInicio = document.getElementById('patrullaje_hora_inicio')?.value;
    const horaFin = document.getElementById('patrullaje_hora_fin')?.value;
    
    if (!fecha || !horaInicio || !horaFin) {
        showMessage('Complete fecha y horario', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/policia/recomendar-patrullaje?fecha=${fecha}&hora_inicio=${horaInicio}&hora_fin=${horaFin}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const recomendacionDiv = document.getElementById('recomendacion-ia');
        if (recomendacionDiv) {
            recomendacionDiv.innerHTML = `
                <div class="recomendacion-card" style="background:#f5f5f5;padding:20px;border-radius:10px;border:1px solid #004d00;">
                    <h3>Recomendación de IA Predictiva</h3>
                    <p><strong>Zona con mayor probabilidad de incidentes:</strong> ${data.zona_recomendada}</p>
                    <p><strong>Probabilidad estimada:</strong> ${data.probabilidad}%</p>
                    <p><strong>Factores de riesgo:</strong> ${data.factores}</p>
                    <button onclick="seleccionarZonaPatrullaje('${data.zona_recomendada}')" style="background-color:#004d00;width:auto;">Usar esta recomendación</button>
                </div>
            `;
        }
        
        const zonaSelect = document.getElementById('patrullaje_zona');
        if (zonaSelect && data.zona_recomendada) {
            for(let i = 0; i < zonaSelect.options.length; i++) {
                if(zonaSelect.options[i].value === data.zona_recomendada) {
                    zonaSelect.selectedIndex = i;
                    break;
                }
            }
        }
    } catch (error) {
        showMessage('Error al generar recomendación', 'error');
    }
}

function seleccionarZonaPatrullaje(zona) {
    const zonaSelect = document.getElementById('patrullaje_zona');
    if (zonaSelect) {
        for(let i = 0; i < zonaSelect.options.length; i++) {
            if(zonaSelect.options[i].value === zona) {
                zonaSelect.selectedIndex = i;
                break;
            }
        }
    }
}

async function guardarPlanPatrullaje() {
    const token = localStorage.getItem('token');
    const fecha = document.getElementById('patrullaje_fecha')?.value;
    const horaInicio = document.getElementById('patrullaje_hora_inicio')?.value;
    const horaFin = document.getElementById('patrullaje_hora_fin')?.value;
    const zona = document.getElementById('patrullaje_zona')?.value;
    
    if (!fecha || !horaInicio || !horaFin || !zona) {
        showMessage('Complete todos los campos', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/policia/guardar-patrullaje', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ fecha, hora_inicio: horaInicio, hora_fin: horaFin, zona })
        });
        const result = await response.json();
        if (response.ok) {
            showMessage('Plan de patrullaje guardado', 'success');
            cargarPatrullajes();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al guardar patrullaje', 'error');
    }
}

async function cargarPatrullajes() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/policia/mis-patrullajes', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const lista = document.getElementById('patrullajes-lista');
        if (lista) {
            lista.innerHTML = '';
            if (data.patrullajes.length === 0) {
                lista.innerHTML = '<p>No hay patrullajes programados</p>';
            } else {
                data.patrullajes.forEach(function(pat) {
                    const card = document.createElement('div');
                    card.className = 'incidente-card';
                    card.innerHTML = `
                        <div class="incidente-titulo">Patrullaje - ${pat.zona}</div>
                        <div class="incidente-descripcion">Fecha: ${pat.fecha}</div>
                        <div class="incidente-descripcion">Horario: ${pat.hora_inicio} - ${pat.hora_fin}</div>
                        <div class="incidente-fecha">Estado: ${pat.estado}</div>
                    `;
                    lista.appendChild(card);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando patrullajes:', error);
    }
}

async function cargarPerfilPolicia() {
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
                    <p><strong>Número de Placa:</strong> ${usuario.numero_placa || 'No registrado'}</p>
                    <p><strong>Dirección Puesto:</strong> ${usuario.direccion_puesto || 'No registrada'}</p>
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

async function actualizarPerfilPolicia(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    const data = {};
    const telefono = document.getElementById('perfil_telefono')?.value;
    const telefonoEmergencia = document.getElementById('perfil_telefono_emergencia')?.value;
    const nuevaPassword = document.getElementById('perfil_nueva_password')?.value;
    
    if (telefono) data.telefono = telefono;
    if (telefonoEmergencia) data.telefono_emergencia = telefonoEmergencia;
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
            cargarPerfilPolicia();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al actualizar perfil', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const userName = localStorage.getItem('userName');
    const userPlaca = localStorage.getItem('userPlaca');
    if (userName) {
        document.getElementById('user-name').textContent = userName;
    }
    if (userPlaca) {
        const placaSpan = document.getElementById('user-placa');
        if (placaSpan) placaSpan.textContent = `(${userPlaca})`;
    }
    
    if (document.getElementById('actualizarPerfilForm')) {
        document.getElementById('actualizarPerfilForm').addEventListener('submit', actualizarPerfilPolicia);
    }
    
    if (document.getElementById('mapa')) {
        setTimeout(function() {
            inicializarMapa();
            cargarIncidentesPreview();
        }, 500);
    }
    
    mostrarPagina('asignados');
    connectWebSocket();
});