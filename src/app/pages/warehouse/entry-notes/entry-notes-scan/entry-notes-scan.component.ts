import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import { EntryNote, EntryNoteItem, EntryNotesService } from '../entry-notes.service';

interface ScanPayload {
  lot: string;
  gtin: string;
  expiration_date: string;
  manufacture_date: string;
  ref: string;
  qty: number;
}

interface ScannedLotGroup {
  item: EntryNoteItem;
  lot: string;
  gtin: string;
  scanned_qty: number;
}

interface ScannedProductGroup {
  item: EntryNoteItem;
  totalScanned: number;
  lots: { lot: string; gtin: string; qty: number }[];
}

@Component({
  selector: 'app-entry-notes-scan',
  templateUrl: './entry-notes-scan.component.html',
  styleUrls: ['./entry-notes-scan.component.css'],
})
export class EntryNotesScanComponent implements OnInit, OnDestroy {
  note: EntryNote | null = null;
  pendingItems: EntryNoteItem[] = [];
  scannedItems: EntryNoteItem[] = [];
  scannedByLot: ScannedLotGroup[] = [];
  scannedByProduct: ScannedProductGroup[] = [];
  scanCode = '';
  currentItem: EntryNoteItem | null = null;
  currentScan: ScanPayload | null = null;
  assignmentMode = false;
  assignItemId: number | null = null;
  pendingAssignmentCode = '';
  scanningStarted = false;

  scannerName = localStorage.getItem('userName') || 'Usuario en sesión';
  elapsedSeconds = 0;
  private timerId: any;

  // Estados de UI
  isLoading = false;
  isProcessingScan = false;
  showMissingItemsModal = false;
  missingItemsWithObservations: { item: EntryNoteItem; observation: string }[] = [];

  constructor(
    private entryNotesService: EntryNotesService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadNote(id);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private loadNote(id: number): void {
    this.entryNotesService.getEntryNote(id).subscribe({
      next: (note) => {
        this.note = note;
        this.refreshLists();
        if (note?.status !== 'completed') {
          this.showStartScanModal();
        }
      },
      error: (error) => console.error('Error al cargar nota de entrada:', error),
    });
  }

  private showStartScanModal(): void {
    Swal.fire({
      icon: 'info',
      title: 'Iniciar escaneo',
      text: 'A partir de ahora comenzará el proceso de escaneo y el tiempo empezará a correr. ¿Desea continuar?',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar',
      cancelButtonText: 'No, regresar',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.scanningStarted = true;
        this.startTimer();
      } else {
        this.router.navigate(['/entry-notes']);
      }
    });
  }

  private refreshLists(): void {
    if (!this.note) {
      this.pendingItems = [];
      this.scannedItems = [];
      this.scannedByLot = [];
      this.scannedByProduct = [];
      return;
    }
    const previousPendingCount = this.pendingItems.length;
    this.pendingItems = this.note.items.filter(
      (item) => (item.scanned_qty || 0) < item.qty
    );
    this.scannedItems = this.note.items.filter(
      (item) => (item.scanned_qty || 0) > 0
    );
    this.updateScannedByProduct();

    // Auto-cerrar cuando todos los items están escaneados
    if (previousPendingCount > 0 && this.pendingItems.length === 0 &&
        this.scannedItems.length > 0 && this.note.status !== 'completed') {
      this.showAutoCloseModal();
    }
  }

  private updateScannedByProduct(): void {
    // Agrupar scannedByLot por producto
    const productMap = new Map<number, ScannedProductGroup>();

    for (const lotGroup of this.scannedByLot) {
      const productId = lotGroup.item.id;

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          item: lotGroup.item,
          totalScanned: 0,
          lots: []
        });
      }

      const productGroup = productMap.get(productId)!;
      productGroup.totalScanned += lotGroup.scanned_qty;
      productGroup.lots.push({
        lot: lotGroup.lot,
        gtin: lotGroup.gtin,
        qty: lotGroup.scanned_qty
      });
    }

    this.scannedByProduct = Array.from(productMap.values());
  }

  private startTimer(): void {
    this.elapsedSeconds = 0;
    this.timerId = setInterval(() => {
      this.elapsedSeconds += 1;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  get elapsedLabel(): string {
    const hours = Math.floor(this.elapsedSeconds / 3600);
    const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
    const seconds = this.elapsedSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  onScanSubmit(): void {
    const code = this.scanCode.trim();
    if (!code || !this.note || this.isProcessingScan) {
      return;
    }

    this.isProcessingScan = true;

    setTimeout(() => {
      const directMatch = this.note!.items.find(
        (item) => item.gtin === code || item.ref === code || item.name === code
      );

      if (directMatch) {
        this.setCurrentItem(directMatch, code);
        this.resetAssignment();
        this.isProcessingScan = false;
        return;
      }

      const catalogProduct = this.entryNotesService.findProductByGtin(code);
      if (catalogProduct) {
        Swal.fire({
          icon: 'warning',
          title: 'Producto fuera de orden',
          text: 'El producto escaneado no pertenece a esta orden de compra.',
        });
        this.resetScan();
        this.isProcessingScan = false;
        return;
      }

      this.assignmentMode = true;
      this.pendingAssignmentCode = code;
      this.assignItemId = null;
      this.currentItem = null;
      this.currentScan = null;
      this.isProcessingScan = false;
    }, 300);
  }

  private setCurrentItem(item: EntryNoteItem, code: string): void {
    const simulatedLot = this.buildSimulatedLot(code);
    const simulatedExpiration = this.buildSimulatedExpirationDate();
    this.currentItem = item;
    this.currentScan = {
      lot: item.lot || simulatedLot,
      gtin: item.gtin || code,
      expiration_date: item.expiration_date || simulatedExpiration,
      manufacture_date: item.manufacture_date || '',
      ref: item.ref || '',
      qty: 1,
    };
    this.scanCode = '';
  }

  addScan(): void {
    if (!this.note || !this.currentItem || !this.currentScan || this.isLoading) {
      return;
    }
    const qty = Math.max(1, Number(this.currentScan.qty || 1));
    const currentQty = this.currentItem.scanned_qty || 0;
    const newQty = currentQty + qty;

    if (newQty > this.currentItem.qty) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad excedida',
        text: 'La cantidad escaneada supera la cantidad de la orden.',
      });
      return;
    }

    this.isLoading = true;

    this.currentItem.scanned_qty = newQty;
    this.currentItem.lot = this.currentScan.lot || this.currentItem.lot;
    this.currentItem.gtin = this.currentScan.gtin || this.currentItem.gtin;
    this.currentItem.expiration_date =
      this.currentScan.expiration_date || this.currentItem.expiration_date;
    this.currentItem.manufacture_date =
      this.currentScan.manufacture_date || this.currentItem.manufacture_date;
    this.currentItem.ref = this.currentScan.ref || this.currentItem.ref;

    // Agregar o actualizar el grupo por lote
    const lot = this.currentScan.lot || 'Sin lote';
    const gtin = this.currentScan.gtin || '';
    const existingGroup = this.scannedByLot.find(
      (g) => g.item.id === this.currentItem!.id && g.lot === lot
    );

    if (existingGroup) {
      existingGroup.scanned_qty += qty;
      existingGroup.gtin = gtin;
    } else {
      this.scannedByLot.push({
        item: this.currentItem,
        lot: lot,
        gtin: gtin,
        scanned_qty: qty,
      });
    }

    this.entryNotesService.updateEntryNote(this.note).subscribe({
      next: (updated) => {
        this.note = updated;
        this.refreshLists();
        this.cleanScanForm();
        this.isLoading = false;

        Swal.fire({
          icon: 'success',
          title: 'Escaneado',
          text: `${qty} unidad(es) agregada(s)`,
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al actualizar nota:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el escaneo. Intente nuevamente.',
        });
      },
    });
  }

  assignGtinToItem(): void {
    if (!this.note || !this.pendingAssignmentCode || !this.assignItemId) {
      return;
    }
    const target = this.note.items.find((item) => item.id === this.assignItemId);
    if (!target) {
      return;
    }
    target.gtin = this.pendingAssignmentCode;
    this.setCurrentItem(target, this.pendingAssignmentCode);
    this.resetAssignment();
  }

  private buildSimulatedLot(code: string): string {
    const seed = code.replace(/\W/g, '').slice(-4).padStart(4, '0');
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `L${yy}${mm}-${seed}`;
  }

  private buildSimulatedExpirationDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 9);
    return date.toISOString().slice(0, 10);
  }

  private resetAssignment(): void {
    this.assignmentMode = false;
    this.pendingAssignmentCode = '';
    this.assignItemId = null;
  }

  private resetScan(): void {
    this.scanCode = '';
    this.currentItem = null;
    this.currentScan = null;
    this.resetAssignment();
  }

  closeEntryNote(): void {
    if (!this.note || this.scannedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay productos escaneados',
        text: 'Debe escanear al menos un producto antes de cerrar la nota.',
      });
      return;
    }

    // Si hay productos faltantes, mostrar modal
    if (this.pendingItems.length > 0) {
      this.openMissingItemsModal();
      return;
    }

    // Si todo está completo, cerrar directamente
    this.confirmAndCloseNote(false);
  }

  openMissingItemsModal(): void {
    this.missingItemsWithObservations = this.pendingItems.map(item => ({
      item,
      observation: ''
    }));
    this.showMissingItemsModal = true;
  }

  closeMissingItemsModal(): void {
    this.showMissingItemsModal = false;
    this.missingItemsWithObservations = [];
  }

  confirmMissingItems(): void {
    // Validar que todos tengan observaciones
    const hasEmptyObservations = this.missingItemsWithObservations.some(
      item => !item.observation.trim()
    );

    if (hasEmptyObservations) {
      Swal.fire({
        icon: 'warning',
        title: 'Observaciones incompletas',
        text: 'Todos los productos faltantes deben tener una observación.',
      });
      return;
    }

    // Guardar observaciones en los items
    this.missingItemsWithObservations.forEach(({ item, observation }) => {
      const noteItem = this.note?.items.find(i => i.id === item.id);
      if (noteItem) {
        noteItem.observation = observation;
      }
    });

    this.closeMissingItemsModal();

    // Confirmar cierre con status incompleto
    Swal.fire({
      icon: 'warning',
      title: 'Cerrar con productos faltantes',
      html: `<p>La nota se cerrará con <strong>status incompleto</strong> debido a productos faltantes.</p>
             <p>¿Desea continuar?</p>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffc107',
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmAndCloseNote(true);
      }
    });
  }

  private confirmAndCloseNote(isIncomplete: boolean): void {
    if (!this.note) return;

    this.isLoading = true;
    this.note.status = 'completed';
    this.note.completed_at = new Date().toISOString().slice(0, 10);

    if (isIncomplete) {
      this.note.completion_status = 'incomplete';
    }

    this.entryNotesService.updateEntryNote(this.note).subscribe({
      next: () => {
        this.stopTimer();
        this.isLoading = false;

        Swal.fire({
          icon: 'success',
          title: 'Nota cerrada',
          text: isIncomplete ?
            'La nota fue cerrada con status incompleto.' :
            'La nota de entrada fue cerrada exitosamente.',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.router.navigate(['/entry-notes']);
        });
      },
      error: (error) => {
        console.error('Error al cerrar nota:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cerrar la nota. Intente nuevamente.',
        });
      }
    });
  }

  showAutoCloseModal(): void {
    Swal.fire({
      icon: 'success',
      title: '¡Escaneo completado!',
      html: '<p>Todos los productos han sido escaneados.</p><p>¿Desea cerrar la nota de entrada?</p>',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar nota',
      cancelButtonText: 'Continuar escaneando',
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmAndCloseNote(false);
      }
    });
  }

  cancelCurrentScan(): void {
    Swal.fire({
      icon: 'question',
      title: 'Cancelar escaneo actual',
      text: '¿Desea cancelar el escaneo actual y limpiar el formulario?',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.cleanScanForm();
        Swal.fire({
          icon: 'info',
          title: 'Cancelado',
          text: 'El escaneo fue cancelado.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  cleanScanForm(): void {
    this.currentItem = null;
    this.currentScan = null;
    this.scanCode = '';
    this.resetAssignment();
  }

  goBack(): void {
    this.location.back();
  }

  goToPreview(): void {
    if (this.note) {
      this.router.navigate(['/entry-notes/preview', this.note.id]);
    }
  }
}
