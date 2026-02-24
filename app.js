
// Por ahora solo dejaremos el click listo para cuando liguemos al validador.
document.querySelectorAll(".module-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const moduleId = btn.dataset.module;

        if (moduleId === "1") {
            // Cuando decidamos 1 HTML vs 2 archivos, aquí lo conectamos.
            // window.location.href = "validador.html";
            console.log("Ir a: Validador de Argumentos");
            return;
        }

        console.log("Módulo no implementado aún:", moduleId);
    });
});