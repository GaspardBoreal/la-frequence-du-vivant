/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';

export type ActionType =
  | 'signup'
  | 'recovery'
  | 'magiclink'
  | 'invite'
  | 'email_change'
  | 'reauthentication';

export interface AuthEmailProps {
  brand: 'fj' | 'lfdv';
  action: ActionType;
  siteName: string;
  siteUrl: string;
  recipient: string;
  confirmationUrl?: string;
  token?: string;
  newEmail?: string;
}

interface EmailContent {
  subject: string;
  title: string;
  body: string;
  buttonText?: string;
  footer?: string;
}

const brandConfig = {
  fj: {
    name: 'Fréquence Jardin',
    logoUrl:
      'https://la-frequence-du-vivant.com/__l5e/assets-v1/5e277dd6-5b25-4f51-8a37-8dd2cca407f6/logo-germination.png',
    primary: '#0D6B58',
    accent: '#C9A84C',
    logoWidth: 80,
  },
  lfdv: {
    name: 'Les Marches du Vivant',
    logoUrl:
      'https://la-frequence-du-vivant.com/__l5e/assets-v1/ac3bea79-9e96-4d1f-9987-376d70361096/logo-lockup-vertical.png',
    primary: '#0D6B58',
    accent: '#C9A84C',
    logoWidth: 140,
  },
};

const contentMap: Record<'fj' | 'lfdv', Record<ActionType, EmailContent>> = {
  fj: {
    signup: {
      subject: 'Bienvenue dans Fréquence Jardin 🌱',
      title: 'Bienvenue dans Fréquence Jardin',
      body: 'Votre inscription est presque complète. Une confirmation, et vos premiers conseils jardins nourriciers s\'ouvrent à vous.',
      buttonText: 'Confirmer mon inscription',
    },
    recovery: {
      subject: 'Réinitialiser votre mot de passe — Fréquence Jardin',
      title: 'Un nouveau mot de passe pour votre jardin',
      body: 'Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable une heure. Si ce n\'est pas vous, ignorez simplement cet e-mail.',
      buttonText: 'Choisir un nouveau mot de passe',
    },

    magiclink: {
      subject: 'Votre lien de connexion — Fréquence Jardin',
      title: 'Votre lien de connexion',
      body: 'Cliquez ci-dessous pour accéder à votre espace Fréquence Jardin. Ce lien expire bientôt et ne peut être utilisé qu\'une seule fois.',
      buttonText: 'Me connecter',
      footer: 'Si vous n\'avez pas demandé ce lien, vous pouvez ignorer cet email.',
    },
    invite: {
      subject: 'Vous êtes invité sur Fréquence Jardin 🌱',
      title: 'Vous êtes invité',
      body: 'Vous avez été invité à rejoindre Fréquence Jardin. Suivez le lien ci-dessous pour accepter l\'invitation.',
      buttonText: 'Accepter l\'invitation',
      footer: 'Si vous ne connaissez pas cette invitation, vous pouvez ignorer cet email.',
    },
    email_change: {
      subject: 'Confirmez votre nouvelle adresse email — Fréquence Jardin',
      title: 'Confirmez votre nouvelle adresse email',
      body: 'Suivez le lien ci-dessous pour confirmer {newEmail} comme nouvelle adresse email de votre compte Fréquence Jardin.',
      buttonText: 'Confirmer la nouvelle adresse email',
      footer: 'Si vous n\'avez pas demandé ce changement, vous pouvez ignorer cet email.',
    },
    reauthentication: {
      subject: 'Votre code de vérification — Fréquence Jardin',
      title: 'Votre code de vérification',
      body: 'Utilisez le code ci-dessous pour vérifier votre identité. Il expire bientôt.',
      footer: 'Si vous n\'avez pas demandé ce code, vous pouvez ignorer cet email.',
    },
  },
  lfdv: {
    signup: {
      subject: 'Bienvenue dans les Marches du Vivant',
      title: 'Bienvenue dans les Marches du Vivant',
      body: 'Votre inscription est presque complète. Une confirmation, et vos premières marches s\'ouvrent à vous.',
      buttonText: 'Confirmer mon inscription',
    },
    recovery: {
      subject: 'Réinitialisez votre mot de passe — Les Marches du Vivant',
      title: 'Réinitialisez votre mot de passe',
      body: 'Nous avons reçu une demande de réinitialisation de votre mot de passe. Suivez le lien ci-dessous pour en choisir un nouveau.',
      buttonText: 'Réinitialiser mon mot de passe',
      footer: 'Si vous n\'avez pas fait cette demande, vous pouvez ignorer cet email.',
    },
    magiclink: {
      subject: 'Votre lien de connexion — Les Marches du Vivant',
      title: 'Votre lien de connexion',
      body: 'Suivez le lien ci-dessous pour vous connecter. Ce lien expire bientôt et ne peut être utilisé qu\'une seule fois.',
      buttonText: 'Me connecter',
      footer: 'Si vous n\'avez pas demandé ce lien, vous pouvez ignorer cet email.',
    },
    invite: {
      subject: 'Vous êtes invité sur les Marches du Vivant',
      title: 'Vous êtes invité',
      body: 'Vous avez été invité à créer un compte. Suivez le lien ci-dessous pour accepter.',
      buttonText: 'Accepter l\'invitation',
      footer: 'Si vous ne connaissez pas cette invitation, vous pouvez ignorer cet email.',
    },
    email_change: {
      subject: 'Confirmez votre nouvelle adresse email — Les Marches du Vivant',
      title: 'Confirmez votre nouvelle adresse email',
      body: 'Suivez le lien ci-dessous pour confirmer {newEmail} comme nouvelle adresse email.',
      buttonText: 'Confirmer la nouvelle adresse email',
      footer: 'Si vous n\'avez pas demandé ce changement, vous pouvez ignorer cet email.',
    },
    reauthentication: {
      subject: 'Votre code de vérification — Les Marches du Vivant',
      title: 'Votre code de vérification',
      body: 'Utilisez le code ci-dessous pour vérifier votre identité. Il expire bientôt.',
      footer: 'Si vous n\'avez pas demandé ce code, vous pouvez ignorer cet email.',
    },
  },
};

export function getSubject(brand: 'fj' | 'lfdv', action: ActionType): string {
  return contentMap[brand][action].subject;
}

export function AuthEmail(props: AuthEmailProps) {
  const {
    brand,
    action,
    siteName,
    siteUrl,
    recipient,
    confirmationUrl,
    token,
    newEmail,
  } = props;

  const config = brandConfig[brand];
  const content = contentMap[brand][action];
  const bodyText = content.body.replace('{newEmail}', newEmail || '');

  return (
    <Html>
      <Head />
      <Preview>{content.subject}</Preview>
      <Body
        style={{
          backgroundColor: '#ffffff',
          margin: 0,
          padding: 0,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '24px',
          }}
        >
          <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Img
              src={config.logoUrl}
              alt={config.name}
              width={config.logoWidth}
              style={{ margin: '0 auto', display: 'block' }}
            />
          </Section>

          <Section
            style={{
              backgroundColor: '#ffffff',
              padding: '32px',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
            }}
          >
            <Text
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: config.primary,
                margin: '0 0 16px',
              }}
            >
              {content.title}
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                color: '#55575d',
                margin: '0 0 24px',
              }}
            >
              {bodyText}
            </Text>

            {confirmationUrl && content.buttonText && (
              <Section style={{ textAlign: 'center', margin: '24px 0' }}>
                <Button
                  href={confirmationUrl}
                  style={{
                    backgroundColor: config.primary,
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  {content.buttonText}
                </Button>
              </Section>
            )}

            {action === 'reauthentication' && token && (
              <Section
                style={{
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  margin: '16px 0',
                }}
              >
                <Text
                  style={{
                    fontSize: '32px',
                    letterSpacing: '4px',
                    fontWeight: 700,
                    color: config.primary,
                    margin: 0,
                  }}
                >
                  {token}
                </Text>
              </Section>
            )}

            {content.footer && (
              <Text
                style={{
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#888888',
                  marginTop: '24px',
                }}
              >
                {content.footer}
              </Text>
            )}
          </Section>

          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Text
              style={{
                fontSize: '12px',
                color: '#aaaaaa',
                margin: 0,
              }}
            >
              {siteName} ·{' '}
              <a
                href={siteUrl}
                style={{
                  color: config.primary,
                  textDecoration: 'none',
                }}
              >
                {siteUrl}
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
