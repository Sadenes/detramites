/**
 * Convierte IPv6 a IPv4 cuando es posible
 * @param ip Dirección IP (puede ser IPv4 o IPv6)
 * @returns Dirección IP en formato IPv4 cuando es posible
 */
export const convertToIPv4 = (ip: string): string => {
  if (!ip) return 'unknown';

  // Si es IPv6 localhost (::1), convertir a IPv4 localhost
  if (ip === '::1') {
    return '127.0.0.1';
  }

  // Si es IPv6 mapeada a IPv4 (::ffff:x.x.x.x), extraer la parte IPv4
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }

  // Si ya es IPv4 o no se puede convertir, retornar como está
  return ip;
};

/**
 * Obtiene la dirección IP del request en formato IPv4
 * @param req Request de Express
 * @returns Dirección IP en formato IPv4
 */
export const getClientIP = (req: any): string => {
  // Intentar obtener la IP real del cliente (considerando proxies)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.ip || req.connection?.remoteAddress || 'unknown';

  return convertToIPv4(ip);
};
