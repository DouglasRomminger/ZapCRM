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

export async function createInstance(
  instanceName: string,
  webhookUrl: string,
): Promise<CreateInstanceResult> {
  // Evolution API v2 exige o webhook aninhado já na criação da instância.
  return request('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        url: webhookUrl,
        byEvents: false,
        base64: true,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
      },
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
  // Evolution API v2: payload aninhado em `webhook` com `enabled:true`.
  // `headers.apikey` faz a Evolution enviar NOSSA chave global no header de todo webhook —
  // sem isso ela manda a apikey própria da instância e a validação de entrada recusa (401).
  await request(`/webhook/set/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        byEvents: false,
        base64: true,
        headers: { apikey: API_KEY },
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
      },
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
