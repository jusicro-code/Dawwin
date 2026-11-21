import 'server-only';
// Server-only secrets. Never import this file from a client component.
export const serverEnv = {
  internalSecret: process.env.INTERNAL_RPC_SECRET || '',
  cronSecret: process.env.CRON_SECRET || '',
  moyasar: {
    secretKey: process.env.MOYASAR_SECRET_KEY || '',
    publishableKey: process.env.MOYASAR_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.MOYASAR_WEBHOOK_SECRET || '',
  },
  tabby: {
    secretKey: process.env.TABBY_SECRET_KEY || '',
    publicKey: process.env.TABBY_PUBLIC_KEY || '',
    merchantCode: process.env.TABBY_MERCHANT_CODE || '',
    webhookSecret: process.env.TABBY_WEBHOOK_SECRET || '',
  },
  tamara: {
    apiToken: process.env.TAMARA_API_TOKEN || '',
    notificationToken: process.env.TAMARA_NOTIFICATION_TOKEN || '',
    baseUrl: process.env.TAMARA_API_BASE_URL || 'https://api-sandbox.tamara.co',
  },
  whatsapp: {
    token: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    templateName: process.env.WHATSAPP_TEMPLATE_ORDER_UPDATE || '',
    templateLang: process.env.WHATSAPP_TEMPLATE_LANG || 'ar',
  },
};
export const providerConfigured = {
  moyasar: () => !!(serverEnv.moyasar.secretKey && serverEnv.moyasar.publishableKey),
  tabby: () => !!(serverEnv.tabby.secretKey && serverEnv.tabby.merchantCode),
  tamara: () => !!(serverEnv.tamara.apiToken && serverEnv.tamara.notificationToken),
  whatsapp: () => !!(serverEnv.whatsapp.token && serverEnv.whatsapp.phoneNumberId && serverEnv.whatsapp.templateName),
};
export const isSandbox = (key: string) => /test|sandbox|sk_test|pk_test/i.test(key);
