import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommunicationService } from '../services/communication.service';
import {
  EmailConfiguration,
  EmailProvider,
  EncryptionType,
  EMAIL_PROVIDERS,
  ENCRYPTION_TYPES
} from '../models/communication.model';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-email-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './email-configuration.component.html',
  styleUrls: ['./email-configuration.component.scss']
})
export class EmailConfigurationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private communicationService = inject(CommunicationService);

  // Signals
  configurations = signal<EmailConfiguration[]>([]);
  loading = signal(false);
  showModal = signal(false);
  editingId = signal<number | null>(null);
  testingId = signal<number | null>(null);
  testEmail = signal('');

  // Form
  form!: FormGroup;

  // Constants
  readonly providers = EMAIL_PROVIDERS;
  readonly encryptionTypes = ENCRYPTION_TYPES;

  // Computed
  isEditing = computed(() => this.editingId() !== null);
  modalTitle = computed(() => this.isEditing() ? 'Editar Configuración' : 'Nueva Configuración');

  selectedProvider = computed(() => this.form?.get('provider')?.value as EmailProvider);
  needsSmtpFields = computed(() => this.selectedProvider() === 'smtp');
  needsApiKey = computed(() => ['sendgrid', 'mailgun', 'ses', 'postmark'].includes(this.selectedProvider()));
  needsApiDomain = computed(() => this.selectedProvider() === 'mailgun');
  needsApiRegion = computed(() => ['ses', 'mailgun'].includes(this.selectedProvider()));

  ngOnInit(): void {
    this.initForm();
    this.loadConfigurations();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      provider: ['smtp', Validators.required],
      host: [''],
      port: [587],
      encryption: ['tls'],
      username: [''],
      password: [''],
      from_address: ['', [Validators.required, Validators.email]],
      from_name: ['', Validators.required],
      reply_to: ['', Validators.email],
      api_key: [''],
      api_domain: [''],
      api_region: ['us-east-1'],
      is_active: [true]
    });

    // Dynamic validation based on provider
    this.form.get('provider')?.valueChanges.subscribe((provider: EmailProvider) => {
      this.updateValidators(provider);
    });
  }

  private updateValidators(provider: EmailProvider): void {
    const hostControl = this.form.get('host');
    const portControl = this.form.get('port');
    const usernameControl = this.form.get('username');
    const apiKeyControl = this.form.get('api_key');
    const apiDomainControl = this.form.get('api_domain');

    // Reset validators
    hostControl?.clearValidators();
    portControl?.clearValidators();
    usernameControl?.clearValidators();
    apiKeyControl?.clearValidators();
    apiDomainControl?.clearValidators();

    if (provider === 'smtp') {
      hostControl?.setValidators([Validators.required]);
      portControl?.setValidators([Validators.required, Validators.min(1), Validators.max(65535)]);
      usernameControl?.setValidators([Validators.required]);
    } else {
      apiKeyControl?.setValidators([Validators.required]);
      if (provider === 'mailgun') {
        apiDomainControl?.setValidators([Validators.required]);
      }
    }

    // Update validity
    hostControl?.updateValueAndValidity();
    portControl?.updateValueAndValidity();
    usernameControl?.updateValueAndValidity();
    apiKeyControl?.updateValueAndValidity();
    apiDomainControl?.updateValueAndValidity();
  }

  loadConfigurations(): void {
    this.loading.set(true);
    this.communicationService.getEmailConfigurations().subscribe({
      next: (response: { success: boolean; data: EmailConfiguration[] }) => {
        if (response.success) {
          this.configurations.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading configurations:', error);
        this.loading.set(false);
        Swal.fire('Error', 'No se pudieron cargar las configuraciones', 'error');
      }
    });
  }

  openCreateModal(): void {
    this.editingId.set(null);
    this.form.reset({
      provider: 'smtp',
      port: 587,
      encryption: 'tls',
      api_region: 'us-east-1',
      is_active: true
    });
    this.updateValidators('smtp');
    this.showModal.set(true);
  }

  openEditModal(config: EmailConfiguration): void {
    this.editingId.set(config.id);
    this.form.patchValue({
      name: config.name,
      provider: config.provider,
      host: config.host || '',
      port: config.port || 587,
      encryption: config.encryption || 'tls',
      username: config.username || '',
      password: '', // Don't populate password
      from_address: config.from_address,
      from_name: config.from_name,
      reply_to: config.reply_to || '',
      api_key: '', // Don't populate API key
      api_domain: config.api_domain || '',
      api_region: config.api_region || 'us-east-1',
      is_active: config.is_active
    });
    this.updateValidators(config.provider);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    const data = this.form.value;
    this.loading.set(true);

    // Remove empty optional fields
    if (!data.password) delete data.password;
    if (!data.api_key) delete data.api_key;
    if (!data.reply_to) delete data.reply_to;

    const request$ = this.isEditing()
      ? this.communicationService.updateEmailConfiguration(this.editingId()!, data)
      : this.communicationService.createEmailConfiguration(data);

    request$.subscribe({
      next: (response: { success: boolean; message: string }) => {
        if (response.success) {
          Swal.fire('Éxito', response.message, 'success');
          this.closeModal();
          this.loadConfigurations();
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error saving configuration:', error);
        this.loading.set(false);
        Swal.fire('Error', error.error?.message || 'No se pudo guardar la configuración', 'error');
      }
    });
  }

  delete(config: EmailConfiguration): void {
    if (config.is_default) {
      Swal.fire('Aviso', 'No se puede eliminar la configuración predeterminada', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Eliminar configuración?',
      text: `¿Está seguro de eliminar "${config.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.loading.set(true);
        this.communicationService.deleteEmailConfiguration(config.id).subscribe({
          next: (response: { success: boolean; message: string }) => {
            if (response.success) {
              Swal.fire('Eliminado', response.message, 'success');
              this.loadConfigurations();
            }
            this.loading.set(false);
          },
          error: (error: any) => {
            console.error('Error deleting configuration:', error);
            this.loading.set(false);
            Swal.fire('Error', 'No se pudo eliminar la configuración', 'error');
          }
        });
      }
    });
  }

  setAsDefault(config: EmailConfiguration): void {
    if (config.is_default) return;

    Swal.fire({
      title: '¿Establecer como predeterminada?',
      text: `"${config.name}" será la configuración predeterminada para envío de correos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, establecer',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.loading.set(true);
        this.communicationService.setDefaultEmailConfiguration(config.id).subscribe({
          next: (response: { success: boolean; message: string }) => {
            if (response.success) {
              Swal.fire('Éxito', response.message, 'success');
              this.loadConfigurations();
            }
            this.loading.set(false);
          },
          error: (error: any) => {
            console.error('Error setting default:', error);
            this.loading.set(false);
            Swal.fire('Error', 'No se pudo establecer como predeterminada', 'error');
          }
        });
      }
    });
  }

  openTestModal(config: EmailConfiguration): void {
    Swal.fire({
      title: 'Probar Configuración',
      text: 'Ingrese un correo electrónico para enviar un mensaje de prueba:',
      input: 'email',
      inputPlaceholder: 'correo@ejemplo.com',
      showCancelButton: true,
      confirmButtonText: 'Enviar prueba',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: (email: string) => {
        return this.communicationService.testEmailConfiguration(config.id, email).toPromise()
          .then((response: any) => {
            if (!response?.success) {
              throw new Error(response?.message || 'Error en la prueba');
            }
            return response;
          })
          .catch((error: any) => {
            Swal.showValidationMessage(error.error?.message || error.message || 'Error al enviar');
          });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Éxito', 'Correo de prueba enviado correctamente', 'success');
        this.loadConfigurations();
      }
    });
  }

  getProviderIcon(provider: EmailProvider): string {
    const icons: Record<EmailProvider, string> = {
      smtp: 'bi-envelope',
      sendgrid: 'bi-send',
      mailgun: 'bi-mailbox',
      ses: 'bi-cloud',
      postmark: 'bi-bookmark'
    };
    return icons[provider] || 'bi-envelope';
  }

  getStatusBadge(config: EmailConfiguration): { class: string; text: string } {
    if (!config.is_active) {
      return { class: 'bg-secondary', text: 'Inactivo' };
    }
    if (config.verified) {
      return { class: 'bg-success', text: 'Verificado' };
    }
    return { class: 'bg-warning text-dark', text: 'Sin verificar' };
  }
}
