import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventoService } from '../../services/evento.service';
import { UserService } from '../../services/user.service';
import { Evento } from '../../models/evento.model';
import { User } from '../../models/user.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-evento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evento.component.html',
  styleUrls: ['./evento.component.css']
})
export class EventoComponent implements OnInit {
  eventos: Evento[] = [];
  users: User[] = [];
  availableUsers: User[] = [];
  selectedUsers: User[] = [];
  newEvent: Evento = { name: '', schedule: [], address: '', participantes: [] };
  dateStr: string = '';
  timeStr: string = '';
  errorMessage = '';
  showDeleteModal = false;
  private pendingDeleteIndex: number | null = null;
  editingEventId: string | null = null;

  constructor(
    private eventoService: EventoService,
    private userService: UserService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadEventos();
  }

  /** 🔹 Carga de usuarios */
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users as any;
        this.availableUsers = [...this.users];
      }
    });
  }

  /** 🔹 Carga de eventos */
  loadEventos(): void {
    this.eventoService.getEventos().subscribe({
      next: (evts) => {
        this.eventos = evts.map(e => ({
          ...e,
          schedule: Array.isArray(e.schedule)
            ? e.schedule
            : e.schedule
            ? [e.schedule]
            : [],
          participantes: Array.isArray(e.participantes)
            ? e.participantes
            : []
        }));
      }
    });
  }

  /** 🔹 Ir atrás */
  goHome(): void {
    this.location.back();
  }

  /** 🔹 Crear horario */
  setSchedule(): void {
    this.errorMessage = '';
    if (!this.dateStr || !this.timeStr) {
      this.errorMessage = 'Selecciona fecha y hora.';
      return;
    }
    const slot = `${this.dateStr} ${this.timeStr}`;
    this.newEvent.schedule = [slot];
  }

  clearSchedule(): void {
    this.newEvent.schedule = [];
    this.dateStr = '';
    this.timeStr = '';
  }

  /** 🔹 Añadir participante */
  addParticipant(u: User): void {
    if (!u?._id) return;
    this.availableUsers = this.availableUsers.filter(x => x._id !== u._id);
    if (!this.selectedUsers.find(x => x._id === u._id)) this.selectedUsers.push(u);
    this.syncParticipantsIds();
  }

  /** 🔹 Quitar participante */
  removeParticipant(u: User): void {
    if (!u?._id) return;
    this.selectedUsers = this.selectedUsers.filter(x => x._id !== u._id);
    if (!this.availableUsers.find(x => x._id === u._id)) {
      this.availableUsers.push(u);
      this.availableUsers.sort((a, b) => a.username.localeCompare(b.username));
    }
    this.syncParticipantsIds();
  }

  private syncParticipantsIds(): void {
    this.newEvent.participantes = this.selectedUsers.map(u => u._id!).filter(Boolean);
  }

  /** 🔹 Crear evento */
  onSubmit(): void {
    this.errorMessage = '';

    if (!this.newEvent.name?.trim()) {
      this.errorMessage = 'El título del evento es obligatorio.';
      return;
    }
    if (!this.newEvent.schedule?.length) {
      this.errorMessage = 'Selecciona el horario del evento.';
      return;
    }
    if (!this.newEvent.address?.length) {
      this.errorMessage = 'Selecciona la dirección del evento.';
      return;
    }

    this.eventoService.addEvento(this.newEvent).subscribe({
      next: (created) => {
        const normalized: Evento = {
          ...created,
          schedule: Array.isArray(created.schedule)
            ? created.schedule
            : [created.schedule],
          participantes: Array.isArray(created.participantes)
            ? created.participantes
            : []
        };
        this.eventos.push(normalized);
        this.resetForm();
      },
      error: () => (this.errorMessage = 'Error al crear el evento.')
    });
  }

  /** 🔹 Eliminar evento */
  openDeleteModal(index: number): void {
    this.pendingDeleteIndex = index;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.pendingDeleteIndex = null;
  }

  confirmarEliminar(): void {
    if (this.pendingDeleteIndex == null) {
      this.closeDeleteModal();
      return;
    }
    const idx = this.pendingDeleteIndex;
    const evt = this.eventos[idx];
    if (!evt?._id) {
      this.closeDeleteModal();
      return;
    }
    this.eventoService.deleteEvento(evt._id).subscribe({
      next: () => {
        this.eventos.splice(idx, 1);
        this.closeDeleteModal();
      },
      error: () => {
        this.errorMessage = 'Error al eliminar el evento.';
        this.closeDeleteModal();
      }
    });
  }

  /** 🔹 Iniciar edición */
  startEdit(evt: Evento): void {
    this.errorMessage = '';
    this.editingEventId = evt._id ?? null;
  
    this.newEvent = {
      _id: evt._id,
      name: evt.name,
      address: evt.address,
      schedule: Array.isArray(evt.schedule) ? [...evt.schedule] : [evt.schedule],
      participantes: Array.isArray(evt.participantes)
        ? [...evt.participantes]
        : []
    };
  
    // 🔹 Abre automáticamente la sección de editar evento
    this.openSection = 'edit';
  
    // Cargar los participantes seleccionados y disponibles
    this.selectedUsers = this.users.filter(u =>
      this.newEvent.participantes?.includes(u._id!)
    );
    this.availableUsers = this.users.filter(
      u => !this.newEvent.participantes?.includes(u._id!)
    );
  
    // Extraer fecha y hora del horario
    if (this.newEvent.schedule.length > 0) {
      const [datePart, timePart] = this.newEvent.schedule[0].split(' ');
      this.dateStr = datePart;
      this.timeStr = timePart;
    }
  }
//////////////////////////////////////////EJERCICIO SEMINARI ANGULAR/////////////////////////////////
  updateEvento(): void {
    this.errorMessage = '';
  
    if (!this.editingEventId) {
      this.errorMessage = 'No hay evento seleccionado para editar.';
      return;
    }
  
    if (!this.newEvent.name?.trim() || !this.newEvent.address?.trim() || !this.newEvent.schedule?.length) {
      this.errorMessage = 'Faltan campos obligatorios.';
      return;
    }
  
    this.eventoService.updateEvento(this.editingEventId, this.newEvent).subscribe({
      next: () => {
        // ✅ Una vez actualizado, pedimos de nuevo el evento al backend
        this.eventoService.getEventoById(this.editingEventId!).subscribe({
          next: (freshEvent: Evento) => {
            // Normalizamos el evento devuelto
            const normalized: Evento = {
              ...freshEvent,
              schedule: Array.isArray(freshEvent.schedule)
                ? freshEvent.schedule
                : [freshEvent.schedule],
              participantes: Array.isArray(freshEvent.participantes)
                ? freshEvent.participantes
                : []
            };
  
            // Actualizamos el array local de eventos
            const index = this.eventos.findIndex(e => e._id === this.editingEventId);
            if (index !== -1) {
              this.eventos[index] = normalized;
            }
  
            // Recargamos usuarios para refrescar nombres
            this.loadUsers();
  
            // Reseteamos el formulario
            this.resetForm();
            this.editingEventId = null;
          },
          error: () => {
            this.errorMessage = 'Error al recargar el evento actualizado.';
          }
        });
      },
      error: () => {
        this.errorMessage = 'Error al actualizar el evento.';
      }
    });
  }
    
  /** 🔹 Cancelar edición */
  cancelEdit(): void {
    this.resetForm();
    this.editingEventId = null;
  }

  /** 🔹 Resetear formulario */
  private resetForm(): void {
    this.newEvent = { name: '', schedule: [], address: '', participantes: [] };
    this.availableUsers = [...this.users];
    this.selectedUsers = [];
    this.dateStr = '';
    this.timeStr = '';
    this.errorMessage = '';
  }

  /** 🔹 Utilidades de visualización */
  getScheduleText(e: Evento): string {
    if (Array.isArray(e.schedule) && e.schedule.length)
      return this.formatSchedule(e.schedule[0]);
    if (typeof e.schedule === 'string') return this.formatSchedule(e.schedule);
    return '-';
  }

  formatSchedule(s: string | undefined | null): string {
    if (!s) return '-';
    const sep = s.includes('T') ? 'T' : ' ';
    const [d, t = ''] = s.split(sep);
    const [y, m, d2] = d.split('-');
    const hhmm = t.slice(0, 5);
    return y && m && d2 ? `${d2}-${m}-${y} ${hhmm}` : s;
  }

  getEventAddress(e: Evento): string {
    return e?.address ?? '-';
  }

  getParticipantsNames(e: Evento): string {
    const participants = e.participantes ?? [];
    const names = participants.map(p => {
      if (typeof p === 'string') {
        return this.users.find(u => u._id === p)?.username;
      } else if (typeof p === 'object' && 'username' in p) {
        return (p as User).username;
      }
      return null;
    }).filter(Boolean);
  
    return names.length ? names.join(', ') : '-';
  }
  openSection: 'create' | 'edit' | 'list' | null = 'list';

  toggleSection(section: 'create' | 'edit' | 'list'): void {
    this.openSection = this.openSection === section ? null : section;
  }


  
}
