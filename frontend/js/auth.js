async function registrarUsuario(event) {
    event.preventDefault();
    const data = {
        ci: document.getElementById('reg_ci').value,
        nombre: document.getElementById('reg_nombre').value,
        apellido: document.getElementById('reg_apellido').value,
        email: document.getElementById('reg_email').value,
        telefono: document.getElementById('reg_telefono').value,
        password: document.getElementById('reg_contrasena').value
    };
    
    try {
        const response = await fetch('/api/registro', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            document.getElementById('registroForm').reset();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error en el registro', 'error');
    }
}

async function verificarCodigo(event) {
    event.preventDefault();
    const data = {
        email: document.getElementById('ver_email').value,
        codigo: document.getElementById('ver_codigo').value
    };
    
    try {
        const response = await fetch('/api/verificar-codigo', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            document.getElementById('verificarForm').reset();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error en la verificacion', 'error');
    }
}

async function loginUsuario(event) {
    event.preventDefault();
    const data = {
        email: document.getElementById('login_email').value,
        password: document.getElementById('login_contrasena').value
    };
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            localStorage.setItem('token', result.access_token);
            localStorage.setItem('userName', data.email.split('@')[0]);
            actualizarUIporSesion();
            mostrarPagina('mapa');
            showMessage('Bienvenido', 'success');
            document.getElementById('loginForm').reset();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error en el login', 'error');
    }
}

async function solicitarRecuperacion(event) {
    event.preventDefault();
    const data = {
        email: document.getElementById('rec_email').value
    };
    
    try {
        const response = await fetch('/api/solicitar-recuperacion', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            document.getElementById('solicitarRecuperacionForm').reset();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error', 'error');
    }
}

async function cambiarContrasena(event) {
    event.preventDefault();
    const data = {
        email: document.getElementById('cambio_email').value,
        codigo: document.getElementById('cambio_codigo').value,
        nueva_password: document.getElementById('cambio_contrasena').value
    };
    
    try {
        const response = await fetch('/api/cambiar-contrasena', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            document.getElementById('cambiarContrasenaForm').reset();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error', 'error');
    }
    async function loginUsuario(event) {
        event.preventDefault();
        const data = {
            email: document.getElementById('login_email').value,
            password: document.getElementById('login_contrasena').value
        };
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem('token', result.access_token);
                localStorage.setItem('userName', result.nombre || data.email.split('@')[0]);
                localStorage.setItem('userRol', result.rol);
                actualizarUIporSesion();
                mostrarPagina('mapa');
                showMessage('Bienvenido ' + result.nombre, 'success');
                document.getElementById('loginForm').reset();
            } else {
                showMessage(result.detail, 'error');
            }
        } catch (error) {
            showMessage('Error en el login', 'error');
        }
    }
}