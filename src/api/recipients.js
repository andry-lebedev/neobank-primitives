import client from './client'

function compact(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

export function listRecipients(customerId) {
  return client.get(`/v1/customers/${customerId}/recipients`).then(r => r.data)
}

export function createRecipient(customerId, { type = 'individual', relationship, firstName, lastName, companyName, email, phone }) {
  const body = compact({ type, relationship, firstName, lastName, companyName, email, phone })
  return client.post(`/v1/customers/${customerId}/recipients`, body).then(r => r.data)
}

export function listRecipientAccounts(customerId, recipientId) {
  return client.get(`/v1/customers/${customerId}/recipients/${recipientId}/accounts`).then(r => r.data)
}

export function createRecipientAccount(customerId, recipientId, { rail = 'sepa', details }) {
  return client.post(`/v1/customers/${customerId}/recipients/${recipientId}/accounts`, { rail, details }).then(r => r.data)
}
