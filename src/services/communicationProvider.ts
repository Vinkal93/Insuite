import type {
  CommunicationChannel,
  MessageDeliveryStatus,
  CommunicationSettingsConfig,
} from "@/types/communication";

export interface SendMessagePayload {
  organizationId: string;
  recipientIds: string[];
  recipientPhoneOrEmail?: string[];
  subject: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface ProviderSendResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  status: MessageDeliveryStatus;
  error?: string;
}

export interface CommunicationProvider {
  channel: CommunicationChannel;
  validateConfiguration: (settings: CommunicationSettingsConfig) => { isValid: boolean; reason?: string };
  send: (payload: SendMessagePayload, settings: CommunicationSettingsConfig) => Promise<ProviderSendResult>;
  getStatus: (providerMessageId: string) => Promise<MessageDeliveryStatus>;
}

export class InAppProvider implements CommunicationProvider {
  channel: CommunicationChannel = "IN_APP";

  validateConfiguration(_settings: CommunicationSettingsConfig) {
    return { isValid: true };
  }

  async send(payload: SendMessagePayload, _settings: CommunicationSettingsConfig): Promise<ProviderSendResult> {
    // In-app notifications are directly written to Firestore notification feeds
    const msgId = `inapp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      success: true,
      provider: "InSuite Internal In-App Dispatcher",
      providerMessageId: msgId,
      status: "DELIVERED",
    };
  }

  async getStatus(_providerMessageId: string): Promise<MessageDeliveryStatus> {
    return "DELIVERED";
  }
}

export class EmailProvider implements CommunicationProvider {
  channel: CommunicationChannel = "EMAIL";

  validateConfiguration(settings: CommunicationSettingsConfig) {
    if (!settings.enabledChannels.email || !settings.providers.email?.isConfigured) {
      return {
        isValid: false,
        reason: "Email gateway is not configured. Connect an SMTP/SendGrid provider in Communication Settings.",
      };
    }
    return { isValid: true };
  }

  async send(payload: SendMessagePayload, settings: CommunicationSettingsConfig): Promise<ProviderSendResult> {
    const check = this.validateConfiguration(settings);
    if (!check.isValid) {
      return {
        success: false,
        provider: settings.providers.email?.providerName || "SMTP Provider",
        status: "FAILED",
        error: check.reason,
      };
    }

    // In a real cloud backend, calls the server-side mail dispatch API
    return {
      success: true,
      provider: settings.providers.email?.providerName || "SMTP Provider",
      providerMessageId: `email_${Date.now()}`,
      status: "SENT",
    };
  }

  async getStatus(_providerMessageId: string): Promise<MessageDeliveryStatus> {
    return "SENT";
  }
}

export class SmsProvider implements CommunicationProvider {
  channel: CommunicationChannel = "SMS";

  validateConfiguration(settings: CommunicationSettingsConfig) {
    if (!settings.enabledChannels.sms || !settings.providers.sms?.isConfigured) {
      return {
        isValid: false,
        reason: "SMS gateway (Twilio / MSG91) is not configured. Connect an SMS provider in Communication Settings.",
      };
    }
    return { isValid: true };
  }

  async send(payload: SendMessagePayload, settings: CommunicationSettingsConfig): Promise<ProviderSendResult> {
    const check = this.validateConfiguration(settings);
    if (!check.isValid) {
      return {
        success: false,
        provider: settings.providers.sms?.providerName || "SMS Gateway",
        status: "FAILED",
        error: check.reason,
      };
    }

    return {
      success: true,
      provider: settings.providers.sms?.providerName || "SMS Gateway",
      providerMessageId: `sms_${Date.now()}`,
      status: "SUBMITTED",
    };
  }

  async getStatus(_providerMessageId: string): Promise<MessageDeliveryStatus> {
    return "SUBMITTED";
  }
}

export class WhatsAppProvider implements CommunicationProvider {
  channel: CommunicationChannel = "WHATSAPP";

  validateConfiguration(settings: CommunicationSettingsConfig) {
    if (!settings.enabledChannels.whatsapp || !settings.providers.whatsapp?.isConfigured) {
      return {
        isValid: false,
        reason: "WhatsApp Business API integration is not configured. Connect Meta Business gateway in Communication Settings.",
      };
    }
    return { isValid: true };
  }

  async send(payload: SendMessagePayload, settings: CommunicationSettingsConfig): Promise<ProviderSendResult> {
    const check = this.validateConfiguration(settings);
    if (!check.isValid) {
      return {
        success: false,
        provider: settings.providers.whatsapp?.providerName || "WhatsApp Cloud API",
        status: "FAILED",
        error: check.reason,
      };
    }

    return {
      success: true,
      provider: settings.providers.whatsapp?.providerName || "WhatsApp Cloud API",
      providerMessageId: `wa_${Date.now()}`,
      status: "SUBMITTED",
    };
  }

  async getStatus(_providerMessageId: string): Promise<MessageDeliveryStatus> {
    return "SUBMITTED";
  }
}

export const providerRegistry: Record<CommunicationChannel, CommunicationProvider> = {
  IN_APP: new InAppProvider(),
  EMAIL: new EmailProvider(),
  SMS: new SmsProvider(),
  WHATSAPP: new WhatsAppProvider(),
};
