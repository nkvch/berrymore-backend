import * as mustache from 'mustache';
import { emailtemplate } from './resources/emailtemplate';

export const prepareEmail = (token: string) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;

  return mustache.render(emailtemplate, { token, verificationLink });
};
