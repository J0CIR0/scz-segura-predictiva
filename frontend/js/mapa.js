function inicializarMapa() {
    const centroSantaCruz = [-17.783333, -63.183333];

    if (mapaLeaflet) {
        mapaLeaflet.off();
        mapaLeaflet.remove();
    }

    mapaLeaflet = L.map('mapa').setView(centroSantaCruz, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        maxZoom: 19,
        minZoom: 11
    }).addTo(mapaLeaflet);

    L.control.scale().addTo(mapaLeaflet);
    
    cargarHeatMap();
}

async function cargarHeatMap() {
    try {
        const response = await fetch('/api/incidentes-publicos');
        const data = await response.json();
        const incidentes = data.incidentes || [];
        
        const heatData = [];
        
        incidentes.forEach(inc => {
            if (inc.latitud && inc.longitud) {
                heatData.push([inc.latitud, inc.longitud, 1]);
            }
        });
        
        if (heatLayer) {
            mapaLeaflet.removeLayer(heatLayer);
        }
        
        if (heatData.length > 0) {
            heatLayer = L.heatLayer(heatData, {
                radius: 25,
                blur: 15,
                maxZoom: 17,
                minOpacity: 0.3,
                gradient: {
                    0.2: '#00cc00',
                    0.4: '#ffff00',
                    0.6: '#ff8c00',
                    0.8: '#ff0000'
                }
            }).addTo(mapaLeaflet);
        }
        
    } catch (error) {
        console.error('Error cargando heatmap:', error);
    }
}

function actualizarCoordenadas(lat, lng) {
    const latRedondeada = lat.toFixed(6);
    const lngRedondeada = lng.toFixed(6);

    document.getElementById('latitud').value = latRedondeada;
    document.getElementById('longitud').value = lngRedondeada;
    document.getElementById('coordenadas_info').innerHTML = `Ubicación: ${latRedondeada}, ${lngRedondeada}`;

    if (marcadorLeaflet) {
        marcadorLeaflet.setLatLng([lat, lng]);
    } else {
        marcadorLeaflet = L.marker([lat, lng]).addTo(mapaLeaflet);
    }

    mapaLeaflet.setView([lat, lng], 15);
}

function obtenerUbicacionActual() {
    if (!navigator.geolocation) {
        showMessage('Geolocalizacion no soportada', 'error');
        return;
    }

    showMessage('Obteniendo ubicacion...', 'success');

    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        actualizarCoordenadas(lat, lng);
        showMessage('Ubicacion obtenida', 'success');
    }, function(error) {
        showMessage('Error al obtener ubicacion', 'error');
    });
}

document.getElementById('imagenes').addEventListener('change', function(e) {
    const preview = document.getElementById('preview_imagenes');
    preview.innerHTML = '';
    const files = e.target.files;
    
    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.createElement('img');
            img.src = event.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(files[i]);
    }
});