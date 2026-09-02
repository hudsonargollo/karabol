import QRCode from 'qrcode';

/** Renders a redemption/QR-payload string as a data: URL PNG for direct <img>/<Image> use. */
export function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 320 });
}
