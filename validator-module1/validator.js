document.addEventListener("DOMContentLoaded", function () {
    if (window.__LYED_VALIDATOR_INIT__) return;
    window.__LYED_VALIDATOR_INIT__ = true;

    const MAX = 10;
    const MIN = 1;

    const hypothesesEl = document.getElementById("hypotheses");
    const addBtn = document.getElementById("addHypBtn");
    const countText = document.getElementById("countText");
    const conclusionInput = document.getElementById("conclusionInput");
    const resultBox = document.getElementById("resultBox");
    const clearBtn = document.getElementById("clearBtn");
    const criticalBtn = document.getElementById("criticalBtn");
    const tautBtn = document.getElementById("tautBtn");

    // (opcionales, si los agregaste)
    const banner = document.getElementById("banner");
    const bannerTitle = document.getElementById("bannerTitle");
    const bannerSub = document.getElementById("bannerSub");
    const bannerIcon = document.getElementById("bannerIcon");
    const bannerClose = document.getElementById("bannerClose");
    const truthSection = document.getElementById("truthSection");
    const truthWrap = document.getElementById("truthWrap");
    const truthMeta = document.getElementById("truthMeta");
    const truthChip = document.getElementById("truthChip");

    // ✅ Si falta algo base, no revientes toda la app
    if (!hypothesesEl || !addBtn || !countText || !conclusionInput || !resultBox || !clearBtn || !criticalBtn || !tautBtn) {
        console.error("Falta un elemento en el DOM. Revisa IDs:", {
            hypothesesEl, addBtn, countText, conclusionInput, resultBox, clearBtn, criticalBtn, tautBtn
        });
        return;
    }

    if (!window.LyEDLogic) {
        console.error("No se cargó logic.js (window.LyEDLogic no existe). Revisa el orden: logic.js antes que validator.js");
        return;
    }

    const boolVF = (x) => (x ? "V" : "F");

    const getHypothesisStrings = () => {
        const rows = hypothesesEl.querySelectorAll(".hyp-row");
        const list = [];
        for (let i = 0; i < rows.length; i++) {
            const input = rows[i].querySelector(".hyp-input");
            const val = input ? String(input.value || "").trim() : "";
            if (val) list.push(val);
        }
        return list;
    };

    const clearOutputs = () => {
        resultBox.textContent = "";

        if (banner) banner.classList.add("hidden");
        if (truthSection) truthSection.classList.add("hidden");
        if (truthWrap) truthWrap.innerHTML = "";
        if (truthMeta) truthMeta.textContent = "· 0 renglones";
        if (truthChip) truthChip.textContent = "—";
    };

    const showBanner = (type, title, sub, iconText) => {
        // Si no existe banner (aún), usamos resultBox.
        if (!banner || !bannerTitle || !bannerSub || !bannerIcon) {
            resultBox.textContent = `${title} — ${sub}`;
            return;
        }

        banner.classList.remove("hidden", "ok", "bad", "vac");
        if (type) banner.classList.add(type);
        bannerTitle.textContent = title;
        bannerSub.textContent = sub;
        bannerIcon.textContent = iconText || "!";
    };

    const renderTruthTable = (vars, hypsRaw, conclRaw, rows, method) => {
        if (!truthSection || !truthWrap || !truthMeta || !truthChip) {
            // sin tabla aún, solo texto:
            resultBox.textContent = "Tabla generada (pero falta el contenedor HTML para renderizarla).";
            return;
        }

        truthSection.classList.remove("hidden");
        truthMeta.textContent = `· ${rows.length} renglones`;

        truthChip.textContent =
            method === "critical" ? "Renglón(es) crítico(s) marcado(s)" : "Implicación (premisas → conclusión)";

        const headerHyps = hypsRaw.map((h) => window.LyEDLogic.prettyFormula(h));
        const headerConcl = window.LyEDLogic.prettyFormula(conclRaw);

        let html = "";
        html += `<table class="truth-table">`;
        html += `<thead><tr>`;

        for (let i = 0; i < vars.length; i++) {
            html += `<th><span class="truth-sym">${vars[i]}</span></th>`;
        }

        for (let i = 0; i < headerHyps.length; i++) {
            html += `<th>${headerHyps[i]}<div class="truth-small">(h${i + 1})</div></th>`;
        }

        html += `<th>∴ ${headerConcl}</th>`;

        if (method === "taut") {
            const imp = `(${headerHyps.join(" ∧ ")}) → ${headerConcl}`;
            html += `<th>${imp}</th>`;
        }

        html += `</tr></thead><tbody>`;

        for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            const classes = [];
            if (row.critical) classes.push("critical");
            if (row.badCritical) classes.push("bad");

            html += `<tr class="${classes.join(" ")}">`;

            for (let i = 0; i < vars.length; i++) {
                html += `<td>${boolVF(row.env[vars[i]])}</td>`;
            }

            for (let i = 0; i < row.premVals.length; i++) {
                html += `<td>${boolVF(row.premVals[i])}</td>`;
            }

            html += `<td>${boolVF(row.conclVal)}</td>`;

            if (method === "taut") {
                html += `<td>${boolVF(row.implVal)}</td>`;
            }

            html += `</tr>`;
        }

        html += `</tbody></table>`;
        truthWrap.innerHTML = html;
    };

    function updateLabels() {
        const rows = hypothesesEl.querySelectorAll(".hyp-row");

        for (let i = 0; i < rows.length; i++) {
            rows[i].querySelector(".hyp-label").textContent = "H" + (i + 1);
        }

        countText.textContent = "(" + rows.length + "/" + MAX + ")";

        if (rows.length >= MAX) addBtn.classList.add("hidden");
        else addBtn.classList.remove("hidden");

        if (rows.length <= MIN) {
            for (let i = 0; i < rows.length; i++) {
                rows[i].classList.add("no-remove");
                const removeBtn = rows[i].querySelector(".hyp-remove");
                if (removeBtn) removeBtn.classList.add("hidden");
            }
        } else {
            for (let i = 0; i < rows.length; i++) {
                rows[i].classList.remove("no-remove");
                const removeBtn = rows[i].querySelector(".hyp-remove");
                if (removeBtn) removeBtn.classList.remove("hidden");
            }
        }
    }

    function makeRow(value) {
        const row = document.createElement("div");
        row.className = "hyp-row";

        const label = document.createElement("div");
        label.className = "hyp-label";
        label.textContent = "H?";

        const input = document.createElement("input");
        input.className = "hyp-input";
        input.type = "text";
        input.placeholder = "Escribe una hipótesis...";
        input.value = value || "";

        const remove = document.createElement("button");
        remove.className = "hyp-remove";
        remove.type = "button";
        remove.title = "Quitar hipótesis";
        remove.textContent = "–";

        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(remove);

        return row;
    }

    addBtn.addEventListener("click", function () {
        const rows = hypothesesEl.querySelectorAll(".hyp-row");
        if (rows.length >= MAX) return;

        hypothesesEl.appendChild(makeRow(""));
        updateLabels();
        clearOutputs();
    }, false);

    hypothesesEl.addEventListener("click", function (e) {
        const btn = e.target.closest(".hyp-remove");
        if (!btn) return;

        const rows = hypothesesEl.querySelectorAll(".hyp-row");
        if (rows.length <= MIN) return;

        const row = btn.closest(".hyp-row");
        if (row) row.remove();

        updateLabels();
        clearOutputs();
    }, false);

    clearBtn.addEventListener("click", function () {
        hypothesesEl.innerHTML = "";
        hypothesesEl.appendChild(makeRow(""));
        hypothesesEl.appendChild(makeRow(""));
        conclusionInput.value = "";
        clearOutputs();
        updateLabels();
    });

    if (bannerClose) {
        bannerClose.addEventListener("click", function () {
            banner.classList.add("hidden");
        });
    }

    const compute = (method) => {
        clearOutputs();

        const hyps = getHypothesisStrings();
        const concl = String(conclusionInput.value || "").trim();

        if (hyps.length < 1) {
            showBanner("bad", "Faltan hipótesis", "Agrega al menos 1 hipótesis.", "!");
            return;
        }
        if (!concl) {
            showBanner("bad", "Falta la conclusión", "Escribe la conclusión para evaluar.", "!");
            return;
        }

        try {
            const res = window.LyEDLogic.solve(hyps, concl, method);

            if (method === "critical") {
                if (!res.hasCritical) {
                    showBanner("vac", "Argumento vacuo", "No hay renglón crítico (premisas nunca verdaderas a la vez).", "!");
                } else if (res.isValid) {
                    showBanner("ok", "Argumento válido", "En todo renglón crítico, la conclusión es verdadera.", "✓");
                } else {
                    showBanner("bad", "Argumento inválido — Renglón Crítico", "Hay renglón crítico con conclusión falsa.", "×");
                }
            } else {
                if (res.isTaut) {
                    showBanner("ok", "Argumento válido — Tautología", "La implicación (premisas → conclusión) es tautología.", "✓");
                } else {
                    showBanner("bad", "Argumento inválido — Tautología", "La implicación falla en al menos una valuación.", "×");
                }
            }

            renderTruthTable(res.vars, hyps, concl, res.rows, method);

        } catch (err) {
            showBanner("bad", "Fórmula inválida", String(err && err.message ? err.message : err), "!");
        }
    };

    criticalBtn.addEventListener("click", function () {
        compute("critical");
    });

    tautBtn.addEventListener("click", function () {
        compute("taut");
    });

    updateLabels();
});