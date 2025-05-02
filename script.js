const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcPl6mNqcFIGc2iBPCBG21-Fan-xgUghNxMroMxhN5C5A-9nGDKoFe_WmCMO_Rlp-kgw/exec';
// Usando cors-anywhere como proxy
const API_URL = `https://cors-anywhere.herokuapp.com/${SCRIPT_URL}`;

// Log para debugging
console.log('Configuración inicial:', {
    scriptUrl: SCRIPT_URL,
    apiUrl: API_URL,
    navegador: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor
    }
});

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    const submitButton = event.target.querySelector('button');
    const errorMessage = document.getElementById('errorMessage');
    
    submitButton.disabled = true;
    errorMessage.style.display = 'none';

    try {
        console.log('Iniciando solicitud de login...');

        // Crear un formulario para enviar los datos
        const formData = new FormData();
        formData.append('action', 'login');
        formData.append('usuario', usuario);
        formData.append('password', password);

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Importante: esto permite la solicitud cross-origin
            body: formData
        });

        // Como estamos usando no-cors, necesitamos hacer una segunda solicitud para obtener los datos
        const checkUrl = `${SCRIPT_URL}?action=check&usuario=${encodeURIComponent(usuario)}`;
        const checkResponse = await fetch(checkUrl);
        const data = await checkResponse.json();
        
        console.log('Datos recibidos:', data);
        
        if (data.status === 'success') {
            localStorage.setItem('userData', JSON.stringify(data.data));
            window.location.href = 'main.html';
        } else {
            errorMessage.textContent = data.message || 'Error al iniciar sesión';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error detallado:', error);
        errorMessage.textContent = 'Error de conexión. Por favor, intente nuevamente.';
        errorMessage.style.display = 'block';
    } finally {
        submitButton.disabled = false;
    }
}); 
