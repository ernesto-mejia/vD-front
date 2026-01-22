import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunicationService } from '../services/communication.service';
import { ChatConversation, ChatMessage, ChatMessageCreate } from '../models/communication.model';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, SidebarComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  private communicationService = inject(CommunicationService);
  private refreshInterval: any;

  // Signals
  conversations = signal<ChatConversation[]>([]);
  selectedConversation = signal<ChatConversation | null>(null);
  messages = signal<ChatMessage[]>([]);
  hasMoreMessages = signal(false);

  loading = signal(false);
  loadingMessages = signal(false);
  sendingMessage = signal(false);

  newMessage = signal('');
  searchQuery = signal('');
  showNewChatModal = signal(false);
  showNewGroupModal = signal(false);

  // For new chat/group
  userSearchQuery = signal('');
  searchResults = signal<{ id: number; name: string; email: string }[]>([]);
  selectedUsers = signal<{ id: number; name: string; email: string }[]>([]);
  newGroupName = signal('');
  newGroupDescription = signal('');

  // Computed
  filteredConversations = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.conversations();
    return this.conversations().filter(c =>
      c.name.toLowerCase().includes(query)
    );
  });

  totalUnread = computed(() =>
    this.conversations().reduce((sum, c) => sum + c.unread_count, 0)
  );

  ngOnInit(): void {
    this.loadConversations();
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadConversations();
      if (this.selectedConversation()) {
        this.refreshMessages();
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadConversations(): void {
    this.loading.set(true);
    this.communicationService.getConversations().subscribe({
      next: (response: { success: boolean; data: ChatConversation[] }) => {
        if (response.success) {
          this.conversations.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading conversations:', error);
        this.loading.set(false);
      }
    });
  }

  selectConversation(conversation: ChatConversation): void {
    this.selectedConversation.set(conversation);
    this.messages.set([]);
    this.loadMessages(conversation.id);
    this.markAsRead(conversation);
  }

  loadMessages(conversationId: number, beforeId?: number): void {
    this.loadingMessages.set(true);
    this.communicationService.getMessages(conversationId, beforeId).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Los mensajes vienen directamente en response.data (array)
          const messages = Array.isArray(response.data) ? response.data : [];
          if (beforeId) {
            // Prepend older messages (ya vienen en orden correcto del backend)
            this.messages.update(msgs => [...messages, ...msgs]);
          } else {
            this.messages.set(messages);
            this.scrollToBottom();
          }
          // has_more está en el nivel raíz de la respuesta
          this.hasMoreMessages.set(response.has_more || false);
        }
        this.loadingMessages.set(false);
      },
      error: (error: any) => {
        console.error('Error loading messages:', error);
        this.loadingMessages.set(false);
      }
    });
  }

  refreshMessages(): void {
    const conv = this.selectedConversation();
    if (!conv) return;

    this.communicationService.getMessages(conv.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Los mensajes vienen directamente en response.data (array)
          const messages = Array.isArray(response.data) ? response.data : [];
          const currentIds = new Set(this.messages().map(m => m.id));
          const newMessages = messages.filter((m: ChatMessage) => !currentIds.has(m.id));
          if (newMessages.length > 0) {
            this.messages.update(msgs => [...msgs, ...newMessages]);
            this.scrollToBottom();
          }
        }
      }
    });
  }

  loadMoreMessages(): void {
    const conv = this.selectedConversation();
    const firstMessage = this.messages()[0];
    if (!conv || !firstMessage) return;

    this.loadMessages(conv.id, firstMessage.id);
  }

  markAsRead(conversation: ChatConversation): void {
    if (conversation.unread_count === 0) return;

    this.communicationService.markConversationAsRead(conversation.id).subscribe({
      next: () => {
        this.conversations.update(convs =>
          convs.map(c =>
            c.id === conversation.id ? { ...c, unread_count: 0 } : c
          )
        );
      }
    });
  }

  sendMessage(): void {
    const conv = this.selectedConversation();
    const content = this.newMessage().trim();
    if (!conv || !content) return;

    this.sendingMessage.set(true);
    const messageData: ChatMessageCreate = {
      content,
      type: 'text'
    };

    this.communicationService.sendMessage(conv.id, messageData).subscribe({
      next: (response: { success: boolean; data: ChatMessage }) => {
        if (response.success) {
          this.messages.update(msgs => [...msgs, response.data]);
          this.newMessage.set('');
          this.scrollToBottom();

          // Update conversation in list
          this.conversations.update(convs =>
            convs.map(c =>
              c.id === conv.id
                ? { ...c, latest_message: { ...response.data, sender_name: 'Tú' } as any, latest_message_at: response.data.created_at }
                : c
            ).sort((a, b) =>
              new Date(b.latest_message_at || 0).getTime() - new Date(a.latest_message_at || 0).getTime()
            )
          );
        }
        this.sendingMessage.set(false);
      },
      error: (error: any) => {
        console.error('Error sending message:', error);
        this.sendingMessage.set(false);
        Swal.fire('Error', 'No se pudo enviar el mensaje', 'error');
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }

  // New conversation methods
  openNewChatModal(): void {
    this.selectedUsers.set([]);
    this.userSearchQuery.set('');
    this.searchResults.set([]);
    this.showNewChatModal.set(true);
  }

  openNewGroupModal(): void {
    this.selectedUsers.set([]);
    this.userSearchQuery.set('');
    this.searchResults.set([]);
    this.newGroupName.set('');
    this.newGroupDescription.set('');
    this.showNewGroupModal.set(true);
  }

  closeModals(): void {
    this.showNewChatModal.set(false);
    this.showNewGroupModal.set(false);
  }

  searchUsers(): void {
    const query = this.userSearchQuery();
    if (query.length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.communicationService.searchUsers(query).subscribe({
      next: (response: { success: boolean; data: { id: number; name: string; email: string }[] }) => {
        if (response.success) {
          // Filter out already selected users
          const selectedIds = new Set(this.selectedUsers().map(u => u.id));
          this.searchResults.set(response.data.filter(u => !selectedIds.has(u.id)));
        }
      }
    });
  }

  selectUser(user: { id: number; name: string; email: string }): void {
    this.selectedUsers.update(users => [...users, user]);
    this.searchResults.update(results => results.filter(r => r.id !== user.id));
    this.userSearchQuery.set('');

    // For direct chat, start immediately
    if (this.showNewChatModal() && this.selectedUsers().length === 1) {
      this.startDirectChat();
    }
  }

  removeSelectedUser(user: { id: number; name: string; email: string }): void {
    this.selectedUsers.update(users => users.filter(u => u.id !== user.id));
  }

  startDirectChat(): void {
    const users = this.selectedUsers();
    if (users.length !== 1) return;

    this.loading.set(true);
    this.communicationService.createConversation({
      type: 'direct',
      participant_ids: [users[0].id]
    }).subscribe({
      next: (response: { success: boolean; data: ChatConversation }) => {
        if (response.success) {
          this.closeModals();
          this.loadConversations();
          this.selectConversation(response.data);
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error creating conversation:', error);
        this.loading.set(false);
        Swal.fire('Error', 'No se pudo iniciar la conversación', 'error');
      }
    });
  }

  createGroup(): void {
    const users = this.selectedUsers();
    const name = this.newGroupName().trim();
    if (users.length === 0 || !name) {
      Swal.fire('Aviso', 'Ingrese un nombre y seleccione al menos un participante', 'warning');
      return;
    }

    this.loading.set(true);
    this.communicationService.createConversation({
      type: 'group',
      name,
      description: this.newGroupDescription() || undefined,
      participant_ids: users.map(u => u.id)
    }).subscribe({
      next: (response: { success: boolean; data: ChatConversation }) => {
        if (response.success) {
          this.closeModals();
          this.loadConversations();
          this.selectConversation(response.data);
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error creating group:', error);
        this.loading.set(false);
        Swal.fire('Error', 'No se pudo crear el grupo', 'error');
      }
    });
  }

  getConversationAvatar(conversation: ChatConversation): string {
    if (conversation.type === 'group') {
      return 'bi-people-fill';
    }
    return 'bi-person-circle';
  }

  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ayer';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    }
  }
}
