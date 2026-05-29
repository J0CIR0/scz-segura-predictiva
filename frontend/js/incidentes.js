async function reportarIncidente(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Debes iniciar sesion primero', 'error');
        return;
    }
    
    const data = {
        tipo_delito: document.getElementById('tipo_delito').value,
        descripcion: document.getElementById('descripcion').value,
        latitud: parseFloat(document.getElementById('latitud').value),
        longitud: parseFloat(document.getElementById('longitud').value),
        direccion: document.getElementById('direccion').value
    };
    
    try {
        const response = await fetch(`${API_URL}/reportar-incidente`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            document.getElementById('reporteForm').reset();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al reportar incidente', 'error');
    }
}

async function cargarIncidentes() {
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Debes iniciar sesion para ver incidentes', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/incidentes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const incidentes = await response.json();
        
        const lista = document.getElementById('incidentesLista');
        lista.innerHTML = '';
        
        if (incidentes.length === 0) {
            lista.innerHTML = '<p>No hay incidentes reportados aun.</p>';
            return;
        }
        
        incidentes.forEach(inc => {
            lista.innerHTML += `
                <div class="incidente-card">
                    <strong>${inc.tipo_delito}</strong>
                    <p>${inc.descripcion}</p>
                    <small>Direccion: ${inc.direccion}</small><br>
                    <small>Coordenadas: ${inc.latitud}, ${inc.longitud}</small><br>
                    <small>Reportado por: ${inc.vecino_nombre} ${inc.vecino_apellido || ''}</small><br>
                    <small>Estado: ${inc.estado}</small><br>
                    <small>Fecha: ${new Date(inc.creado_en).toLocaleString()}</small>
                </div>
            `;
        });
    } catch (error) {
        showMessage('Error al cargar incidentes', 'error');
    }
}