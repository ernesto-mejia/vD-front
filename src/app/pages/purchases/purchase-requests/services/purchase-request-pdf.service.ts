import { Injectable } from '@angular/core';
import { PurchaseRequest } from '../purchase-requests';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Utilidad para generar QR simple usando Canvas
// No requiere librerías adicionales - genera un código QR básico

@Injectable({
  providedIn: 'root'
})
export class PurchaseRequestPdfService {

  private readonly COMPANY_NAME = 'EPICA Labs';
  private readonly COMPANY_LOGO_URL = 'assets/images/logo.png';

  constructor() {}

  /**
   * Genera PDF de solicitud de compra con QR
   */
  async generatePurchaseRequestPdf(request: PurchaseRequest): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Configuración de fuentes
    doc.setFont('helvetica');

    // === HEADER ===
    await this.addHeader(doc, request, pageWidth, margin);

    // === INFORMACIÓN GENERAL ===
    this.addGeneralInfo(doc, request, margin);

    // === TABLA DE ITEMS ===
    this.addItemsTable(doc, request, margin);

    // === TOTALES ===
    const finalY = this.addTotals(doc, request, margin);

    // === QR CODE ===
    await this.addQRCode(doc, request, pageWidth, margin, finalY);

    // === FIRMAS ===
    this.addSignatures(doc, request, pageWidth, margin);

    // === FOOTER ===
    this.addFooter(doc, pageWidth);

    // Guardar
    const fileName = `solicitud_compra_${request.request_number}.pdf`;
    doc.save(fileName);
  }

  /**
   * Genera PDF de orden de compra con QR
   */
  async generatePurchaseOrderPdf(request: PurchaseRequest): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    doc.setFont('helvetica');

    // Header con título de Orden de Compra
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDEN DE COMPRA', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`No. ${request.purchase_order_number || request.request_number}`, pageWidth / 2, 28, { align: 'center' });

    // Fecha de la orden
    const orderDate = request.purchase_order_date
      ? new Date(request.purchase_order_date).toLocaleDateString('es-MX')
      : new Date().toLocaleDateString('es-MX');
    doc.text(`Fecha: ${orderDate}`, pageWidth / 2, 35, { align: 'center' });

    // Información del proveedor
    let yPos = 50;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PROVEEDOR:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(request.provider?.company || request.provider?.shortname || 'Por definir', margin + 35, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('RFC:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(request.provider?.rfc || 'N/A', margin + 35, yPos);

    // Información de entrega
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('ENTREGAR EN:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const destination = request.manual_destination || request.delivery_address?.full_address || 'Por confirmar';
    doc.text(destination, margin + 35, yPos);

    // Tabla de items
    yPos += 15;
    this.addItemsTableForPO(doc, request, margin, yPos);

    // Totales
    const tableY = (doc as any).lastAutoTable?.finalY || yPos + 50;
    this.addTotalsForPO(doc, request, margin, tableY);

    // QR
    const totalsY = tableY + 50;
    await this.addQRCodeForPO(doc, request, pageWidth, margin, totalsY);

    // Firmas
    this.addSignaturesForPO(doc, request, pageWidth, margin);

    // Footer
    this.addFooter(doc, pageWidth);

    // Guardar
    const fileName = `orden_compra_${request.purchase_order_number || request.request_number}.pdf`;
    doc.save(fileName);
  }

  // ============== MÉTODOS PRIVADOS ==============

  private async addHeader(doc: jsPDF, request: PurchaseRequest, pageWidth: number, margin: number): Promise<void> {
    // Logo (opcional - intentar cargar)
    try {
      // En producción, cargar logo real
      // const logoData = await this.loadImage(this.COMPANY_LOGO_URL);
      // doc.addImage(logoData, 'PNG', margin, 10, 30, 15);
    } catch (e) {
      // Si no hay logo, continuar sin él
    }

    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SOLICITUD DE COMPRA', pageWidth / 2, 15, { align: 'center' });

    // Número de solicitud
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`No. ${request.request_number}`, pageWidth / 2, 22, { align: 'center' });

    // Estado
    const statusColor = this.getStatusColor(request.status?.code || '');
    doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
    doc.setFontSize(10);
    doc.text(`Estado: ${request.status?.name || 'Desconocido'}`, pageWidth / 2, 28, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Reset color

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 32, pageWidth - margin, 32);
  }

  private addGeneralInfo(doc: jsPDF, request: PurchaseRequest, margin: number): void {
    const leftCol = margin;
    const leftValueCol = margin + 40; // Columna para valores de la izquierda
    const rightCol = 110;
    const rightValueCol = rightCol + 30; // Columna para valores de la derecha
    let yPos = 40;
    const lineHeight = 8;

    doc.setFontSize(10);

    // === COLUMNA IZQUIERDA ===
    // Título
    doc.setFont('helvetica', 'bold');
    doc.text('Título:', leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    const titleText = request.title || 'N/A';
    doc.text(titleText.substring(0, 35), leftValueCol, yPos);

    // Solicitante
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('Solicitante:', leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(request.requester?.user_name || request.requester?.email || 'N/A', leftValueCol, yPos);

    // Fecha Solicitud
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha Solicitud:', leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    const requestDate = request.request_date
      ? new Date(request.request_date).toLocaleDateString('es-MX')
      : 'N/A';
    doc.text(requestDate, leftValueCol, yPos);

    // Fecha Requerida
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha Requerida:', leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    const requiredDate = request.required_date
      ? new Date(request.required_date).toLocaleDateString('es-MX')
      : 'N/A';
    doc.text(requiredDate, leftValueCol, yPos);

    // Prioridad
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('Prioridad:', leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(this.translatePriority(request.priority || 'normal'), leftValueCol, yPos);

    // === COLUMNA DERECHA ===
    yPos = 40; // Reset para columna derecha

    // Proveedor
    doc.setFont('helvetica', 'bold');
    doc.text('Proveedor:', rightCol, yPos);
    doc.setFont('helvetica', 'normal');
    const providerName = request.provider?.company || request.provider?.shortname || 'Por definir';
    doc.text(providerName.substring(0, 25), rightValueCol, yPos);

    // Destino
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('Destino:', rightCol, yPos);
    doc.setFont('helvetica', 'normal');
    const destination = request.destination_area?.name || request.manual_destination || 'N/A';
    doc.text(destination.substring(0, 25), rightValueCol, yPos);

    // Descripción (debajo de ambas columnas)
    if (request.description) {
      yPos = 40 + (lineHeight * 5) + 5; // Después de los 5 campos
      doc.setFont('helvetica', 'bold');
      doc.text('Descripción:', leftCol, yPos);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(request.description, 170);
      doc.text(descLines.slice(0, 2), leftValueCol, yPos);
    }
  }

  private addItemsTable(doc: jsPDF, request: PurchaseRequest, margin: number): void {
    const items = request.items || [];

    const tableData = items.map((item, index) => [
      (index + 1).toString(),
      item.item_name || 'N/A',
      item.quantity?.toString() || '0',
      item.unit_of_measurement || 'PZA',
      this.formatCurrency(item.unit_price || 0),
      this.formatCurrency(item.line_subtotal || 0)
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['#', 'Descripción', 'Cantidad', 'Unidad', 'P. Unitario', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });
  }

  private addTotals(doc: jsPDF, request: PurchaseRequest, margin: number): number {
    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    const rightAlign = 195;
    let yPos = finalY + 10;

    doc.setFontSize(10);

    // Subtotal
    doc.text('Subtotal:', rightAlign - 50, yPos);
    doc.text(this.formatCurrency(request.subtotal || 0), rightAlign, yPos, { align: 'right' });

    // IVA
    if (request.vat_amount && request.vat_amount > 0) {
      yPos += 6;
      doc.text(`IVA (${(request.vat_rate || 16)}%):`, rightAlign - 50, yPos);
      doc.text(this.formatCurrency(request.vat_amount), rightAlign, yPos, { align: 'right' });
    }

    // Retención IVA
    if (request.vat_retention_amount && request.vat_retention_amount > 0) {
      yPos += 6;
      doc.text('Ret. IVA:', rightAlign - 50, yPos);
      doc.text(`-${this.formatCurrency(request.vat_retention_amount)}`, rightAlign, yPos, { align: 'right' });
    }

    // Retención ISR
    if (request.isr_retention_amount && request.isr_retention_amount > 0) {
      yPos += 6;
      doc.text('Ret. ISR:', rightAlign - 50, yPos);
      doc.text(`-${this.formatCurrency(request.isr_retention_amount)}`, rightAlign, yPos, { align: 'right' });
    }

    // Total
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', rightAlign - 50, yPos);
    doc.text(this.formatCurrency(request.total || 0), rightAlign, yPos, { align: 'right' });

    // Moneda
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Moneda: ${request.currency || 'MXN'}`, rightAlign - 50, yPos + 5);

    return yPos;
  }

  private async addQRCode(doc: jsPDF, request: PurchaseRequest, pageWidth: number, margin: number, startY: number): Promise<void> {
    try {
      // Datos para el QR - creamos una URL de verificación
      const verificationData = `PR:${request.request_number}|D:${request.request_date}|T:${request.total}|S:${request.status?.code}`;

      // Usamos QR Code API gratuita de Google Charts
      const qrApiUrl = `https://chart.googleapis.com/chart?cht=qr&chs=150x150&chl=${encodeURIComponent(verificationData)}&choe=UTF-8`;

      // Cargar imagen QR
      const qrDataUrl = await this.loadImageAsDataUrl(qrApiUrl);

      if (qrDataUrl) {
        // Agregar QR al PDF
        const qrY = startY + 15;
        doc.addImage(qrDataUrl, 'PNG', margin, qrY, 25, 25);

        // Texto debajo del QR
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text('Escanear para verificar', margin, qrY + 28);
      } else {
        // Fallback: mostrar datos de verificación como texto
        this.addVerificationText(doc, request, margin, startY + 15);
      }

    } catch (error) {
      console.error('Error generando QR:', error);
      // Fallback
      this.addVerificationText(doc, request, margin, startY + 15);
    }
  }

  private addSignatures(doc: jsPDF, request: PurchaseRequest, pageWidth: number, margin: number): void {
    const signatureY = 250;
    const signatureWidth = 50;
    const gap = 20;

    doc.setDrawColor(0, 0, 0);
    doc.setFontSize(8);

    // Firma 1: Solicitante
    const sig1X = margin + 10;
    doc.line(sig1X, signatureY, sig1X + signatureWidth, signatureY);
    doc.text('Solicitó', sig1X + 15, signatureY + 5);
    doc.text(request.requester?.user_name || '', sig1X, signatureY + 10);

    // Firma 2: Pre-autorizó
    const sig2X = sig1X + signatureWidth + gap;
    doc.line(sig2X, signatureY, sig2X + signatureWidth, signatureY);
    doc.text('Pre-autorizó', sig2X + 12, signatureY + 5);
    if (request.pre_authorized_by_user) {
      doc.text(request.pre_authorized_by_user.user_name || '', sig2X, signatureY + 10);
    }

    // Firma 3: Autorizó
    const sig3X = sig2X + signatureWidth + gap;
    doc.line(sig3X, signatureY, sig3X + signatureWidth, signatureY);
    doc.text('Autorizó', sig3X + 15, signatureY + 5);
    if (request.approver) {
      doc.text(request.approver.user_name || '', sig3X, signatureY + 10);
    }
  }

  private addFooter(doc: jsPDF, pageWidth: number): void {
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generado el ${new Date().toLocaleString('es-MX')} | ${this.COMPANY_NAME}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  }

  // Métodos auxiliares para Orden de Compra
  private addItemsTableForPO(doc: jsPDF, request: PurchaseRequest, margin: number, startY: number): void {
    const items = request.items || [];

    const tableData = items.map((item, index) => [
      (index + 1).toString(),
      item.item_code || '-',
      item.item_name || 'N/A',
      item.quantity?.toString() || '0',
      item.unit_of_measurement || 'PZA',
      this.formatCurrency(item.unit_price || 0),
      this.formatCurrency(item.line_subtotal || 0)
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['#', 'Código', 'Descripción', 'Cant.', 'Unidad', 'P. Unit.', 'Importe']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [46, 134, 193],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 60 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });
  }

  private addTotalsForPO(doc: jsPDF, request: PurchaseRequest, margin: number, startY: number): void {
    const rightAlign = 195;
    let yPos = startY + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text('Subtotal:', rightAlign - 50, yPos);
    doc.text(this.formatCurrency(request.subtotal || 0), rightAlign, yPos, { align: 'right' });

    if (request.vat_amount) {
      yPos += 6;
      doc.text('IVA:', rightAlign - 50, yPos);
      doc.text(this.formatCurrency(request.vat_amount), rightAlign, yPos, { align: 'right' });
    }

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', rightAlign - 50, yPos);
    doc.text(this.formatCurrency(request.total || 0), rightAlign, yPos, { align: 'right' });
  }

  private async addQRCodeForPO(doc: jsPDF, request: PurchaseRequest, pageWidth: number, margin: number, startY: number): Promise<void> {
    try {
      const verificationData = `PO:${request.purchase_order_number || request.request_number}|D:${request.purchase_order_date || request.request_date}|P:${request.provider?.company || 'N/A'}|T:${request.total}`;

      // Usamos QR Code API gratuita de Google Charts
      const qrApiUrl = `https://chart.googleapis.com/chart?cht=qr&chs=150x150&chl=${encodeURIComponent(verificationData)}&choe=UTF-8`;

      const qrDataUrl = await this.loadImageAsDataUrl(qrApiUrl);

      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', margin, startY, 25, 25);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text('Verificar autenticidad', margin, startY + 28);
      } else {
        this.addVerificationTextPO(doc, request, margin, startY);
      }

    } catch (error) {
      console.error('Error generando QR para PO:', error);
      this.addVerificationTextPO(doc, request, margin, startY);
    }
  }

  private addSignaturesForPO(doc: jsPDF, request: PurchaseRequest, pageWidth: number, margin: number): void {
    const signatureY = 260;
    const signatureWidth = 55;
    const gap = 25;

    doc.setDrawColor(0, 0, 0);
    doc.setFontSize(8);

    // Firma Compras
    const sig1X = margin + 20;
    doc.line(sig1X, signatureY, sig1X + signatureWidth, signatureY);
    doc.text('Elaboró (Compras)', sig1X + 8, signatureY + 5);

    // Firma Autorizó
    const sig2X = sig1X + signatureWidth + gap;
    doc.line(sig2X, signatureY, sig2X + signatureWidth, signatureY);
    doc.text('Autorizó', sig2X + 18, signatureY + 5);

    // Firma Recibió (Proveedor)
    const sig3X = sig2X + signatureWidth + gap;
    doc.line(sig3X, signatureY, sig3X + signatureWidth, signatureY);
    doc.text('Recibió (Proveedor)', sig3X + 5, signatureY + 5);
  }

  // Utilidades
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  private translatePriority(priority: string): string {
    const priorities: Record<string, string> = {
      'low': 'Baja',
      'normal': 'Normal',
      'high': 'Alta',
      'urgent': 'Urgente'
    };
    return priorities[priority] || priority;
  }

  private getStatusColor(statusCode: string): { r: number; g: number; b: number } {
    const colors: Record<string, { r: number; g: number; b: number }> = {
      'draft': { r: 108, g: 117, b: 125 },
      'submitted': { r: 0, g: 123, b: 255 },
      'pre_authorized': { r: 23, g: 162, b: 184 },
      'approved': { r: 40, g: 167, b: 69 },
      'rejected': { r: 220, g: 53, b: 69 },
      'cancelled': { r: 108, g: 117, b: 125 }
    };
    return colors[statusCode] || { r: 0, g: 0, b: 0 };
  }

  /**
   * Carga una imagen desde URL y la convierte a Data URL
   */
  private loadImageAsDataUrl(url: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  /**
   * Fallback: Agrega texto de verificación en lugar de QR
   */
  private addVerificationText(doc: jsPDF, request: PurchaseRequest, x: number, y: number): void {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos de verificación:', x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`No: ${request.request_number}`, x, y + 4);
    doc.text(`Fecha: ${request.request_date}`, x, y + 8);
    doc.text(`Total: ${this.formatCurrency(request.total || 0)}`, x, y + 12);
  }

  /**
   * Fallback: Agrega texto de verificación para PO
   */
  private addVerificationTextPO(doc: jsPDF, request: PurchaseRequest, x: number, y: number): void {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos de verificación:', x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`OC: ${request.purchase_order_number || request.request_number}`, x, y + 4);
    doc.text(`Proveedor: ${request.provider?.company || 'N/A'}`, x, y + 8);
    doc.text(`Total: ${this.formatCurrency(request.total || 0)}`, x, y + 12);
  }
}
