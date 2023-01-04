import client from './client'

function compactObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

export function getCustomer(id) {
  return client.get(`/v1/customers/${id}`).then(r => r.data)
}

export function getBalances(id) {
  return client.get(`/v1/customers/${id}/balances`).then(r => r.data)
}

export function initiateKyc(customerId, level = 'simplified') {
  return client.post(`/v1/customers/${customerId}/kyc`, { level }).then(r => r.data)
}

export function createCustomer({
  firstName,
  middleName,
  lastName,
  birthDate,
  email,
  phone,
  address,
  taxInfo,
  externalId,
  metadata,
}) {
  const body = {
    type: 'individual',
    personal: compactObject({ firstName, middleName, lastName, birthDate, email, phone }),
  }

  if (externalId) body.externalId = externalId
  if (metadata) body.metadata = metadata

  if (address && ['country', 'streetLine1', 'streetLine2', 'city', 'state', 'postalCode'].every(k => address[k])) {
    body.address = address
  }

  if (taxInfo && taxInfo.country && taxInfo.type && taxInfo.value) {
    body.taxInfo = taxInfo
  }

  return client.post('/v2/customers', body).then(r => r.data)
}
