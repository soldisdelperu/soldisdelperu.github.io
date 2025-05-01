const API_URL = 'https://script.google.com/macros/s/AKfycbzm_De4KG7Z4eMphpwX4koXCZaqJI2RCDJCl-Ql5fl8igFTF11igNECt0O61Rl6lkcF/exec';  // Actualizarás esto con la nueva URL

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    const submitButton = event.target.querySelector('button');
    const errorMessage = document.getElementById('errorMessage');
    
    submitButton.disabled = true;
    errorMessage.style.display = 'none';

    // Crear un nombre único para la función callback
    const callbackName = 'jsonpCallback_' + Date.now();

    // Crear la función callback temporal
    window[callbackName] = function(response) {
        if (response.status === 'success') {
            sessionStorage.setItem('userData', JSON.stringify(response.data));
            window.location.href = 'dashboard.html';
        } else {
            errorMessage.textContent = response.message || 'Error al iniciar sesión';
            errorMessage.style.display = 'block';
        }
        submitButton.disabled = false;
        
        // Limpiar: eliminar el script y la función callback
        delete window[callbackName];
        document.body.removeChild(script);
    };

    // Crear y añadir el script
    const script = document.createElement('script');
    script.src = `${API_URL}?action=login&usuario=${encodeURIComponent(usuario)}&password=${encodeURIComponent(password)}&callback=${callbackName}`;
    
    // Manejar errores
    script.onerror = function() {
        errorMessage.textContent = 'Error al procesar la solicitud';
        errorMessage.style.display = 'block';
        submitButton.disabled = false;
        delete window[callbackName];
        document.body.removeChild(script);
    };

    document.body.appendChild(script);
}); 