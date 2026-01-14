import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const smsProvider = {
  async send(to, message) {
    return client.messages.create({
      body: message,
      messagingServiceSid: "MG9752274e9e519418a7406176694466fa",
      from: "+998990706999",
      to,
    });
  },
};

export default smsProvider;
