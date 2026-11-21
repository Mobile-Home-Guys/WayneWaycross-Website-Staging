/**
 * GoHighLevel (Lead Connector) for the site's lead forms. Server only.
 *
 * Needs a Private Integration token for Waycross's sub-account and its
 * Location ID, read from the environment under any of the names below (the
 * same names our other dealer sites use). Without them nothing is sent and
 * callers fall back to logging the lead.
 *
 * This file never creates, renames or deletes a GHL custom field. Answers
 * always land in one contact note that is updated as the buyer goes; an
 * answer also fills a custom field when the sub-account already has one
 * named "Buyer Profile – <question>" (the naming the Korte site uses).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** GHL_API_BASE only exists for local testing against a mock server. */
const API = process.env.GHL_API_BASE?.trim() || "https://services.leadconnectorhq.com";
const VERSION = "2021-07-28";

const TOKEN_VARS = ["GHL_API_KEY", "GHL_API_TOKEN", "GHL_PRIVATE_TOKEN", "GHL_PRIVATE_INTEGRATION_TOKEN", "GHL_TOKEN"];
const LOCATION_VARS = ["GHL_LOCATION_ID", "GHL_SUB_ACCOUNT_ID", "LOCATION_ID"];
export const FIELD_PREFIX = "Buyer Profile – ";

function config() {
  const pick = (names: string[]) => names.map((n) => process.env[n]?.trim()).find(Boolean);
  const token = pick(TOKEN_VARS);
  const locationId = pick(LOCATION_VARS);
  return token && locationId ? { token, locationId } : null;
}

export const ghlConfigured = () => config() !== null;

async function call<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: VERSION,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

let fieldCache: { at: number; byName: Map<string, string> } | null = null;

/** Existing contact custom fields by name → id. Read only; cached 10 minutes. */
async function existingFields(token: string, locationId: string) {
  if (fieldCache && Date.now() - fieldCache.at < 600_000) return fieldCache.byName;
  try {
    const r = await call<{ customFields?: { id: string; name: string }[] }>(
      token,
      "GET",
      `/locations/${encodeURIComponent(locationId)}/customFields?model=contact`,
    );
    fieldCache = { at: Date.now(), byName: new Map((r.customFields ?? []).map((f) => [f.name.trim(), f.id])) };
  } catch {
    fieldCache = { at: Date.now(), byName: new Map() };
  }
  return fieldCache.byName;
}

export type LeadWrite = {
  name: string;
  email: string;
  phone: string;
  source: string;
  tags: string[];
  /** Question label → answer, in order. */
  answers: [string, string][];
  /** Full text of the note; replaces the note given by `noteId`. */
  note: string;
  noteId?: string;
  contactId?: string;
};

/**
 * Create or update the contact (matched by email/phone), add tags, fill any
 * matching existing custom fields and write the running note. Returns ids,
 * or an error message.
 */
export async function writeLead(lead: LeadWrite): Promise<{ contactId: string; noteId?: string } | string> {
  const cfg = config();
  if (!cfg) return "not configured";
  const { token, locationId } = cfg;
  try {
    const fields = await existingFields(token, locationId);
    const customFields = lead.answers.flatMap(([label, value]) => {
      const id = fields.get(FIELD_PREFIX + label);
      return id && value ? [{ id, field_value: value }] : [];
    });
    const [firstName, ...rest] = lead.name.trim().split(/\s+/);
    const res = await call<{ contact?: { id?: string } }>(token, "POST", "/contacts/upsert", {
      locationId,
      name: lead.name,
      firstName,
      lastName: rest.join(" ") || undefined,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      ...(customFields.length ? { customFields } : {}),
    });
    const contactId = res.contact?.id;
    if (!contactId) throw new Error("upsert answered without a contact id");

    /* Tags are added, never replaced, so the contact keeps any it had. */
    if (lead.tags.length) {
      await call(token, "POST", `/contacts/${contactId}/tags`, { tags: lead.tags }).catch(() => null);
    }

    let noteId = lead.contactId === contactId ? lead.noteId : undefined;
    if (noteId) {
      await call(token, "PUT", `/contacts/${contactId}/notes/${noteId}`, { body: lead.note }).catch(() => {
        noteId = undefined;
      });
    }
    if (!noteId) {
      const made = await call<{ note?: { id?: string } }>(token, "POST", `/contacts/${contactId}/notes`, {
        body: lead.note,
      }).catch(() => null);
      noteId = made?.note?.id;
    }
    return { contactId, noteId };
  } catch (err) {
    return (err as Error).message;
  }
}

/* The browser carries the contact and note ids between steps in a signed
   token, so a request can only update the note its own form created. */
const secret = () => config()?.token ?? "unset";

export function signIds(ids: { contactId: string; noteId?: string }) {
  const payload = Buffer.from(JSON.stringify(ids)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function readIds(token: unknown): { contactId: string; noteId?: string } | undefined {
  if (typeof token !== "string" || !token.includes(".")) return undefined;
  const [payload, mac] = token.split(".");
  const want = createHmac("sha256", secret()).update(payload).digest();
  const got = Buffer.from(mac, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return undefined;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return undefined;
  }
}
