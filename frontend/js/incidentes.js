async function reportarIncidente(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Debes iniciar sesion primero', 'error');
        return;
    }
    
    const latitud = parseFloat(document.getElementById('latitud').value);
    const longitud = parseFloat(document.getElementById('longitud').value);
    
    if (isNaN(latitud) || isNaN(longitud)) {
        showMessage('Debes seleccionar una ubicacion en el mapa o usar tu ubicacion actual', 'error');
        return;
    }
    
    const imagenesInput = document.getElementById('imagenes');
    const imagenes = [];
    
    for (let i = 0; i < imagenesInput.files.length; i++) {
        const file = imagenesInput.files[i];
        const reader = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
        imagenes.push(reader);
    }
    
    const data = {
        tipo_delito: document.getElementById('tipo_delito').value,
        descripcion: document.getElementById('descripcion').value,
        latitud: latitud,
        longitud: longitud,
        direccion: document.getElementById('direccion').value,
        imagenes: imagenes
    };
    
    try {
        const response = await fetch('/api/reportar-incidente', {
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
            document.getElementById('preview_imagenes').innerHTML = '';
            document.getElementById('coordenadas_info').innerHTML = '';
            if (marcador) {
                marcador.setMap(null);
            }
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
        const response = await fetch('/api/incidentes', {
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
            let imagenesHtml = '';
            if (inc.imagenes && inc.imagenes.length > 0) {
                imagenesHtml = '<div class="preview-imagenes">';
                inc.imagenes.forEach(img => {
                    imagenesHtml += `<img src="${img}" style="width:80px;height:80px;">`;
                });
                imagenesHtml += '</div>';
            }
            
            lista.innerHTML += `
                <div class="incidente-card">
                    <strong>${inc.tipo_delito}</strong>
                    <p>${inc.descripcion}</p>
                    <small>Direccion: ${inc.direccion}</small><br>
                    <small>Coordenadas: ${inc.latitud}, ${inc.longitud}</small><br>
                    <small>Reportado por: ${inc.vecino_nombre} ${inc.vecino_apellido || ''}</small><br>
                    <small>Ubicacion valida: ${inc.ubicacion_valida ? 'Si' : 'Pendiente'}</small><br>
                    <small>Estado: ${inc.estado}</small><br>
                    <small>Fecha: ${new Date(inc.creado_en).toLocaleString()}</small>
                    ${imagenesHtml}
                </div>
            `;
        });
    } catch (error) {
        showMessage('Error al cargar incidentes', 'error');
    }
}