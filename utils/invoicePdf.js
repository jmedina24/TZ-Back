// utils/invoicePdf.js
const PDFDocument = require("pdfkit");
const fs = require("fs");

const A4_WIDTH = 595.28;

const safeText = (v) => String(v ?? "").trim();

const money = (n) => {
    const val = Math.round(Number(n) || 0);
    return `USD ${val.toLocaleString("es-UY")}`;
};

function buildInvoicePdfBuffer(purchase, opts = {}) {
    return new Promise((resolve, reject) => {
        try {
            const margin = 40;

            const doc = new PDFDocument({
                size: "A4",
                margin,
            });

            const chunks = [];
            doc.on("data", (c) => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));

            // =========================
            // Styles
            // =========================
            const C = {
                text: "#0f172a",
                muted: "#64748b",
                line: "#e2e8f0",
                softLine: "#f1f5f9",
                blue: "#0081ea",
                red: "#ef4444",
                softBlueFill: "#E9F4FF",
            };

            const left = margin;
            const right = A4_WIDTH - margin;
            const contentW = right - left;

            const drawHrWithin = (x, w, y, color = C.line) => {
                doc
                    .save()
                    .moveTo(x, y)
                    .lineTo(x + w, y)
                    .lineWidth(1)
                    .strokeColor(color)
                    .stroke()
                    .restore();
            };

            const drawHrFull = (y, color = C.line) => drawHrWithin(left, contentW, y, color);

            const drawTableBox = (x, y, w, h) => {
                doc
                    .save()
                    .roundedRect(x, y, w, h, 8)
                    .lineWidth(1)
                    .strokeColor(C.line)
                    .stroke()
                    .restore();
            };

            const fillSoftBlue = (x, y, w, h) => {
                doc
                    .save()
                    .rect(x, y, w, h)
                    .fillColor(C.softBlueFill)
                    .fill()
                    .restore();
            };

            // =========================
            // HEADER: Logo (izq) + Factura (der más ancha)
            // =========================
            const headerTop = margin;

            // ✅ Logo más grande y fijo a la izquierda
            const logoSize = 105;

            // ✅ Tabla factura MÁS ANCHA
            const facturaW = 270;
            const facturaX = right - facturaW;
            const facturaY = headerTop;

            // filas un poco más altas para que no corte
            const facturaRowH = 26;
            const facturaRows = 4;
            const facturaH = 14 + facturaRows * facturaRowH + 18;

            // =========================
            // LOGO centrado en el espacio izquierdo
            // =========================
            if (opts.logoPath) {
                try {
                    if (fs.existsSync(opts.logoPath)) {
                        const logoMaxW = 230;   // 👈 podés agrandarlo/acotarlo acá
                        const logoMaxH = 100;

                        // espacio disponible a la izquierda de la tabla factura
                        const logoAreaX = left;
                        const logoAreaW = facturaX - left; // hasta donde empieza la tabla factura

                        // centrado horizontal
                        const logoX = logoAreaX + (logoAreaW - logoMaxW) / 2;
                        const logoY = headerTop + 6; // pequeño aire vertical

                        doc.image(opts.logoPath, logoX, logoY, {
                            fit: [logoMaxW, logoMaxH],
                            align: "center",
                            valign: "top",
                        });
                    }
                } catch (e) {
                    // si falla el logo, no rompemos el PDF
                }
            }

            // --- Tabla Factura
            drawTableBox(facturaX, facturaY, facturaW, facturaH);
            fillSoftBlue(facturaX, facturaY, facturaW, 30);

            doc
                .save()
                .font("Helvetica-Bold")
                .fontSize(12)
                .fillColor(C.blue)
                .text("Factura", facturaX + 12, facturaY + 9, { width: facturaW - 24 })
                .restore();

            const created = purchase?.createdAt ? new Date(purchase.createdAt) : new Date();
            const fecha = created.toLocaleDateString("es-UY");
            const hora = created.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });

            const orderShort = String(purchase?._id || "").slice(-8).toUpperCase() || "—";
            const paymentMethod = safeText(purchase?.paymentMethod) || "—";

            const installments =
                purchase?.paymentMethod === "Tarjeta de crédito"
                    ? Number(purchase?.paymentDetails?.installments || 1)
                    : null;

            let medioPagoText = paymentMethod;

            if (purchase?.paymentMethod === "Tarjeta de crédito") {
                const inst = Number(purchase?.paymentDetails?.installments || 1);
                medioPagoText = `Tarjeta de crédito - Cuotas: ${inst}`;
            }

            const rows = [
                ["N°", orderShort],
                ["Fecha y hora", `${fecha} ${hora}`],
                ["Medio de pago", medioPagoText],
                ["Moneda", "Dólar Estadounidense (USD)"],
            ];

            const labelW = 95; // ✅ un poquito más para que respire
            let fy = facturaY + 34;

            rows.forEach(([k, v], idx) => {
                if (idx > 0) {
                    drawHrWithin(facturaX + 10, facturaW - 20, fy, C.softLine);
                }

                doc
                    .save()
                    .font("Helvetica")
                    .fontSize(9.5)
                    .fillColor(C.muted)
                    .text(k, facturaX + 12, fy + 7, { width: labelW });

                doc.fillColor(C.text);

                if (k === "Medio de pago" && installments && installments > 1) {
                    const valueX = facturaX + 12 + labelW;
                    const valueW = facturaW - 24 - labelW;

                    doc.text(v, valueX, fy + 7, { width: valueW, align: "left" });
                    doc
                        .save()
                        .fillColor(C.muted)
                        .text(`Cuotas: ${installments}`, valueX, fy + 7, { width: valueW, align: "right" })
                        .restore();
                } else {
                    doc.text(v, facturaX + 12 + labelW, fy + 7, {
                        width: facturaW - 24 - labelW,
                        align: "left",
                    });
                }

                doc.restore();
                fy += facturaRowH;
            });

            // Cursor: abajo del header (lo más alto entre logo y tabla factura)
            const headerBottom = Math.max(headerTop + logoSize, facturaY + facturaH);
            let cursorY = headerBottom + 18;

            // =========================
            // DATOS DEL CLIENTE (FULL WIDTH)
            // =========================
            const clienteX = left;
            const clienteY = cursorY;
            const clienteW = contentW;
            const clienteHeaderH = 30;
            const clienteRowH = 22;

            const userObj = purchase?.userId || {};
            const fullName =
                `${safeText(userObj?.firstName)} ${safeText(userObj?.firstSurname)}`.trim() || "—";
            const email = safeText(userObj?.email) || "—";

            // Teléfono: intenta en varios lados
            const phone =
                safeText(userObj?.phone) ||
                safeText(userObj?.tel) ||
                safeText(userObj?.phoneNumber) ||
                safeText(purchase?.shippingAddress?.phone) ||
                safeText(purchase?.shippingAddress?.tel) ||
                "—";

            const a = purchase?.shippingAddress || {};

            // Dirección en 1 línea: calle, nro, ciudad, localidad/depto, país
            const addr1 =
                [
                    `${safeText(a.street)} ${safeText(a.number)}`.trim(),
                    safeText(a.city),
                    safeText(a.locality || a.department),
                    safeText(a.country),
                ]
                    .filter(Boolean)
                    .join(", ") || "—";

            const cpLine = a.postalCode ? `CP: ${safeText(a.postalCode)}` : "";
            const refLine = a.reference ? `Ref: ${safeText(a.reference)}` : "";

            const clienteRows = [
                ["Nombre", fullName],
                ["Dirección", addr1],
            ];
            if (cpLine) clienteRows.push(["", cpLine]);
            if (refLine) clienteRows.push(["", refLine]);
            clienteRows.push(["Email", email]);
            clienteRows.push(["Teléfono", phone]);

            const clienteH = clienteHeaderH + clienteRows.length * clienteRowH + 14;

            drawTableBox(clienteX, clienteY, clienteW, clienteH);
            fillSoftBlue(clienteX, clienteY, clienteW, clienteHeaderH);

            doc
                .save()
                .font("Helvetica-Bold")
                .fontSize(11)
                .fillColor(C.blue)
                .text("Datos del cliente", clienteX + 12, clienteY + 9, { width: clienteW - 24 })
                .restore();

            let cY = clienteY + clienteHeaderH + 6;
            const clienteLabelW = 110;

            clienteRows.forEach(([k, v], idx) => {
                if (idx > 0) {
                    drawHrWithin(clienteX + 10, clienteW - 20, cY - 6, C.softLine);
                }

                doc.save().font("Helvetica").fontSize(10);

                doc.fillColor(C.muted).text(k || " ", clienteX + 12, cY, { width: clienteLabelW });

                doc
                    .fillColor(C.text)
                    .text(v || "—", clienteX + 12 + clienteLabelW, cY, {
                        width: clienteW - 24 - clienteLabelW,
                        align: "left",
                    });

                doc.restore();
                cY += clienteRowH;
            });

            cursorY = clienteY + clienteH + 18;

            // =========================
            // Tabla de productos (FULL WIDTH)
            // =========================
            const productsX = left;
            const productsY = cursorY;
            const productsW = contentW;

            const productsHeaderH = 30;
            const rowH = 22;

            const items = Array.isArray(purchase?.products) ? purchase.products : [];
            const productsH = productsHeaderH + items.length * rowH + 34;

            drawTableBox(productsX, productsY, productsW, productsH);
            fillSoftBlue(productsX, productsY, productsW, productsHeaderH);

            doc
                .save()
                .font("Helvetica-Bold")
                .fontSize(11)
                .fillColor(C.blue)
                .text("Detalle de productos", productsX + 12, productsY + 9, { width: productsW - 24 })
                .restore();

            // Columnas ajustadas (DTO siempre adentro)
            const col = (() => {
                const x0 = productsX;
                const x1 = productsX + productsW;

                const wGutter = 8;
                const padL = 12;
                const padR = 12;

                const wTotal = 76;
                const wDto = 62;
                const wPrecio = 80;
                const wCant = 54;

                const totalX = x1 - padR - wTotal;
                const dtoX = totalX - wGutter - wDto;
                const precioX = dtoX - wGutter - wPrecio;
                const cantX = precioX - wGutter - wCant;

                const descW = cantX - (x0 + padL) - wGutter;

                return {
                    desc: { x: x0 + padL, w: Math.max(240, descW) },
                    cant: { x: cantX, w: wCant },
                    precio: { x: precioX, w: wPrecio },
                    dto: { x: dtoX, w: wDto },
                    total: { x: totalX, w: wTotal },
                };
            })();

            let py = productsY + productsHeaderH + 8;

            doc.save().font("Helvetica").fontSize(9).fillColor(C.muted);
            doc.text("DESCRIPCIÓN", col.desc.x, py, { width: col.desc.w });
            doc.text("CANT.", col.cant.x, py, { width: col.cant.w, align: "right" });
            doc.text("PRECIO", col.precio.x, py, { width: col.precio.w, align: "right" });
            doc.text("DTO.", col.dto.x, py, { width: col.dto.w, align: "right" });
            doc.text("TOTAL", col.total.x, py, { width: col.total.w, align: "right" });
            doc.restore();

            py += 14;
            drawHrWithin(productsX + 10, productsW - 20, py, C.line);
            py += 8;

            items.forEach((it, idx) => {
                const title =
                    safeText(it.titleSnapshot) ||
                    safeText(`${it?.productId?.brand || ""} ${it?.productId?.model || ""}`) ||
                    "Producto";

                const qty = Number(it.quantity || 1);
                const unit = Number(it.price || 0);
                const discountPercent = Number(it.discount_percentaje || 0);
                const discText = discountPercent > 0 ? `${discountPercent}%` : "—";
                const lineTotal = Number(it.total || unit * qty);

                if (idx > 0) drawHrWithin(productsX + 10, productsW - 20, py - 6, C.softLine);

                doc.save().font("Helvetica").fontSize(9.8).fillColor(C.text);

                doc.text(title, col.desc.x, py, { width: col.desc.w, ellipsis: true });
                doc.text(String(qty), col.cant.x, py, { width: col.cant.w, align: "right" });
                doc.text(money(unit), col.precio.x, py, { width: col.precio.w, align: "right" });

                doc
                    .fillColor(discountPercent > 0 ? C.red : C.muted)
                    .text(discText, col.dto.x, py, { width: col.dto.w, align: "right" });

                doc.fillColor(C.text).text(money(lineTotal), col.total.x, py, {
                    width: col.total.w,
                    align: "right",
                });

                doc.restore();
                py += rowH;
            });

            cursorY = productsY + productsH + 18;

            // =========================
            // Desglose de precio (FULL WIDTH)  ✅ renombrado
            // =========================
            const desgloseX = left;
            const desgloseY = cursorY;
            const desgloseW = contentW;
            const desgloseHeaderH = 30;
            const desgloseRowH = 22;

            const desgloseRows = [
                ["Subtotal", money(purchase?.subtotalList ?? 0)],
                ["Descuentos", `-${money(purchase?.discountTotal ?? 0)}`],
                ["Envío", Number(purchase?.shipping || 0) === 0 ? "Gratis" : money(purchase?.shipping)],
            ];

            const desgloseH = desgloseHeaderH + desgloseRows.length * desgloseRowH + 14;

            drawTableBox(desgloseX, desgloseY, desgloseW, desgloseH);
            fillSoftBlue(desgloseX, desgloseY, desgloseW, desgloseHeaderH);

            doc
                .save()
                .font("Helvetica-Bold")
                .fontSize(11)
                .fillColor(C.blue)
                .text("Desglose de precio", desgloseX + 12, desgloseY + 9, { width: desgloseW - 24 })
                .restore();

            let sy = desgloseY + desgloseHeaderH + 6;

            desgloseRows.forEach(([k, v], idx) => {
                if (idx > 0) drawHrWithin(desgloseX + 10, desgloseW - 20, sy - 6, C.softLine);

                doc.save().font("Helvetica").fontSize(10);

                doc.fillColor(C.muted).text(k, desgloseX + 12, sy, { width: 110, align: "left" });

                doc
                    .fillColor(k === "Descuentos" ? C.red : C.text)
                    .text(v, desgloseX + 12, sy, { width: desgloseW - 24, align: "right" });

                doc.restore();
                sy += desgloseRowH;
            });

            cursorY = desgloseY + desgloseH + 18;

            // =========================
            // TOTAL final (FULL WIDTH)
            // =========================
            const totalX = left;
            const totalY = cursorY;
            const totalW = contentW;
            const totalH = 46;

            drawTableBox(totalX, totalY, totalW, totalH);
            fillSoftBlue(totalX, totalY, totalW, totalH);

            doc
                .save()
                .font("Helvetica-Bold")
                .fontSize(12)
                .fillColor(C.blue)
                .text("TOTAL", totalX + 12, totalY + 14, { width: 120, align: "left" })
                .restore();

            doc
                .save()
                .font("Helvetica-Bold")
                .fontSize(14)
                .fillColor(C.text)
                .text(money(purchase?.total ?? 0), totalX + 12, totalY + 12, {
                    width: totalW - 24,
                    align: "right",
                })
                .restore();

            cursorY = totalY + totalH + 16;

            // Footer
            drawHrFull(cursorY, C.line);
            cursorY += 10;

            doc
                .save()
                .font("Helvetica")
                .fontSize(9)
                .fillColor(C.muted)
                .text("Gracias por tu compra en TechZone.", left, cursorY, {
                    width: contentW,
                    align: "center",
                })
                .restore();

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { buildInvoicePdfBuffer };
