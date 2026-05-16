// 1. CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyD_WiArRCE8_x7il5xaKCVkrHJo9mW6DT0",
    authDomain: "calendario-sofii.firebaseapp.com",
    projectId: "calendario-sofii",
    storageBucket: "calendario-sofii.firebasestorage.app",
    messagingSenderId: "510593512305",
    appId: "1:510593512305:web:4bd38144068d757beafcd0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables globales para el almanaque nativo
let fechaActualAlmanaque = new Date();
let listaFechasGuardadas = []; 

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
const contenedorAlmanaque = document.getElementById("almanaque-visual");

// 3. VENTANAS FLOTANTES
btnCuriosidades.onclick = () => modalCuriosidades.style.display = "flex";
cerrarCuriosidades.onclick = () => modalCuriosidades.style.display = "none";

btnCalendario.onclick = () => {
    modalCalendario.style.display = "flex";
    cargarFechas(); // Carga las fechas de Firebase y dibuja la cuadrícula al instante
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

// 4. FUNCIONES DE FABRICACIÓN DEL ALMANAQUE NATIVO
function dibujarAlmanaque() {
    const año = fechaActualAlmanaque.getFullYear();
    const mes = fechaActualAlmanaque.getMonth();

    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    const primerDiaIndex = new Date(año, mes, 1).getDay(); 
    const totalDiasMes = new Date(año, mes + 1, 0).getDate();

    let html = `
        <div class="almanaque-header">
            <button id="ant-mes"><i class="fas fa-chevron-left"></i></button>
            <span>${nombresMeses[mes]} ${año}</span>
            <button id="sig-mes"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="almanaque-semana">
            <div>Do</div><div>Lu</div><div>Ma</div><div>Mi</div><div>Ju</div><div>Vi</div><div>Sá</div>
        </div>
        <div class="almanaque-dias">
    `;

    for (let i = 0; i < primerDiaIndex; i++) {
        html += `<div class="dia-celda dia-vacio"></div>`;
    }

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const mesFormateado = String(mes + 1).padStart(2, '0');
        const diaFormateado = String(dia).padStart(2, '0');
        const stringFechaCelda = `${año}-${mesFormateado}-${diaFormateado}`;

        const tieneEvento = listaFechasGuardadas.includes(stringFechaCelda);
        const claseEvento = tieneEvento ? "dia-con-evento" : "";

        html += `<div class="dia-celda ${claseEvento}" data-fecha="${stringFechaCelda}">${dia}</div>`;
    }

    html += `</div>`;
    contenedorAlmanaque.innerHTML = html;

    // Cambiar de mes
    document.getElementById("ant-mes").onclick = () => {
        fechaActualAlmanaque.setMonth(fechaActualAlmanaque.getMonth() - 1);
        dibujarAlmanaque();
    };
    document.getElementById("sig-mes").onclick = () => {
        fechaActualAlmanaque.setMonth(fechaActualAlmanaque.getMonth() + 1);
        dibujarAlmanaque();
    };

    // Selección de celdas
    const celdas = contenedorAlmanaque.querySelectorAll('.dia-celda:not(.dia-vacio)');
    celdas.forEach(celda => {
        celda.onclick = () => {
            celdas.forEach(c => c.classList.remove('dia-seleccionado'));
            celda.classList.add('dia-seleccionado');
            fechaInput.value = celda.getAttribute('data-fecha');
        };
    });
}

// --- LEER Y DESPLEGAR EVENTOS (FIREBASE) ---
function cargarFechas() {
    listaFechas.innerHTML = "<p style='text-align:center; color:#999; margin-top: 10px;'>Buscando recuerdos...</p>";
    
    db.collection("fechas").get().then((querySnapshot) => {
        listaFechas.innerHTML = ""; 
        let notas = [];
        listaFechasGuardadas = []; 
        
        if (querySnapshot.empty) {
            listaFechas.innerHTML = "<p style='text-align:center; color:#999; margin-top: 10px;'>Aún no hay fechas guardadas. ¡Añade la primera!</p>";
            dibujarAlmanaque(); 
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            notes_item = {
                id: doc.id,
                fecha: data.fecha,
                descripcion: data.descripcion
            };
            notas.push(notes_item);
            listaFechasGuardadas.push(data.fecha); 
        });

        // Orden cronológico
        notas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        // Desplegar las tarjetas abajo
        notas.forEach((nota) => {
            const fechaObj = new Date(nota.fecha + 'T00:00:00'); 
            const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
            const fechaBonita = fechaObj.toLocaleDateString('es-ES', opciones);

            const div = document.createElement("div");
            div.className = "secreto-item glass-mini fecha-item";
            div.innerHTML = `
                <div class="fecha-header">
                    <strong>${fechaBonita}</strong>
                    <button class="btn-eliminar" onclick="eliminarFecha('${nota.id}')" title="Eliminar recuerdo">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <p id="desc-${nota.id}" ondblclick="editarFecha('${nota.id}', '${nota.descripcion}')" title="Doble clic para editar">${nota.descripcion}</p>
                <small style="color: #666; font-size: 0.75rem; margin-top: 5px; display: block;">💡 Doble clic en el texto para editar</small>
            `;
            listaFechas.appendChild(div);
        });

        // Redibuja el almanaque con las luces rosas cargadas
        dibujarAlmanaque();

    }).catch((error) => {
        console.error("Error al cargar:", error);
        listaFechas.innerHTML = "<p style='text-align:center; color:#ff6b81;'>Error al conectar con la base de datos.</p>";
    });
}

// --- GUARDAR EVENTO ---
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

// --- ELIMINAR EVENTO ---
function eliminarFecha(id) {
    if (confirm("¿Estás seguro de que quieres borrar este recuerdo? 🥺")) {
        db.collection("fechas").doc(id).delete().then(() => {
            cargarFechas(); 
        }).catch((error) => {
            alert("No se pudo borrar, intenta de nuevo.");
        });
    }
}

// --- EDITAR EVENTO (DOBLE CLIC) ---
function editarFecha(id, descripcionActual) {
    const nuevoTexto = prompt("Edita tu recuerdo o plan:", descripcionActual);
    if (nuevoTexto === null || nuevoTexto.trim() === "") return;

    db.collection("fechas").doc(id).update({
        descripcion: nuevoTexto
    }).then(() => {
        cargarFechas(); 
    });
}
