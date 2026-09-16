// Global registry for tracking which card is in the center of the viewport on mobile devices

type Listener = (activeId: string | null) => void;

class MobileCenterTracker {
  private cards: Map<string, HTMLElement> = new Map();
  private listeners: Set<Listener> = new Set();
  private currentActiveId: string | null = null;
  private isListening = false;
  private rafId: number | null = null;

  public register(id: string, element: HTMLElement) {
    this.cards.set(id, element);
    if (!this.isListening && typeof window !== 'undefined') {
      this.startListening();
    }
    this.scheduleCheck();
  }

  public unregister(id: string) {
    this.cards.delete(id);
    if (this.currentActiveId === id) {
      this.currentActiveId = null;
      this.notify();
    }
    if (this.cards.size === 0) {
      this.stopListening();
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.currentActiveId);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private startListening() {
    this.isListening = true;
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('resize', this.handleScroll, { passive: true });
  }

  private stopListening() {
    this.isListening = false;
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll);
      window.removeEventListener('resize', this.handleScroll);
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private handleScroll = () => {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.checkCenterCard();
    });
  };

  private scheduleCheck() {
    if (this.rafId !== null) return;
    if (typeof window !== 'undefined') {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.checkCenterCard();
      });
    }
  }

  private checkCenterCard() {
    if (typeof window === 'undefined') return;
    // Only active on mobile viewport (< 768px)
    if (window.innerWidth >= 768) {
      if (this.currentActiveId !== null) {
        this.currentActiveId = null;
        this.notify();
      }
      return;
    }

    const viewportCenter = window.innerHeight / 2;
    let closestId: string | null = null;
    let minDistance = Infinity;

    // Threshold: card center must be within 35% of viewport center to activate
    const maxThreshold = window.innerHeight * 0.35;

    this.cards.forEach((el, id) => {
      // Check if element is still connected to DOM
      if (!el.isConnected) {
        return;
      }
      const rect = el.getBoundingClientRect();
      // Only consider cards that have some visibility in viewport
      if (rect.bottom <= 50 || rect.top >= window.innerHeight - 50) {
        return;
      }

      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(cardCenter - viewportCenter);

      if (distance < minDistance && distance <= maxThreshold) {
        minDistance = distance;
        closestId = id;
      }
    });

    if (this.currentActiveId !== closestId) {
      this.currentActiveId = closestId;
      this.notify();
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentActiveId));
  }
}

export const mobileCenterTracker = new MobileCenterTracker();
