/**
 * Name, phone and email shared by the two lead forms on a home page, so a
 * buyer who fills one doesn't type their details again in the other. Lives
 * in memory for the page only; nothing is stored in the browser.
 */
export type Contact = { name: string; phone: string; email: string };

let contact: Contact = { name: "", phone: "", email: "" };
const listeners = new Set<() => void>();

export const getContact = () => contact;

export function setContact(next: Contact) {
  contact = next;
  listeners.forEach((l) => l());
}

export function subscribeContact(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const EMPTY: Contact = { name: "", phone: "", email: "" };
export const getServerContact = () => EMPTY;
