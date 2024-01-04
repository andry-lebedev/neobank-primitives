export function showToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent(`api-${type}`, { detail: { message } }))
}
