import yaml from 'js-yaml';

export const DEFAULT_DNS_CONFIG = {
    enable: true,
    ipv6: false,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    'fake-ip-filter': [
        'geosite:private',
        'geosite:category-ntp'
    ],
    'use-hosts': true,
    nameserver: [
        'https://doh.pub/dns-query',
        'https://dns.alidns.com/dns-query'
    ],
    'default-nameserver': [
        '223.5.5.5',
        '119.29.29.29'
    ],
    fallback: [
        'https://doh-pure.onedns.net/dns-query',
        'https://ada.openbld.net/dns-query',
        'https://223.5.5.5/dns-query',
        'https://223.6.6.6/dns-query'
    ],
    'fallback-filter': {
        geoip: true,
        ipcidr: ['240.0.0.0/4', '0.0.0.0/32']
    }
};

function cloneDefaultDns() {
    return {
        ...DEFAULT_DNS_CONFIG,
        'fake-ip-filter': [...DEFAULT_DNS_CONFIG['fake-ip-filter']],
        nameserver: [...DEFAULT_DNS_CONFIG.nameserver],
        'default-nameserver': [...DEFAULT_DNS_CONFIG['default-nameserver']],
        fallback: [...DEFAULT_DNS_CONFIG.fallback],
        'fallback-filter': {
            ...DEFAULT_DNS_CONFIG['fallback-filter'],
            ipcidr: [...DEFAULT_DNS_CONFIG['fallback-filter'].ipcidr]
        }
    };
}

function parseOverride(raw) {
    if (typeof raw !== 'string' || !raw.trim()) return null;

    try {
        const parsed = yaml.load(raw.trim());
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
        const dns = parsed.dns && typeof parsed.dns === 'object' && !Array.isArray(parsed.dns)
            ? parsed.dns
            : parsed;
        return dns && typeof dns === 'object' && !Array.isArray(dns) ? dns : null;
    } catch {
        return null;
    }
}

/**
 * 解析 DNS 覆盖配置，同时保留安全默认值作为缺失/错误字段的兜底。
 * 强制关闭 IPv6/follow-rule，避免 TUN DNS 递归链再次出现。
 */
export function resolveSafeDnsConfig(raw) {
    const override = parseOverride(raw);
    const dns = { ...cloneDefaultDns(), ...(override || {}) };

    dns.enable = true;
    dns.ipv6 = false;
    dns['enhanced-mode'] = 'fake-ip';
    if (!Array.isArray(dns.nameserver) || dns.nameserver.length === 0) {
        dns.nameserver = [...DEFAULT_DNS_CONFIG.nameserver];
    }
    if (!Array.isArray(dns['default-nameserver']) || dns['default-nameserver'].length === 0) {
        dns['default-nameserver'] = [...DEFAULT_DNS_CONFIG['default-nameserver']];
    }
    if (!Array.isArray(dns.fallback) || dns.fallback.length === 0) {
        dns.fallback = [...DEFAULT_DNS_CONFIG.fallback];
    }
    delete dns['respect-rules'];

    return dns;
}
