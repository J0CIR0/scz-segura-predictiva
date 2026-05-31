function setSubmitButtonState(formId, isLoading, loadingText) {
    const form = document.getElementById(formId);
    if (!form) return null;

    const button = form.querySelector('button[type="submit"]');
    if (!button) return null;

    if (isLoading) {
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
        button.disabled = true;
        if (loadingText) {
            button.textContent = loadingText;
        }
    } else {
        button.disabled = false;
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    }

    return button;
}

async function registrarUsuario(event) {
    event.preventDefault();
    setSubmitButtonState('registroForm', true, 'Registrando...');

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
            const verEmail = document.getElementById('ver_email');
            if (verEmail) {
                verEmail.value = data.email;
            }
            mostrarPagina('registro');
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error en el registro', 'error');
    } finally {
        setSubmitButtonState('registroForm', false);
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
            mostrarPagina('login');
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error en la verificacion', 'error');
    }
}

async function loginUsuario(event) {
    event.preventDefault();
    setSubmitButtonState('loginForm', true, 'Ingresando...');

    const email = document.getElementById('login_email').value;
    const password = document.getElementById('login_contrasena').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: email, password: password})
        });
        const result = await response.json();
        
        if (response.ok) {
            if (result.status === 'success') {
                localStorage.setItem('token', result.access_token);
                localStorage.setItem('userName', result.nombre);
                localStorage.setItem('userRol', result.rol);
                localStorage.setItem('userId', result.id);
                
                if (typeof disconnectWebSocket === 'function') {
                    disconnectWebSocket();
                }
                if (typeof connectWebSocket === 'function') {
                    connectWebSocket();
                }
                
                let redirectPage = '';
                switch(result.rol) {
                    case 'vecino':
                        redirectPage = '/static/public/vecino.html';
                        break;
                    case 'admin_junta':
                        redirectPage = '/static/public/admin-junta.html';
                        break;
                    case 'policia':
                        redirectPage = '/static/public/policia.html';
                        break;
                    case 'superadmin':
                        redirectPage = '/static/public/superadmin.html';
                        break;
                    default:
                        redirectPage = '/';
                }
                window.location.href = redirectPage;
            } else {
                showMessage('Error al iniciar sesion', 'error');
            }
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error en el login', 'error');
    } finally {
        setSubmitButtonState('loginForm', false);
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
            mostrarPagina('login');
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error', 'error');
    }
}

async function cerrarSesion() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
        } catch (error) {}
    }
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRol');
    localStorage.removeItem('userId');
    if (typeof disconnectWebSocket === 'function') {
        disconnectWebSocket();
    }
    window.location.href = '/';
}