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

    if (ubicacionSeleccionada && Array.isArray(ubicacionSeleccionada) && ubicacionSeleccionada.length === 2) {
        actualizarCoordenadas(ubicacionSeleccionada[0], ubicacionSeleccionada[1]);
    }
    
    cargarHeatMap();
}

async function cargarHeatMap() {
    try {
        const response = await fetch('/api/incidentes-publicos');
        const data = await response.json();
        const incidentes = data.incidentes || [];
        
        const heatData = [];
        
        incidentes.forEach(function(inc) {
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

    ubicacionSeleccionada = [lat, lng];

    document.getElementById('latitud').value = latRedondeada;
    document.getElementById('longitud').value = lngRedondeada;

    if (mapaLeaflet) {
        if (marcadorLeaflet) {
            marcadorLeaflet.setLatLng([lat, lng]);
        } else {
            marcadorLeaflet = L.marker([lat, lng]).addTo(mapaLeaflet);
        }

        mapaLeaflet.setView([lat, lng], 17);
    }
    
    obtenerDireccionDesdeCoordenadas(lat, lng);

    // Habilitar boton de reportar si existe
    const btnReportar = document.getElementById('btn-reportar');
    if (btnReportar) {
        btnReportar.disabled = false;
        console.log('actualizarCoordenadas: habilitado btn-reportar');
    }
}

async function obtenerDireccionDesdeCoordenadas(lat, lng) {
    try {
        const response = await fetch('/api/geocodificar?lat=' + lat + '&lon=' + lng);
        const data = await response.json();
        if (data.direccion) {
            document.getElementById('direccion').value = data.direccion;
        }
    } catch (error) {
        console.error('Error obteniendo direccion:', error);
    }
}

function obtenerUbicacionManual() {
    const statusDiv = document.getElementById('ubicacion-status');
    const btnReportar = document.getElementById('btn-reportar');
    const btnUbicacion = document.getElementById('btn-obtener-ubicacion');
    
    if (!navigator.geolocation) {
        statusDiv.innerHTML = '<div class="message error" style="display:block;">Tu navegador no soporta geolocalizacion.</div>';
        return;
    }
    
    if (btnUbicacion) {
        btnUbicacion.disabled = true;
        btnUbicacion.textContent = 'Obteniendo ubicacion...';
    }
    
    statusDiv.innerHTML = '<div class="message success" style="display:block;">Solicitando permiso para acceder a tu ubicacion...</div>';
    console.log('obtenerUbicacionManual: solicitando permiso de geolocalizacion');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            statusDiv.innerHTML = '<div class="message success" style="display:block;">Ubicacion obtenida correctamente!</div>';
            console.log('obtenerUbicacionManual: ubicacion obtenida', lat, lng);
            
            actualizarCoordenadas(lat, lng);
            
            if (btnReportar) btnReportar.disabled = false;
            if (btnUbicacion) {
                btnUbicacion.disabled = false;
                btnUbicacion.textContent = 'Obtener mi ubicacion actual';
            }
            
            setTimeout(function() {
                statusDiv.innerHTML = '';
            }, 3000);
        },
        function(error) {
            console.error('obtenerUbicacionManual: error', error);
            let mensaje = '';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensaje = 'Permiso denegado. Debes habilitar la ubicacion en tu navegador.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensaje = 'Ubicacion no disponible. Verifica tu GPS.';
                    break;
                case error.TIMEOUT:
                    mensaje = 'Tiempo de espera agotado. Intenta nuevamente.';
                    break;
                default:
                    mensaje = 'Error desconocido.';
            }
            
            statusDiv.innerHTML = '<div class="message error" style="display:block;">' + mensaje + '</div>';
            if (btnUbicacion) {
                btnUbicacion.disabled = false;
                btnUbicacion.textContent = 'Obtener mi ubicacion actual';
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

function centrarMapaEnSantaCruz() {
    const santaCruz = [-17.783333, -63.183333];
    if (mapaLeaflet) {
        mapaLeaflet.setView(santaCruz, 13);
    }
}

if (document.getElementById('btn-obtener-ubicacion')) {
    document.getElementById('btn-obtener-ubicacion').addEventListener('click', function() {
        obtenerUbicacionManual();
    });
}