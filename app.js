/**
 * LyED ToolKit (Home)
 * Maneja la navegación desde la página principal hacia los módulos.
 * Por ahora solo está conectado el Módulo 1 (Validador).
 */

document.querySelectorAll(".module-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const moduleId = btn.dataset.module;

        if (moduleId === "1") {
            // Navegación al Validador (módulo 1)
            window.location.href = "validator-module1/validator.html";
            return;
        }

        // Otros módulos: pendientes
        console.log("Módulo no implementado aún:", moduleId);
    });
});