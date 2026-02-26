document.addEventListener("DOMContentLoaded", () => {
    if (window.__LYED_VALIDATOR_INIT__) return;
    window.__LYED_VALIDATOR_INIT__ = true;

    const MAX = 10;
    const MIN = 1;

    const hypothesesEl = document.getElementById("hypotheses");
    const addBtn = document.getElementById("addHypBtn");
    const countText = document.getElementById("countText");
    const conclusionInput = document.getElementById("conclusionInput");

    const clearBtn = document.getElementById("clearBtn");
    const criticalBtn = document.getElementById("criticalBtn");
    const tautBtn = document.getElementById("tautBtn");
    const exampleBtn = document.getElementById("exampleBtn");

    const banner = document.getElementById("banner");
    const bannerTitle = document.getElementById("bannerTitle");
    const bannerSub = document.getElementById("bannerSub");
    const bannerIcon = document.getElementById("bannerIcon");
    const bannerClose = document.getElementById("bannerClose");

    const truthSection = document.getElementById("truthSection");
    const truthWrap = document.getElementById("truthWrap");
    const truthMeta = document.getElementById("truthMeta");
    const truthChip = document.getElementById("truthChip");

    const helpToggle = document.getElementById("helpToggle");
    const symbolsBox = document.getElementById("symbolsBox"); // opcional

    const baseOk =
        hypothesesEl && addBtn && countText && conclusionInput && clearBtn && criticalBtn && tautBtn;


    if (helpToggle && symbolsBox) {
        helpToggle.addEventListener("click", () => {
            const isHidden = symbolsBox.classList.contains("hidden");

            symbolsBox.classList.toggle("hidden");
            helpToggle.setAttribute("aria-expanded", String(isHidden));
        });
    }

    if (!baseOk) {
        console.error("Faltan elementos en el DOM. Revisa IDs.");
        return;
    }

    if (!window.LyEDLogic) {
        console.error("No se cargó logic.js (LyEDLogic no existe). Revisa el orden de scripts.");
        return;
    }

    const boolVF = (x) => (x ? "V" : "F");

    const clearOutputs = () => {
        if (banner) banner.classList.add("hidden");
        if (truthSection) truthSection.classList.add("hidden");
        if (truthWrap) truthWrap.innerHTML = "";
        if (truthMeta) truthMeta.textContent = "· 0 renglones";
        if (truthChip) truthChip.textContent = "—";
    };

    const showBanner = (type, title, sub, iconText) => {
        if (!banner || !bannerTitle || !bannerSub || !bannerIcon) return;

        banner.classList.remove("hidden", "ok", "bad", "vac");
        if (type) banner.classList.add(type);

        bannerTitle.textContent = title;
        bannerSub.textContent = sub;
        bannerIcon.textContent = iconText || "!";
    };

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

    const setSymbolsHelp = () => {
        if (!symbolsBox) return;
        symbolsBox.textContent =
            "Símbolos válidos: ¬ ~  (negación),  ∧ ^  (y),  ∨ v  (o),  → -> >  (implicación),  ( )  paréntesis. Variables: letras (p, q, r...).";
    };

    const renderTruthTable = (vars, hypsRaw, conclRaw, rows, method) => {

        if (!truthSection || !truthWrap || !truthMeta || !truthChip) return;

        truthSection.classList.remove("hidden");
        truthMeta.textContent = `· ${rows.length} renglones`;

        truthChip.textContent =
            method === "critical" ? "Renglón(es) crítico(s) marcado(s)" : "Implicación (premisas → conclusión)";

        const headerHyps = hypsRaw.map((h) => window.LyEDLogic.prettyFormula(h));
        const headerConcl = window.LyEDLogic.prettyFormula(conclRaw);

        // encabezado de tautología simplificado
        const tautHeader = `(H1 ∧ … ∧ Hn) → ∴Q`;

        let html = `<table class="truth-table"><thead><tr>`;

        for (let i = 0; i < vars.length; i++) {
            html += `<th><span class="truth-sym">${vars[i]}</span></th>`;
        }

        for (let i = 0; i < headerHyps.length; i++) {
            html += `<th>${headerHyps[i]}<div class="truth-small">(H${i + 1})</div></th>`;
        }

        // conclusión con “subíndice” tipo las hipótesis
        html += `<th>∴ ${headerConcl}<div class="truth-small">(Q)</div></th>`;

        if (method === "taut") {
            html += `<th>${tautHeader}</th>`;
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

    const updateLabels = () => {
        const rows = hypothesesEl.querySelectorAll(".hyp-row");

        for (let i = 0; i < rows.length; i++) {
            const label = rows[i].querySelector(".hyp-label");
            if (label) label.textContent = `H${i + 1}`;

            const input = rows[i].querySelector(".hyp-input");
            if (input) input.setAttribute("aria-label", `Hipótesis ${i + 1}`);

            const remove = rows[i].querySelector(".hyp-remove");
            if (remove) remove.setAttribute("aria-label", `Quitar hipótesis ${i + 1}`);
        }

        countText.textContent = `(${rows.length}/${MAX})`;

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
    };

    const makeRow = (value) => {
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
    };

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
            if (method === "critical") {
                const res = window.LyEDLogic.solve(hyps, concl, "critical");

                if (!res.hasCritical) {
                    showBanner(
                        "vac",
                        "Argumento vacío",
                        "No hay renglón crítico (las premisas nunca son verdaderas a la vez).",
                        "!"
                    );
                } else if (res.isValid) {
                    showBanner(
                        "ok",
                        "Argumento válido",
                        "En todo renglón crítico, la conclusión es verdadera.",
                        "✓"
                    );
                } else {
                    showBanner(
                        "bad",
                        "Argumento inválido — Renglón Crítico",
                        "Existe al menos un renglón crítico donde la conclusión es falsa.",
                        "×"
                    );
                }

                renderTruthTable(res.vars, hyps, concl, res.rows, "critical");
                return;
            }

            const res = window.LyEDLogic.solve(hyps, concl, "taut");
            if (res.isTaut) {
                showBanner(
                    "ok",
                    "Argumento válido — Tautología",
                    "La implicación (premisas → conclusión) es tautología.",
                    "✓"
                );
            } else {
                showBanner(
                    "bad",
                    "Argumento inválido — Tautología",
                    "La implicación falla en al menos una valuación.",
                    "×"
                );
            }

            renderTruthTable(res.vars, hyps, concl, res.rows, "taut");
        } catch (err) {
            const msg = String(err && err.message ? err.message : err);
            showBanner("bad", "Fórmula inválida", msg, "!");
        }
    };

    addBtn.addEventListener(
        "click",
        () => {
            const rows = hypothesesEl.querySelectorAll(".hyp-row");
            if (rows.length >= MAX) return;

            hypothesesEl.appendChild(makeRow(""));
            updateLabels();
            clearOutputs();
        },
        false
    );

    hypothesesEl.addEventListener(
        "click",
        (e) => {
            const btn = e.target.closest(".hyp-remove");
            if (!btn) return;

            const rows = hypothesesEl.querySelectorAll(".hyp-row");
            if (rows.length <= MIN) return;

            const row = btn.closest(".hyp-row");
            if (row) row.remove();

            updateLabels();
            clearOutputs();
        },
        false
    );

    if (exampleBtn) {
        exampleBtn.addEventListener("click", function () {

            // Limpiar hipótesis y conclusión
            hypothesesEl.innerHTML = "";

            // Agrega exactamente 2 hipótesis
            hypothesesEl.appendChild(makeRow("p → q"));
            hypothesesEl.appendChild(makeRow("p"));

            // Conclusión
            conclusionInput.value = "q";

            updateLabels();
            clearOutputs();

            // Ejecuta automáticamente Tautología
            if (typeof compute === "function") {
                compute("taut");
            } else {
                tautBtn.click();
            }

        });
    }

    clearBtn.addEventListener("click", () => {
        hypothesesEl.innerHTML = "";
        hypothesesEl.appendChild(makeRow(""));
        hypothesesEl.appendChild(makeRow(""));
        conclusionInput.value = "";
        clearOutputs();
        updateLabels();
    });

    if (bannerClose && banner) {
        bannerClose.addEventListener("click", () => banner.classList.add("hidden"));
    }

    criticalBtn.addEventListener("click", () => compute("critical"));
    tautBtn.addEventListener("click", () => compute("taut"));

    setSymbolsHelp();
    updateLabels();
});