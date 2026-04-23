import { Invitation, EventConfig, WishMessage, ScheduleItem, GiftItem } from './types';

const INVITATIONS_KEY = 'babyshower_invitations';
const EVENT_CONFIG_KEY = 'babyshower_event_config';
const ADMIN_AUTH_KEY = 'babyshower_admin_auth';
const WISH_MESSAGES_KEY = 'babyshower_wishes';
const NAME_POLL_KEY = 'babyshower_namepoll_votes';

const defaultSchedule: ScheduleItem[] = [
  { time: '3:00 PM', event: 'Recepción y Bienvenida', icon: '👋', desc: 'Llegada de invitados' },
  { time: '3:30 PM', event: 'Juegos y Actividades', icon: '🎮', desc: 'Divertidos juegos de baby shower' },
  { time: '4:30 PM', event: 'Merienda y Postres', icon: '🍰', desc: 'Deliciosos snacks y pastel' },
  { time: '5:30 PM', event: 'Apertura de Regalos', icon: '🎁', desc: 'Momento especial' },
  { time: '6:30 PM', event: 'Foto Grupal', icon: '📸', desc: 'Capturando recuerdos' },
];

const defaultGifts: GiftItem[] = [
  { name: 'Ropita de bebé', icon: '👶', claimed: false },
  { name: 'Pañales', icon: '🧷', claimed: false },
  { name: 'Biberones', icon: '🍼', claimed: false },
  { name: 'Cuna o moisés', icon: '🛏️', claimed: false },
  { name: 'Carreola', icon: '🚼', claimed: false },
  { name: 'Peluches', icon: '🧸', claimed: false },
  { name: 'Libros infantiles', icon: '📚', claimed: false },
  { name: 'Toallas y mantas', icon: '🧣', claimed: false },
  { name: 'Bañera para bebé', icon: '🛁', claimed: false },
  { name: 'Monitor de bebé', icon: '📻', claimed: false },
  { name: 'Silla para auto', icon: '🚗', claimed: false },
  { name: 'Tarjetas de regalo', icon: '💳', claimed: false },
];

const defaultNamePoll: string[] = ['Sofía', 'Valentina', 'Isabella', 'Camila', 'Luciana', 'Emilia'];

const defaultEventConfig: EventConfig = {
  parentNames: 'María & Carlos',
  babyName: 'Baby',
  eventDate: '2025-08-16',
  eventTime: '15:00',
  eventLocation: 'Jardín de la Hacienda Los Olivos',
  eventAddress: 'Calle Principal #123, Ciudad',
  dressCode: 'Rosa, Dorado o Blanco',
  gender: 'girl',
  theme: 'Rosado y Dorado',
  schedule: defaultSchedule,
  giftRegistry: defaultGifts,
  namePoll: defaultNamePoll,
};

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function generateSlug(name: string, lastName: string): string {
  return `${name}-${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ==================== INVITATIONS ====================

export function getInvitations(): Invitation[] {
  const data = localStorage.getItem(INVITATIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getInvitationById(id: string): Invitation | undefined {
  return getInvitations().find(inv => inv.id === id);
}

export function getInvitationBySlug(slug: string): Invitation | undefined {
  return getInvitations().find(inv => inv.slug === slug);
}

export function saveInvitation(invitation: Invitation): void {
  const invitations = getInvitations();
  const index = invitations.findIndex(inv => inv.id === invitation.id);
  if (index >= 0) {
    invitations[index] = { ...invitation, updatedAt: new Date().toISOString() };
  } else {
    invitations.push(invitation);
  }
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
}

export function deleteInvitation(id: string): void {
  const invitations = getInvitations().filter(inv => inv.id !== id);
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
}

export function markInvitationViewed(slug: string): void {
  const invitations = getInvitations();
  const index = invitations.findIndex(inv => inv.slug === slug);
  if (index >= 0 && !invitations[index].viewed) {
    invitations[index].viewed = true;
    invitations[index].viewedAt = new Date().toISOString();
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
  }
}

export function updateRSVP(slug: string, response: Invitation['rsvpResponse']): void {
  const invitations = getInvitations();
  const index = invitations.findIndex(inv => inv.slug === slug);
  if (index >= 0) {
    invitations[index].rsvpResponse = response;
    invitations[index].status = response?.attending ? 'confirmed' : 'declined';
    invitations[index].updatedAt = new Date().toISOString();
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
  }
}

export function getInvitationStats() {
  const invitations = getInvitations();
  return {
    total: invitations.length,
    confirmed: invitations.filter(i => i.status === 'confirmed').length,
    pending: invitations.filter(i => i.status === 'pending').length,
    declined: invitations.filter(i => i.status === 'declined').length,
    viewed: invitations.filter(i => i.viewed).length,
    totalGuests: invitations.reduce((acc, i) => {
      if (i.status === 'confirmed' && i.rsvpResponse) {
        return acc + 1 + i.rsvpResponse.plusOnesCount;
      }
      return acc + 1 + i.plusOnes;
    }, 0),
  };
}

// ==================== WISH MESSAGES ====================

export function getWishMessages(): WishMessage[] {
  const data = localStorage.getItem(WISH_MESSAGES_KEY);
  return data ? JSON.parse(data) : [];
}

export function addWishMessage(msg: WishMessage): void {
  const messages = getWishMessages();
  messages.push(msg);
  localStorage.setItem(WISH_MESSAGES_KEY, JSON.stringify(messages));
}

// ==================== NAME POLL VOTES ====================

export function getNamePollVotes(): Record<string, number> {
  const data = localStorage.getItem(NAME_POLL_KEY);
  return data ? JSON.parse(data) : {};
}

export function voteName(name: string): void {
  const votes = getNamePollVotes();
  votes[name] = (votes[name] || 0) + 1;
  localStorage.setItem(NAME_POLL_KEY, JSON.stringify(votes));
}

// ==================== EVENT CONFIG ====================

export function getEventConfig(): EventConfig {
  const data = localStorage.getItem(EVENT_CONFIG_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    return {
      ...defaultEventConfig,
      ...parsed,
      schedule: parsed.schedule || defaultSchedule,
      giftRegistry: parsed.giftRegistry || defaultGifts,
      namePoll: parsed.namePoll || defaultNamePoll,
    };
  }
  return defaultEventConfig;
}

export function saveEventConfig(config: EventConfig): void {
  localStorage.setItem(EVENT_CONFIG_KEY, JSON.stringify(config));
}

// ==================== ADMIN AUTH ====================

export function loginAdmin(username: string, password: string): boolean {
  if (username === 'admin' && password === 'babyshower2025') {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    return true;
  }
  return false;
}

export function isAdminAuthenticated(): boolean {
  return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
}

export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_AUTH_KEY);
}

// ==================== EXPORT/IMPORT ====================

export function exportData(): string {
  return JSON.stringify({
    invitations: getInvitations(),
    eventConfig: getEventConfig(),
    wishes: getWishMessages(),
    namePollVotes: getNamePollVotes(),
  }, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.invitations) localStorage.setItem(INVITATIONS_KEY, JSON.stringify(data.invitations));
    if (data.eventConfig) localStorage.setItem(EVENT_CONFIG_KEY, JSON.stringify(data.eventConfig));
    if (data.wishes) localStorage.setItem(WISH_MESSAGES_KEY, JSON.stringify(data.wishes));
    if (data.namePollVotes) localStorage.setItem(NAME_POLL_KEY, JSON.stringify(data.namePollVotes));
    return true;
  } catch {
    return false;
  }
}

// ==================== SEED DEMO DATA ====================
// ⚠️ CRITICAL: This runs synchronously at module import time,
// BEFORE any React component renders. This ensures data is available
// on the very first render.

function createDemoData(): void {
  const demoInvitations: Invitation[] = [
    {
      id: 'demo-ana-1', slug: 'ana-lopez', guestName: 'Ana', guestLastName: 'López',
      customMessage: '¡Tu presencia es el mejor regalo! 🎁', plusOnes: 2, tableNumber: '1',
      status: 'confirmed', viewed: true, viewedAt: new Date(Date.now() - 86400000).toISOString(),
      rsvpResponse: { attending: true, plusOnesCount: 1, message: '¡Estoy súper emocionada! 💕', dietaryRestrictions: '', respondedAt: new Date(Date.now() - 43200000).toISOString() },
      createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-carlos-2', slug: 'carlos-ramirez', guestName: 'Carlos', guestLastName: 'Ramírez',
      customMessage: '¡Nos encantaría compartir este momento contigo! 💕', plusOnes: 1, tableNumber: '2',
      status: 'confirmed', viewed: true, viewedAt: new Date(Date.now() - 172800000).toISOString(),
      rsvpResponse: { attending: true, plusOnesCount: 1, message: '¡Ahí estaremos!', dietaryRestrictions: 'Sin gluten', respondedAt: new Date(Date.now() - 86400000).toISOString() },
      createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-sofia-3', slug: 'sofia-martinez', guestName: 'Sofía', guestLastName: 'Martínez',
      customMessage: '¡Eres parte especial de nuestra familia! 👨‍👩‍👧', plusOnes: 0, tableNumber: '3',
      status: 'pending', viewed: true, viewedAt: new Date(Date.now() - 43200000).toISOString(),
      createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-pedro-4', slug: 'pedro-gomez', guestName: 'Pedro', guestLastName: 'Gómez',
      customMessage: '¡No puede faltar tu alegría en este día! 🎉', plusOnes: 3, tableNumber: '4',
      status: 'pending', viewed: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-lucia-5', slug: 'lucia-torres', guestName: 'Lucía', guestLastName: 'Torres',
      customMessage: '¡Ven a celebrar con nosotros esta nueva vida! 🍼', plusOnes: 1, tableNumber: '5',
      status: 'declined', viewed: true, viewedAt: new Date(Date.now() - 3600000).toISOString(),
      rsvpResponse: { attending: false, plusOnesCount: 0, message: '¡Qué pena! Tengo un viaje programado 😢', dietaryRestrictions: '', respondedAt: new Date(Date.now() - 3600000).toISOString() },
      createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-diego-6', slug: 'diego-hernandez', guestName: 'Diego', guestLastName: 'Hernández',
      customMessage: '¡Tu amor y compañía son todo lo que necesitamos! 💖', plusOnes: 2, tableNumber: '6',
      status: 'confirmed', viewed: true, viewedAt: new Date(Date.now() - 7200000).toISOString(),
      rsvpResponse: { attending: true, plusOnesCount: 2, message: '¡Vamos con toda la familia! 🎉', dietaryRestrictions: 'Vegetariano', respondedAt: new Date(Date.now() - 3600000).toISOString() },
      createdAt: new Date(Date.now() - 43200000).toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-elena-7', slug: 'elena-ruiz', guestName: 'Elena', guestLastName: 'Ruiz',
      customMessage: '¡Nos encantaría que estés ahí! 🌸', plusOnes: 0, tableNumber: '7',
      status: 'pending', viewed: false,
      createdAt: new Date(Date.now() - 43200000).toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-marco-8', slug: 'marco-diaz', guestName: 'Marco', guestLastName: 'Díaz',
      customMessage: '¡Tu sonrisa es imprescindible! 😊', plusOnes: 1, tableNumber: '1',
      status: 'pending', viewed: false,
      createdAt: new Date(Date.now() - 21600000).toISOString(), updatedAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(demoInvitations));

  const demoWishes: WishMessage[] = [
    { id: 'wish-1', author: 'Ana López', message: '¡Muchas felicidades! Este bebé va a ser súper amado 💕', createdAt: new Date(Date.now() - 86400000).toISOString(), slug: 'ana-lopez' },
    { id: 'wish-2', author: 'Carlos Ramírez', message: '¡Qué emoción! No veo la hora de conocer al bebé 🍼', createdAt: new Date(Date.now() - 43200000).toISOString(), slug: 'carlos-ramirez' },
    { id: 'wish-3', author: 'Diego Hernández', message: 'Serán los mejores papás del mundo 🌟', createdAt: new Date(Date.now() - 3600000).toISOString(), slug: 'diego-hernandez' },
  ];
  localStorage.setItem(WISH_MESSAGES_KEY, JSON.stringify(demoWishes));

  const demoVotes: Record<string, number> = { 'Sofía': 5, 'Valentina': 8, 'Isabella': 3, 'Camila': 6, 'Luciana': 4, 'Emilia': 2 };
  localStorage.setItem(NAME_POLL_KEY, JSON.stringify(demoVotes));
}

export function forceSeedDemoData(): void {
  localStorage.removeItem(INVITATIONS_KEY);
  localStorage.removeItem(WISH_MESSAGES_KEY);
  localStorage.removeItem(NAME_POLL_KEY);
  createDemoData();
}

export function seedDemoData(): void {
  const existing = getInvitations();
  if (existing.length > 0) return;
  createDemoData();
}

// ⚠️ AUTO-SEED: Run synchronously at module load time
// This ensures invitations exist BEFORE any React component renders
seedDemoData();
