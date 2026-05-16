// 1. CONFIGURACIÓN DE FIREBASE (Con tus llaves secretas)
const firebaseConfig = {
    apiKey: "AIzaSyD_WiArRCE8_x7il5xaKCVkrHJo9mW6DT0",
    authDomain: "calendario-sofii.firebaseapp.com",
    projectId: "calendario-sofii",
    storageBucket: "calendario-sofii.firebasestorage.app",
    messagingSenderId: "510593512305",
    appId: "1:510593512305:web:4bd38144068d757beafcd0"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variable global para controlar el almanaque visual
let calendarioVisual = null;

// 2. ELEMENTOS DE LA PÁGINA
const modalCuriosidades = document.getElementById("modal-curiosidades");
const btnCuriosidades = document.getElementById("btn-curiosidades");
const cerrarCuriosidades = document.getElementById("cerrar-curiosidades");

const modalCalendario = document.getElementById("modal-calendario");
const btnCalendario = document.getElementById("btn-calendario");
const cerrarCalendario = document.getElementById("cerrar-calendario");

const btnGuardarFecha = document.getElementById("btn-guardar-fecha");
const fechaInput = document.getElementById("fecha-input");
const descInput = document.getElementById("desc-input");
const listaFechas = document.getElementById("lista-fechas");

// 3. ABRIR Y CERRAR VENTANAS FLOTANTES
btnCuriosidades.onclick = () => modalCuriosidades.style.display = "flex";
cerrarCuriosidades.onclick = () => modalCuriosidades.style.display = "none";

btnCalendario.onclick = () => {
    modalCalendario.style.display = "flex";
    inicializarAlmanaque(); // Crea el almanaque visual
    cargarFechas();        // Descarga y pinta las fechas de Firebase
};
cerrarCalendario.onclick = () => modalCalendario.style.display = "none";

window.onclick = (event) => {
    if (event.target == modalCuriosidades) modalCuriosidades.style.display = "none";
    if (event.target == modalCalendario) modalCalendario.style.display = "none";
};

// Acordeón para secretos
const secretos = document.querySelectorAll('.secreto-item');
secretos.forEach(secreto => {
    if(!secreto.classList.contains('fecha-item')){ 
        secreto.addEventListener('click', () => {
            const respuesta = secreto.querySelector('.secreto-respuesta');
            respuesta.style.display = (respuesta.style.display === "block") ? "none" : "block";
        });
    }
});

// 4. NUEVO: CONFIGURACIÓN DEL ALMANAQUE VISUAL
function inicializarAlmanaque() {
    // Si ya existe uno creado previamente, lo destruimos para no duplicarlo
    if (calendarioVisual) {
        calendarioVisual.destroy();
    }

    // Configuramos el calendario interactivo en español
    calendarioVisual = new VanillaCalendar('#almanaque-visual', {
        settings: {
            lang: 'es-ES',
            iso8601: false,
            selection: {
                day: 'single',
            }
        },
        actions: {
            // Cuando hacen clic en un día del almanaque, se rellena automáticamente el formulario de abajo
            clickDay(event, self) {
                if (self.selectedDates.length > 0) {
                    fechaInput.value = self.selectedDates[0];
                }
            }
        }
    });

    calendarioVisual.init();
}

// 5. FUNCIONES DEL CALENDARIO (FIREBASE)

// --- GUARDAR O CREAR UN EVENTO ---
btnGuardarFecha.onclick = () => {
    const fecha = fechaInput.value;
    const desc = descInput.value;

    if (fecha === "" || desc === "") {
        alert("Por favor llena ambos campos para guardar la fecha 😊");
        return;
    }

    btnGuardarFecha.innerText = "Guardando...";

    db.collection("fechas").add({
        fecha: fecha,
        descripcion: desc,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        fechaInput.value = "";
        descInput.value = "";
        btnGuardarFecha.innerText = "Guardar Fecha";
        cargarFechas(); 
    }).catch((error) => {
        console.error("Error al guardar:", error);
        btnGuardarFecha.innerText = "Error, intenta de nuevo";
    });
};

// --- LEER Y MOSTRAR TODOS LOS EVENTOS EN TIEMPO REAL ---
function cargarFechas() {
    listaFechas.innerHTML = "<p style='text-align:center; color:#999; margin-top: 10px;'>Buscando recuerdos...</p>";
    
    db.collection("fechas").orderBy("fecha", "asc").get().then((querySnapshot) => {
        listaFechas.innerHTML = ""; 
        const fechasConEventos = []; // Array para guardar qué días tienen recuerdos
        
        if (querySnapshot.empty) {
            listaFechas.innerHTML = "<p style='text-align:center; color:#999; margin-top: 10px;'>Aún no hay fechas guardadas. ¡Añade la primera!</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const idDoc = doc.id; 
            
            // Añadimos la fecha a la lista para iluminarla en el almanaque
            fechasConEventos.push(data.fecha);

            const fechaObj = new Date(data.fecha + 'T00:00:00'); 
            const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
            const fechaBonita = fechaObj.toLocaleDateString('es-ES', opciones);

            const div = document.createElement("div");
            div.className = "secreto-item glass-mini fecha-item";
            div.innerHTML = `
                <div class="fecha-header">
                    <strong>${fechaBonita}</strong>
                    <button class="btn-eliminar" onclick="eliminarFecha('${idDoc}')" title="Eliminar recuerdo">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <p id="desc-${idDoc}" ondblclick="editarFecha('${idDoc}', '${data.descripcion}')" title="Doble clic para editar">${data.descripcion}</p>
                <small style="color: #666; font-size: 0.75rem; margin-top: 5px; display: block;">💡 Doble clic en el texto para editar</small>
            `;
            listaFechas.appendChild(div);
        });

        // Hacemos que el almanaque visual resalte y dibuje puntitos en los días que tienen sorpresas guardadas
        if (calendarioVisual) {
            calendarioVisual.settings.selected.dates = fechasConEventos;
            calendarioVisual.update();
        }
    });
}

// --- ELIMINAR UN EVENTO ---
function eliminarFecha(id) {
    if (confirm("¿Estás seguro de que quieres borrar este recuerdo? 🥺")) {
        db.collection("fechas").doc(id).delete().then(() => {
            cargarFechas(); 
        }).catch((error) => {
            alert("No se pudo borrar, intenta de nuevo.");
            console.error("Error al borrar: ", error);
        });
    }
}

// --- EDITAR UN EVENTO (DOBLE CLIC) ---
function editarFecha(id, descripcionActual) {
    const nuevoTexto = prompt("Edita tu recuerdo o plan:", descripcionActual);
    
    if (nuevoTexto === null || nuevoTexto.trim() === "") return;

    db.collection("fechas").doc(id).update({
        descripcion: nuevoTexto
    }).then(() => {
        cargarFechas(); 
    }).catch((error) => {
        alert("No se pudo actualizar el texto.");
        console.error("Error al editar: ", error);
    });
}
