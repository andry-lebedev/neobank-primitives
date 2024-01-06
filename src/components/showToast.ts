type ToastType = 'success' | 'error'

export function showToast(message: string, type: ToastType = 'success') {
  window.dispatchEvent(new CustomEvent(`api-${type}`, { detail: { message } }))
}
