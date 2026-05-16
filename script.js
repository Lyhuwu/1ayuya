const modal = document.getElementById("modal-curiosidades");
const btnCuriosidades = document.getElementById("btn-curiosidades");
const spanCerrar = document.getElementsByClassName("cerrar-modal")[0];
const secretos = document.querySelectorAll('.secreto-item');

// Abrir la ventana de secretos
btnCuriosidades.onclick = function() {
    modal.style.display = "flex";
}

// Cerrar con la X
spanCerrar.onclick = function() {
    modal.style.display = "none";
}

// Cerrar si se toca fuera del cuadro blanco
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Efecto acordeón para abrir cada secreto individual
secretos.forEach(secreto => {
    secreto.addEventListener('click', () => {
        const respuesta = secreto.querySelector('.secreto-respuesta');
        
        if (respuesta.style.display === "block") {
            respuesta.style.display = "none";
        } else {
            respuesta.style.display = "block";
        }
    });
});
