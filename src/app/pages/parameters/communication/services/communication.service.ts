import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { notificationEndpoint } from '../../../../shared/api-endpoint.util';
import {
  EmailConfiguration,
  EmailConfigurationCreate,
  Announcement,
  AnnouncementCreate,
  ChatConversation,
  ChatMessage,
  ChatMessageCreate,
  CreateConversationRequest,
  UserNotificationPreferences
} from '../models/communication.model';

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private getBaseUrl(): string {
    return notificationEndpoint('organizational-structure');
  }

  constructor(private http: HttpClient) {}

  // ==================== EMAIL CONFIGURATIONS ====================

  getEmailConfigurations(): Observable<{ success: boolean; data: EmailConfiguration[] }> {
    return this.http.get<{ success: boolean; data: EmailConfiguration[] }>(
      `${this.getBaseUrl()}/email-configurations`
    );
  }

  getEmailConfiguration(id: number): Observable<{ success: boolean; data: EmailConfiguration }> {
    return this.http.get<{ success: boolean; data: EmailConfiguration }>(
      `${this.getBaseUrl()}/email-configurations/${id}`
    );
  }

  getActiveEmailConfiguration(): Observable<{ success: boolean; data: EmailConfiguration | null }> {
    return this.http.get<{ success: boolean; data: EmailConfiguration | null }>(
      `${this.getBaseUrl()}/email-configurations/active`
    );
  }

  createEmailConfiguration(data: EmailConfigurationCreate): Observable<{ success: boolean; data: EmailConfiguration; message: string }> {
    return this.http.post<{ success: boolean; data: EmailConfiguration; message: string }>(
      `${this.getBaseUrl()}/email-configurations`,
      data
    );
  }

  updateEmailConfiguration(id: number, data: Partial<EmailConfigurationCreate>): Observable<{ success: boolean; data: EmailConfiguration; message: string }> {
    return this.http.put<{ success: boolean; data: EmailConfiguration; message: string }>(
      `${this.getBaseUrl()}/email-configurations/${id}`,
      data
    );
  }

  deleteEmailConfiguration(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.getBaseUrl()}/email-configurations/${id}`
    );
  }

  testEmailConfiguration(id: number, email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.getBaseUrl()}/email-configurations/${id}/test`,
      { email }
    );
  }

  setDefaultEmailConfiguration(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.getBaseUrl()}/email-configurations/${id}/set-default`,
      {}
    );
  }

  // ==================== ANNOUNCEMENTS ====================

  getAnnouncements(): Observable<{ success: boolean; data: Announcement[] }> {
    return this.http.get<{ success: boolean; data: Announcement[] }>(
      `${this.getBaseUrl()}/announcements`
    );
  }

  getAnnouncement(id: number): Observable<{ success: boolean; data: Announcement }> {
    return this.http.get<{ success: boolean; data: Announcement }>(
      `${this.getBaseUrl()}/announcements/${id}`
    );
  }

  getModalAnnouncements(): Observable<{ success: boolean; data: Announcement[] }> {
    return this.http.get<{ success: boolean; data: Announcement[] }>(
      `${this.getBaseUrl()}/announcements/modal`
    );
  }

  getUnreadAnnouncementsCount(): Observable<{ success: boolean; data: { count: number } }> {
    return this.http.get<{ success: boolean; data: { count: number } }>(
      `${this.getBaseUrl()}/announcements/unread-count`
    );
  }

  getAdminAnnouncements(filters?: { status?: string; type?: string; search?: string }): Observable<{
    success: boolean;
    data: {
      data: Announcement[];
      current_page: number;
      last_page: number;
      total: number;
    }
  }> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<any>(`${this.getBaseUrl()}/announcements/admin/list`, { params });
  }

  createAnnouncement(data: AnnouncementCreate): Observable<{ success: boolean; data: Announcement; message: string }> {
    return this.http.post<{ success: boolean; data: Announcement; message: string }>(
      `${this.getBaseUrl()}/announcements`,
      data
    );
  }

  updateAnnouncement(id: number, data: Partial<AnnouncementCreate>): Observable<{ success: boolean; data: Announcement; message: string }> {
    return this.http.put<{ success: boolean; data: Announcement; message: string }>(
      `${this.getBaseUrl()}/announcements/${id}`,
      data
    );
  }

  deleteAnnouncement(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.getBaseUrl()}/announcements/${id}`
    );
  }

  acknowledgeAnnouncement(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.getBaseUrl()}/announcements/${id}/acknowledge`,
      {}
    );
  }

  // ==================== CHAT ====================

  getConversations(search?: string): Observable<{ success: boolean; data: ChatConversation[] }> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<{ success: boolean; data: ChatConversation[] }>(
      `${this.getBaseUrl()}/chat/conversations`,
      { params }
    );
  }

  createConversation(data: CreateConversationRequest): Observable<{ success: boolean; data: ChatConversation; message: string }> {
    return this.http.post<{ success: boolean; data: ChatConversation; message: string }>(
      `${this.getBaseUrl()}/chat/conversations`,
      data
    );
  }

  getMessages(conversationId: number, beforeId?: number): Observable<{
    success: boolean;
    data: {
      messages: ChatMessage[];
      has_more: boolean;
    }
  }> {
    let params = new HttpParams();
    if (beforeId) params = params.set('before_id', beforeId.toString());

    return this.http.get<any>(
      `${this.getBaseUrl()}/chat/conversations/${conversationId}/messages`,
      { params }
    );
  }

  sendMessage(conversationId: number, data: ChatMessageCreate): Observable<{ success: boolean; data: ChatMessage; message: string }> {
    return this.http.post<{ success: boolean; data: ChatMessage; message: string }>(
      `${this.getBaseUrl()}/chat/conversations/${conversationId}/messages`,
      data
    );
  }

  editMessage(messageId: number, content: string): Observable<{ success: boolean; data: ChatMessage; message: string }> {
    return this.http.put<{ success: boolean; data: ChatMessage; message: string }>(
      `${this.getBaseUrl()}/chat/messages/${messageId}`,
      { content }
    );
  }

  deleteMessage(messageId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.getBaseUrl()}/chat/messages/${messageId}`
    );
  }

  markConversationAsRead(conversationId: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.getBaseUrl()}/chat/conversations/${conversationId}/read`,
      {}
    );
  }

  getUnreadMessagesCount(): Observable<{ success: boolean; data: { count: number } }> {
    return this.http.get<{ success: boolean; data: { count: number } }>(
      `${this.getBaseUrl()}/chat/unread-count`
    );
  }

  addParticipants(conversationId: number, userIds: number[]): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.getBaseUrl()}/chat/conversations/${conversationId}/participants`,
      { user_ids: userIds }
    );
  }

  removeParticipant(conversationId: number, userId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.getBaseUrl()}/chat/conversations/${conversationId}/participants/${userId}`
    );
  }

  searchUsers(query: string): Observable<{ success: boolean; data: { id: number; name: string; email: string }[] }> {
    return this.http.get<any>(
      `${this.getBaseUrl()}/chat/users/search`,
      { params: { q: query } }
    );
  }
}
