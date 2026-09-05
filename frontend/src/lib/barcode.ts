import JsBarcode from 'jsbarcode'

export type BarcodeRollWidth = 58 | 80

function isValidEan(codigo: string) {
  if (!/^\d{8}$|^\d{13}$/.test(codigo)) return false
  const digits = codigo.split('').map(Number)
  const checkDigit = digits.pop()!
  const total = digits.reverse().reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 3 : 1), 0)
  return (10 - total % 10) % 10 === checkDigit
}

export function getBarcodeFormat(codigo: string) {
  if (/^\d{13}$/.test(codigo) && isValidEan(codigo)) return 'EAN13'
  if (/^\d{8}$/.test(codigo) && isValidEan(codigo)) return 'EAN8'
  return 'CODE128'
}

export function renderBarcode(svg: SVGSVGElement, codigo: string, ancho: BarcodeRollWidth, height?: number) {
  JsBarcode(svg, codigo, {
    format: getBarcodeFormat(codigo),
    width: ancho === 80 ? 1.8 : 1.3,
    height: height ?? (ancho === 80 ? 72 : 58),
    displayValue: false,
    margin: 0,
  })
}
