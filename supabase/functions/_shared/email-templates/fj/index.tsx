/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1';
import { AuthEmail, AuthEmailProps } from '../AuthEmail.tsx';

type TemplateProps = Omit<AuthEmailProps, 'brand'>;

export const templates = {
  signup: (props: TemplateProps) => (
    <AuthEmail {...props} brand="fj" action="signup" />
  ),
  recovery: (props: TemplateProps) => (
    <AuthEmail {...props} brand="fj" action="recovery" />
  ),
  magiclink: (props: TemplateProps) => (
    <AuthEmail {...props} brand="fj" action="magiclink" />
  ),
  invite: (props: TemplateProps) => (
    <AuthEmail {...props} brand="fj" action="invite" />
  ),
  email_change: (props: TemplateProps) => (
    <AuthEmail {...props} brand="fj" action="email_change" />
  ),
  reauthentication: (props: TemplateProps) => (
    <AuthEmail {...props} brand="fj" action="reauthentication" />
  ),
};
