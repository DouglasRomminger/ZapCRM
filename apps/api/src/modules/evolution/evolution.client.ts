// Cliente HTTP para a Evolution API
// Documentação: https://doc.evolution-api.com

const BASE_URL = process.env.EVOLUTION_API_URL!
const API_KEY  = process.env.EVOLUTION_API_KEY!

const headers = () => ({
  apikey: API_KEY,
  'Content-Type': 'application/json',
})

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers ?? {}) },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Evolution API ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ─── Instância ────────────────────────────────────────────────────────────────

export interface CreateInstanceResult {
  instance: { instanceName: string; instanceId: string; status: string }
  hash: { apikey: string }
  webhook: unknown
  qrcode?: { base64: string; count: number }
}

export async function createInstance(instanceName: string): Promise<CreateInstanceResult> {
  return request('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  })
}

export interface ConnectionState {
  instance: { instanceName: string; state: 'open' | 'connecting' | 'close' }
}

export async function getConnectionState(instanceName: string): Promise<ConnectionState> {
  return request(`/instance/connectionState/${instanceName}`)
}

export interface QrCodeResult {
  base64?: string   // Evolution API v2 retorna direto: { base64, count }
  count?: number
  qrcode?: { base64: string; count: number }  // formato alternativo
}

export async function getQrCode(instanceName: string): Promise<QrCodeResult> {
  return request(`/instance/connect/${instanceName}`)
}

export async function logoutInstance(instanceName: string): Promise<void> {
  await request(`/instance/logout/${instanceName}`, { method: 'DELETE' })
}

export async function deleteInstance(instanceName: string): Promise<void> {
  await request(`/instance/delete/${instanceName}`, { method: 'DELETE' })
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export interface SetWebhookParams {
  instanceName: string
  webhookUrl: string
}

export async function setWebhook({ instanceName, webhookUrl }: SetWebhookParams): Promise<void> {
  await request(`/webhook/set/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: true,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
    }),
  })
}

// ─── Envio de mensagem ────────────────────────────────────────────────────────

export async function sendTextMessage(
  instanceName: string,
  numero: string,
  texto: string,
): Promise<void> {
  await request(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: numero,
      text: texto,
    }),
  })
}
